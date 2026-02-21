import { Pinecone } from "@pinecone-database/pinecone";
import * as dotenv from "dotenv";
import fs from "fs";
import { OpenAI } from "openai";
import path from "path";
import { PDFParse } from "pdf-parse";

dotenv.config({ path: ".env" });

const PINECONE_API_KEY = process.env.PINECONE;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const PINECONE_INDEX_NAME = "manifesto-gpt";

async function ingest() {
    if (!PINECONE_API_KEY || !OPENAI_API_KEY) {
        console.error("Missing API keys in .env");
        return;
    }

    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
    const pc = new Pinecone({ apiKey: PINECONE_API_KEY });
    const index = pc.index(PINECONE_INDEX_NAME);

    const docsDir = path.join(process.cwd(), "docs");
    const files = fs.readdirSync(docsDir).filter((f) => f.endsWith(".pdf"));

    for (const file of files) {
        console.log(`Processing ${file}...`);
        const filePath = path.join(docsDir, file);
        const dataBuffer = fs.readFileSync(filePath);

        // Using the new PDFParse API
        const parser = new PDFParse({ data: dataBuffer });
        const textResult = await parser.getText();
        const text = textResult.text;

        const partyId = file.toLowerCase().includes("congress")
            ? "nc"
            : file.toLowerCase().includes("uml")
                ? "uml"
                : file.toLowerCase().includes("rsp")
                    ? "rsp"
                    : file.toLowerCase().includes("shram")
                        ? "ssp"
                        : "unknown";

        // Simple chunking logic (1500 characters for better context)
        const chunkSize = 1500;
        const overlap = 300;
        const chunks = [];

        for (let i = 0; i < text.length; i += (chunkSize - overlap)) {
            chunks.push(text.slice(i, i + chunkSize));
        }

        console.log(`Generating embeddings and uploading ${chunks.length} chunks for ${partyId}...`);

        // Process in batches of 20
        const batchSize = 20;
        for (let i = 0; i < chunks.length; i += batchSize) {
            const currentBatch = chunks.slice(i, i + batchSize);

            const embeddingsResponse = await openai.embeddings.create({
                model: "text-embedding-3-small",
                input: currentBatch.filter(c => c.trim().length > 0),
            });

            const vectors = embeddingsResponse.data.map((embedding, idx) => ({
                id: `${partyId}-${file}-${i + idx}`,
                values: embedding.embedding,
                metadata: {
                    text: currentBatch[idx],
                    partyId,
                    source: file,
                },
            }));

            if (vectors.length > 0) {
                await index.namespace("manifestos").upsert({ records: vectors });
            }
        }

        console.log(`Finished ${file}.`);
    }

    console.log("Ingestion complete!");
}

ingest().catch(console.error);
