import fs from "fs";
import path from "path";
import { PDFParse } from "pdf-parse";

async function debug() {
    const filePath = path.join(process.cwd(), "docs", "Shram Sanskriti.pdf");
    const dataBuffer = fs.readFileSync(filePath);
    const parser = new PDFParse({ data: dataBuffer });
    const textResult = await parser.getText();

    console.log("Extracted text length:", textResult.text.length);
    console.log("Sample text:", textResult.text.slice(0, 500));
}

debug().catch(console.error);
