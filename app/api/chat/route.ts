import { Pinecone } from "@pinecone-database/pinecone";
import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";

const PINECONE_API_KEY = process.env.PINECONE;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const PINECONE_INDEX_NAME = "manifesto-gpt";

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
                { role: "system", content: "You are an expert translator. Translate the following user query into formal Nepali language. Only output the translated text, nothing else." },
                { role: "user", content: lastMessage }
            ]
        });

        const translatedQuery = translationResponse.choices[0].message.content?.trim() || lastMessage;

        // 2. Generate embedding for the translated query
        const embeddingResponse = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: translatedQuery,
        });
        const queryEmbedding = embeddingResponse.data[0].embedding;

        // 2. Search Pinecone for relevant context
        const index = pc.index(PINECONE_INDEX_NAME);

        // For "compare" mode, we don't apply the partyId filter
        const filter = partyId === "compare" ? undefined : { partyId };

        const queryResponse = await index.namespace("manifestos").query({
            vector: queryEmbedding,
            topK: 5,
            filter: filter,
            includeMetadata: true,
        });

        const contextChunks = queryResponse.matches
            .map((match) => (match.metadata as Record<string, unknown>)?.text)
            .filter(Boolean);

        const context = contextChunks.join("\n\n---\n\n");

        // 4. Construct the prompt
        const systemPrompt = `You are an AI assistant for "Manifesto GPT", a platform for exploring political party manifestos in Nepal. The provided context documents are written in Nepali.

${partyId === "compare"
                ? "You are currently in Comparison Mode. You must briefly explain the vision and policies of ALL the different parties present in the context regarding the user's topic. After explaining each party's stance, you must conclude by evaluating which party has the best or most comprehensive vision for this specific topic based on the provided policies."
                : `You are an expert on the ${partyId} party. You must ONLY respond based on the ${partyId} party's manifesto context provided. Do not mention other parties.`}

Guidelines:
1. Use ONLY the given context to answer the user's question.
2. The context is in Nepali. You MUST ALWAYS RESPOND IN NEPALI, regardless of the language the user asks the question in. Translate the user's question internally and provide the answer strictly in Nepali.
3. If the answer is not contained in the context, clearly state that you don't have that specific information in the manifesto documents, IN NEPALI.
4. Maintain an informative and professional tone.

CONTEXT:
${context}

USER QUESTION:
${lastMessage}
`;

        // 5. Get response from OpenAI
        const chatResponse = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                ...messages.slice(-5), // Send last 5 message for context
            ],
            stream: true,
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
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
