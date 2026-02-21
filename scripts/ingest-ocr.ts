import { Pinecone } from "@pinecone-database/pinecone";
import * as dotenv from "dotenv";
import fs from "fs";
import { OpenAI } from "openai";
import path from "path";
import { PDFParse } from "pdf-parse";
import { createWorker } from "tesseract.js";

dotenv.config({ path: ".env" });

const PINECONE_API_KEY = process.env.PINECONE;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const PINECONE_INDEX_NAME = "manifesto-gpt";

// Function to run OCR on the image buffer
async function extractTextFromImage(buffer: Buffer) {
    const worker = await createWorker("nep");
    const { data: { text } } = await worker.recognize(buffer);
    await worker.terminate();
    return text;
}

async function ingestOCR() {
    if (!PINECONE_API_KEY || !OPENAI_API_KEY) {
        console.error("Missing API keys in .env");
        return;
    }

    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
    const pc = new Pinecone({ apiKey: PINECONE_API_KEY });
    const index = pc.index(PINECONE_INDEX_NAME);

    const docsDir = path.join(process.cwd(), "docs");
    // Only process the files we know need OCR
    const filesToProcess = ["RSP.pdf", "Shram Sanskriti.pdf"];

    for (const file of filesToProcess) {
        console.log(`Processing Scanned PDF: ${file}...`);
        const filePath = path.join(docsDir, file);

        if (!fs.existsSync(filePath)) {
            console.error(`File not found: ${filePath}`);
            continue;
        }

        const dataBuffer = fs.readFileSync(filePath);

        console.log("Extracting pages as images...");
        const parser = new PDFParse({ data: dataBuffer });

        // getScreenshot renders each page into an image
        // we set imageBuffer to true to get the raw Uint8Array data
        const screenshots = await parser.getScreenshot({ imageBuffer: true, scale: 2 });

        let combinedText = "";

        console.log(`Found ${screenshots.pages.length} pages. Starting OCR...`);

        // Process each page
        for (const page of screenshots.pages) {
            if (page.data) {
                console.log(`Running OCR on page ${page.pageNumber}...`);
                // Convert Uint8Array to Node Buffer for tesseract
                const imageBuffer = Buffer.from(page.data);
                const text = await extractTextFromImage(imageBuffer);
                combinedText += text + "\n\n";
            }
        }

        console.log(`OCR Complete. Extracted ${combinedText.length} characters.`);

        const partyId = file === "RSP.pdf" ? "rsp" : "ssp";

        // Re-use the chunking logic (1500 chars)
        const chunkSize = 1500;
        const overlap = 300;
        const chunks = [];

        for (let i = 0; i < combinedText.length; i += (chunkSize - overlap)) {
            chunks.push(combinedText.slice(i, i + chunkSize));
        }

        console.log(`Generating embeddings and uploading ${chunks.length} chunks for ${partyId}...`);

        const batchSize = 20;
        for (let i = 0; i < chunks.length; i += batchSize) {
            const currentBatch = chunks.slice(i, i + batchSize);

            try {
                const embeddingsResponse = await openai.embeddings.create({
                    model: "text-embedding-3-small",
                    input: currentBatch.filter(c => c.trim().length > 0),
                });

                const vectors = embeddingsResponse.data.map((embedding, idx) => ({
                    id: `${partyId}-ocr-${i + idx}`,
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
            } catch (e) {
                console.error(`Error processing batch starting at index ${i}`, e);
            }
        }

        console.log(`Finished ${file}.`);
    }

    console.log("OCR Ingestion complete!");
}

ingestOCR().catch(console.error);
