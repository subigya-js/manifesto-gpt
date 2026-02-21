"use client";

import { clsx, type ClassValue } from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import {
    ArrowLeft,
    Send,
    Sparkles,
    User
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { use, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const parties = {
    nc: { name: "Nepali Congress", image: "/images/congress.png", color: "emerald" },
    uml: { name: "CPN (UML)", image: "/images/uml.png", color: "red" },
    rsp: { name: "Rastriya Swatantra Party", image: "/images/rsp.png", color: "blue" },
    ssp: { name: "Shram Sanskriti Party", image: "/images/shram.png", color: "orange" },
    compare: { name: "Manifesto Comparison", image: null, color: "zinc" }
};

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
}

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const party = parties[id as keyof typeof parties] || parties.nc;
    const isCompare = id === "compare";

    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "1",
            role: "assistant",
            content: isCompare
                ? "Hello! I can help you compare the manifestos of NC, UML, RSP, and SSP. What specific policy area would you like to compare? (e.g., Education, Tourism, or Economy)"
                : `Namaste! I am your AI assistant for ${party.name}. You can ask me anything about our election manifesto and visions for Nepal's future.`
        }
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input
        };

        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setIsTyping(true);

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [...messages, userMessage].map(m => ({
                        role: m.role,
                        content: m.content
                    })),
                    partyId: id
                })
            });

            if (!response.ok) throw new Error("Failed to fetch");

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: ""
            };

            setMessages(prev => [...prev, assistantMessage]);
            setIsTyping(false);

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    setMessages(prev => {
                        const newMessages = [...prev];
                        const lastMsg = newMessages[newMessages.length - 1];
                        if (lastMsg && lastMsg.role === "assistant") {
                            newMessages[newMessages.length - 1] = {
                                ...lastMsg,
                                content: lastMsg.content + chunk
                            };
                        }
                        return newMessages;
                    });
                }
            }
        } catch (error) {
            console.error("Chat Error:", error);
            setIsTyping(false);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: "assistant",
                content: "Sorry, I encountered an error. Please try again later."
            }]);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-black text-white font-[family-name:var(--font-poppins)]">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-900 bg-black/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <Link
                        href="/"
                        className="p-2 hover:bg-zinc-900 rounded-full transition-colors text-zinc-400 hover:text-white"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <div className="flex items-center gap-3">
                        {!isCompare && party.image && (
                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/95 p-1 flex items-center justify-center">
                                <Image
                                    src={party.image}
                                    alt={party.name}
                                    width={32}
                                    height={32}
                                    className="object-contain"
                                />
                            </div>
                        )}
                        {isCompare && (
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                                <Sparkles size={20} className="text-white" />
                            </div>
                        )}
                        <div>
                            <h1 className="text-sm font-bold tracking-tight">
                                {isCompare ? "Manifesto Comparison" : party.name}
                            </h1>
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">AI Assistant Active</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Messages */}
            <main className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth">
                <div className="max-w-3xl mx-auto space-y-8">
                    <AnimatePresence initial={false}>
                        {messages.map((message) => (
                            <motion.div
                                key={message.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={cn(
                                    "flex gap-4",
                                    message.role === "user" ? "flex-row-reverse" : "flex-row"
                                )}
                            >
                                <div className={cn(
                                    "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 overflow-hidden",
                                    message.role === "assistant"
                                        ? "bg-white text-zinc-400 p-1"
                                        : "bg-white text-black"
                                )}>
                                    {message.role === "assistant" ? (
                                        isCompare ? (
                                            <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                                                <Sparkles size={14} className="text-white" />
                                            </div>
                                        ) : (
                                            <Image
                                                src={party.image!}
                                                alt={party.name}
                                                width={24}
                                                height={24}
                                                className="object-contain"
                                            />
                                        )
                                    ) : (
                                        <User size={18} />
                                    )}
                                </div>
                                <div className={cn(
                                    "max-w-[80%] rounded-2xl px-5 py-3 text-sm leading-relaxed",
                                    message.role === "user"
                                        ? "bg-zinc-900 text-white rounded-tr-none"
                                        : "bg-zinc-950 border border-zinc-900 text-zinc-300 rounded-tl-none"
                                )}>
                                    {message.role === "assistant" ? (
                                        <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-800">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {message.content}
                                            </ReactMarkdown>
                                        </div>
                                    ) : (
                                        message.content
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {isTyping && (
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-lg bg-white p-1 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                {isCompare ? (
                                    <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center rounded-sm">
                                        <Sparkles size={12} className="text-white" />
                                    </div>
                                ) : (
                                    <Image
                                        src={party.image!}
                                        alt={party.name}
                                        width={24}
                                        height={24}
                                        className="object-contain"
                                    />
                                )}
                            </div>
                            <div className="bg-zinc-950 border border-zinc-900 text-zinc-300 rounded-2xl rounded-tl-none px-5 py-3 flex gap-1">
                                <span className="w-1.5 h-1.5 bg-zinc-700 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                <span className="w-1.5 h-1.5 bg-zinc-700 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                <span className="w-1.5 h-1.5 bg-zinc-700 rounded-full animate-bounce" />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </main>

            {/* Input Area */}
            <footer className="p-6 bg-black">
                <div className="max-w-3xl mx-auto relative group">
                    <div className="relative flex items-center gap-2 bg-zinc-950 border border-zinc-900 focus-within:border-zinc-700 rounded-2xl p-2 transition-all">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && handleSend()}
                            placeholder={isCompare ? "Ask to compare policies..." : `Ask about ${party.name} manifesto...`}
                            className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-4 py-2 placeholder:text-zinc-600 outline-none"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim()}
                            className={cn(
                                "p-3 rounded-xl transition-all duration-300",
                                input.trim()
                                    ? "bg-white text-black hover:scale-105 active:scale-95 shadow-lg shadow-white/5"
                                    : "bg-zinc-900 text-zinc-600"
                            )}
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            </footer>
        </div>
    );
}
