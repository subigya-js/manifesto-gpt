import { Pinecone } from "@pinecone-database/pinecone";
import * as dotenv from "dotenv";
import { OpenAI } from "openai";

dotenv.config({ path: ".env" });

const PINECONE_API_KEY = process.env.PINECONE;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const PINECONE_INDEX_NAME = "manifesto-gpt";

async function testRetrieval() {
    if (!PINECONE_API_KEY || !OPENAI_API_KEY) {
        console.error("Missing API keys");
        return;
    }

    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
    const pc = new Pinecone({ apiKey: PINECONE_API_KEY });
    const index = pc.index(PINECONE_INDEX_NAME);

    const query = "what is nepali congress vision for VAT percentage increment and decrement?";
    console.log(`Testing retrieval for: "${query}"`);

    const translationResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: "You are an expert translator. Translate the following user query into formal Nepali language. Only output the translated text, nothing else." },
            { role: "user", content: query }
        ]
    });

    const translatedQuery = translationResponse.choices[0].message.content?.trim() || query;
    console.log(`Translated Query: "${translatedQuery}"`);

    const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: translatedQuery,
    });
    const vector = embeddingResponse.data[0].embedding;

    const results = await index.namespace("manifestos").query({
        vector,
        topK: 3,
        includeMetadata: true,
    });

    console.log("\nResults:");
    results.matches.forEach((match, i) => {
        const metadata = match.metadata as Record<string, unknown>;
        console.log(`\n[${i + 1}] Score: ${match.score}`);
        console.log(`Party: ${metadata?.partyId}`);
        console.log(`Text: ${(metadata?.text as string)?.slice(0, 200)}...`);
    });
}

testRetrieval().catch(console.error);
