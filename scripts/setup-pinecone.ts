import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const PINECONE_API_KEY = process.env.PINECONE;

async function checkIndex() {
    if (!PINECONE_API_KEY) {
        console.error("Missing PINECONE key in .env");
        return;
    }

    const client = new PineconeClient({
        apiKey: PINECONE_API_KEY,
    });

    console.log("Checking Pinecone indexes...");
    const indexes = await client.listIndexes();
    console.log("Current indexes:", indexes.indexes?.map(i => i.name));

    const indexName = "manifesto-gpt";
    const exists = indexes.indexes?.some(i => i.name === indexName);

    if (!exists) {
        console.log(`Index "${indexName}" not found. Creating it...`);
        await client.createIndex({
            name: indexName,
            dimension: 1536, // dimension for text-embedding-3-small
            metric: "cosine",
            spec: {
                serverless: {
                    cloud: "aws",
                    region: "us-east-1",
                },
            },
        });
        console.log(`Index "${indexName}" creation initiated. Please wait a moment before running ingestion.`);
    } else {
        console.log(`Index "${indexName}" already exists.`);
    }
}

checkIndex().catch(console.error);
