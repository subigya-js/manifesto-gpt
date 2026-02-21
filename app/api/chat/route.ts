import { Pinecone } from "@pinecone-database/pinecone";
import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";

const PINECONE_API_KEY = process.env.PINECONE;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const PINECONE_INDEX_NAME = "manifesto-gpt";

const PARTY_NAMES: Record<string, string> = {
    nc: "नेपाली कांग्रेस (Nepali Congress)",
    uml: "नेकपा एमाले (CPN UML)",
    rsp: "राष्ट्रिय स्वतन्त्र पार्टी (Rastriya Swatantra Party)",
    ssp: "श्रम संस्कृति पार्टी (Shram Sanskriti Party)",
};

const openai = new OpenAI({ apiKey: OPENAI_API_KEY || "" });
const pc = new Pinecone({ apiKey: PINECONE_API_KEY || "" });

export async function POST(req: NextRequest) {
    try {
        const { messages, partyId } = await req.json();
        const lastMessage = messages[messages.length - 1].content;

        if (!partyId) {
            return NextResponse.json({ error: "Missing partyId" }, { status: 400 });
        }

        // 1. Translate the user query to Nepali before generating embeddings
        // This ensures high semantic similarity with the Nepali source documents
        const translationResponse = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content:
                        "You are an expert translator. Translate the following user query into formal Nepali language suitable for searching a political party manifesto document. If the query is already in Nepali, just clean it up. Only output the translated text, nothing else.",
                },
                { role: "user", content: lastMessage },
            ],
        });

        const translatedQuery =
            translationResponse.choices[0].message.content?.trim() || lastMessage;
        console.log("[DEBUG] Original query:", lastMessage);
        console.log("[DEBUG] Translated query:", translatedQuery);
        console.log("[DEBUG] Party ID:", partyId);

        // 2. Generate embeddings for BOTH the original query and translated query
        // This dual-embedding approach improves retrieval for multilingual content
        const [embeddingOriginal, embeddingTranslated] = await Promise.all([
            openai.embeddings.create({
                model: "text-embedding-3-small",
                input: lastMessage,
            }),
            openai.embeddings.create({
                model: "text-embedding-3-small",
                input: translatedQuery,
            }),
        ]);

        const originalEmbedding = embeddingOriginal.data[0].embedding;
        const translatedEmbedding = embeddingTranslated.data[0].embedding;

        // 3. Search Pinecone with BOTH embeddings and merge results
        const index = pc.index(PINECONE_INDEX_NAME);
        const filter = partyId === "compare" ? undefined : { partyId };

        const [queryResponseOriginal, queryResponseTranslated] = await Promise.all([
            index.namespace("manifestos").query({
                vector: originalEmbedding,
                topK: 8,
                filter: filter,
                includeMetadata: true,
            }),
            index.namespace("manifestos").query({
                vector: translatedEmbedding,
                topK: 8,
                filter: filter,
                includeMetadata: true,
            }),
        ]);

        // Merge and deduplicate results, keeping the best score for each unique chunk
        const matchMap = new Map<string, (typeof queryResponseOriginal.matches)[0]>();
        for (const match of [
            ...queryResponseOriginal.matches,
            ...queryResponseTranslated.matches,
        ]) {
            const existing = matchMap.get(match.id);
            if (!existing || (match.score || 0) > (existing.score || 0)) {
                matchMap.set(match.id, match);
            }
        }

        // Sort by score descending and take the top 10
        const mergedMatches = Array.from(matchMap.values())
            .sort((a, b) => (b.score || 0) - (a.score || 0))
            .slice(0, 10);

        const contextChunks = mergedMatches
            .map((match) => (match.metadata as Record<string, unknown>)?.text)
            .filter(Boolean);

        const context = contextChunks.join("\n\n---\n\n");

        console.log("[DEBUG] Merged matches:", mergedMatches.length);
        mergedMatches.forEach((match, i) => {
            const metadata = match.metadata as Record<string, unknown>;
            console.log(
                `[DEBUG] Match ${i + 1}: score=${match.score}, partyId=${metadata?.partyId}, textLength=${(metadata?.text as string)?.length || 0}`
            );
        });
        console.log("[DEBUG] Total context length:", context.length);

        // 4. Construct the prompt with improved instructions
        const partyName = PARTY_NAMES[partyId] || partyId;

        const systemPrompt = `You are an AI assistant for "Manifesto GPT", a platform for exploring political party manifestos in Nepal. You are knowledgeable and helpful.

${partyId === "compare"
                ? "You are currently in Comparison Mode. You must briefly explain the vision and policies of ALL the different parties present in the context regarding the user's topic. After explaining each party's stance, you must conclude by evaluating which party has the best or most comprehensive vision for this specific topic based on the provided policies."
                : `You are an expert on ${partyName}. Your goal is to help users understand this party's manifesto, vision, policies, and commitments as described in the provided manifesto context.`
            }

Guidelines:
1. Use the provided manifesto context as your PRIMARY source of information to answer the user's question.
2. The context documents are extracted from official Nepali manifesto PDFs and are written in Nepali.
3. You MUST ALWAYS RESPOND IN NEPALI (देवनागरी लिपि), regardless of the language the user asks in.
4. When the user asks a broad question like "tell me about the manifesto" or "घोषणापत्रको बारेमा बताउनुहोस्", provide a comprehensive summary covering the main themes and policies visible in the context. DO NOT say you don't have information — instead, synthesize and summarize whatever is available in the context.
5. If the context contains relevant information, use it to craft a detailed, well-structured answer using bullet points, headers, or numbered lists for clarity.
6. Only say you don't have information if the context genuinely contains NOTHING remotely related to the user's question.
7. Use markdown formatting for better readability (headers, bullet points, bold text).
8. Maintain an informative, professional, and engaging tone.

MANIFESTO CONTEXT (from ${partyName}):
---
${context}
---

USER QUESTION:
${lastMessage}
`;

        // 5. Get response from OpenAI with a capable model
        const chatResponse = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                ...messages.slice(-5),
            ],
            stream: true,
            temperature: 0.3,
        });

        // 6. Stream the response
        const stream = new ReadableStream({
            async start(controller) {
                for await (const chunk of chatResponse) {
                    const content = chunk.choices[0]?.delta?.content || "";
                    if (content) {
                        controller.enqueue(new TextEncoder().encode(content));
                    }
                }
                controller.close();
            },
        });

        return new Response(stream);
    } catch (error: unknown) {
        console.error("Chat API Error:", error);
        const errorMessage =
            error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
