# Manifesto GPT 🗳️🤖

**Manifesto GPT** is an open-source, AI-powered chatbot platform that helps citizens explore, understand, and compare the election manifestos of political parties in Nepal — powered by RAG (Retrieval-Augmented Generation).

> 🌐 **Live Demo**: [manifesto-gpt.vercel.app](https://manifesto-gpt.vercel.app)

---

## 🚀 Vision

Our mission is to make political manifestos accessible and interactive. Instead of scrolling through lengthy PDF documents, users can ask specific questions about a party's stance on education, health, economy, or any other policy area and get instant, AI-driven answers grounded in official documents.

---

## ✨ Features

### 🗣️ Party-Specific Chat

Dedicated AI chat sessions for major political parties:

- **Nepali Congress (NC)**
- **CPN (UML)**
- **Rastriya Swatantra Party (RSP)**
- **Shram Sanskriti Party (SSP)**

Each chat is strictly grounded in that party's official manifesto — the AI will not mix information from other parties.

### ⚖️ Manifesto Comparison Mode

Ask a question and get a structured comparison across all parties. The AI briefly explains each party's stance and concludes which party has the most comprehensive vision for that topic.

### 🧠 RAG-Powered Responses

- User queries are translated to Nepali and embedded using OpenAI's `text-embedding-3-small` model.
- Relevant manifesto chunks are retrieved from a Pinecone vector database.
- GPT-4o-mini generates responses strictly from the retrieved context.
- All responses are streamed in real-time for an interactive experience.

### 📝 Markdown-Formatted Responses

AI responses are rendered with full Markdown support — including bold text, bullet points, numbered lists, and headings — for a clean, readable experience.

### 🖥️ Premium Dark UI

A sleek, minimal, and modern interface with smooth animations, auto-scrolling chat, and party-specific branding.

---

## 🛠️ Tech Stack

| Layer              | Technology                                                                                                                     |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| **Framework**      | [Next.js 16](https://nextjs.org/) (App Router)                                                                                 |
| **Language**       | [TypeScript](https://www.typescriptlang.org/)                                                                                  |
| **Styling**        | [Tailwind CSS 4](https://tailwindcss.com/) + [@tailwindcss/typography](https://github.com/tailwindlabs/tailwindcss-typography) |
| **Animations**     | [Framer Motion](https://www.framer.com/motion/)                                                                                |
| **Icons**          | [Lucide React](https://lucide.dev/)                                                                                            |
| **AI / LLM**       | [OpenAI](https://openai.com/) (GPT-4o-mini, text-embedding-3-small)                                                            |
| **Vector DB**      | [Pinecone](https://www.pinecone.io/) (Serverless)                                                                              |
| **PDF Processing** | [pdf-parse](https://www.npmjs.com/package/pdf-parse)                                                                           |
| **OCR**            | [Tesseract.js](https://tesseract.projectnaptha.com/) (Nepali language pack)                                                    |
| **Markdown**       | [react-markdown](https://github.com/remarkjs/react-markdown) + [remark-gfm](https://github.com/remarkjs/remark-gfm)            |

---

## 📐 Architecture

```
User Query (English/Nepali)
        │
        ▼
  ┌─────────────┐
  │  Translate   │ ← GPT-4o-mini translates query to Nepali
  │  to Nepali   │
  └──────┬──────┘
         ▼
  ┌─────────────┐
  │  Generate    │ ← OpenAI text-embedding-3-small
  │  Embedding   │
  └──────┬──────┘
         ▼
  ┌─────────────┐
  │  Pinecone    │ ← Vector similarity search with partyId filter
  │  Retrieval   │
  └──────┬──────┘
         ▼
  ┌─────────────┐
  │  GPT-4o-mini │ ← Generates answer from retrieved context
  │  Streaming   │
  └──────┬──────┘
         ▼
    Chat UI (Real-time streamed response)
```

---

## 🏁 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/)
- An [OpenAI API Key](https://platform.openai.com/api-keys)
- A [Pinecone API Key](https://www.pinecone.io/)

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/subigya-js/manifesto-gpt.git
   ```

   ```bash
   cd manifesto-gpt
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**

   Create a `.env` file in the root directory:

   ```env
   OPENAI_API_KEY=your_openai_api_key
   PINECONE=your_pinecone_api_key
   ```

4. **Set up the Pinecone index:**

   ```bash
   npx tsx scripts/setup-pinecone.ts
   ```

5. **Ingest the manifesto documents:**

   For text-based PDFs (NC, UML):

   ```bash
   npx tsx scripts/ingest.ts
   ```

   For scanned/image-based PDFs (RSP, SSP):

   ```bash
   npx tsx scripts/ingest-ocr.ts
   ```

6. **Run the development server:**

   ```bash
   npm run dev
   ```

7. **Open the app:**

   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📄 Source Documents

The platform is built using official 2024 election manifestos, stored in the `docs/` directory:

| Party                    | File                  | Type                    |
| ------------------------ | --------------------- | ----------------------- |
| Nepali Congress          | `nc.pdf`              | Text-based PDF          |
| CPN (UML)                | `uml.pdf`             | Text-based PDF          |
| Rastriya Swatantra Party | `RSP.pdf`             | Scanned (OCR processed) |
| Shram Sanskriti Party    | `Shram Sanskriti.pdf` | Scanned (OCR processed) |

---

## 🤝 Contributing

We love contributions! Whether you're fixing a bug, adding a new feature, or improving the documentation, your help is welcome.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Developed By

Maintained by **[subedi.js](https://subigyasubedi.com.np)**.

---

_Made with ❤️ for a more informed democracy._
