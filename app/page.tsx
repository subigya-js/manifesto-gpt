"use client";

import { useState } from "react";
import { clsx, type ClassValue } from "clsx";
import { motion } from "framer-motion";
import {
  ArrowRightLeft
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const parties = [
  { id: "nc", label: "NC", name: "Nepali Congress", image: "/images/congress.png", border: "border-emerald-500/20" },
  { id: "uml", label: "UML", name: "CPN (UML)", image: "/images/uml.png", border: "border-red-500/20" },
  { id: "rsp", label: "RSP", name: "Rastriya Swatantra Party", image: "/images/rsp.png", border: "border-blue-500/20" },
  { id: "ssp", label: "SSP", name: "Shram Sanskriti Party", image: "/images/shram.png", border: "border-orange-500/20" },
];

export default function Home() {
  const [selectedParties, setSelectedParties] = useState<string[]>([]);

  const toggleParty = (id: string) => {
    setSelectedParties((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  return (
    <main className="relative min-h-screen w-full flex flex-col items-center justify-center bg-black text-white overflow-hidden selection:bg-purple-500/30">

      <div className="relative z-10 w-full max-w-4xl px-6 py-12 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl font-bold tracking-tight mb-4 bg-white to-zinc-400 bg-clip-text text-transparent">
            Manifesto GPT
          </h1>
          <p className="text-zinc-400 text-md max-w-2xl mx-auto">
            Select a political party to start a dedicated chat about their manifesto, or use the comparison tool to see visions side-by-side.
          </p>
        </motion.div>

        {/* Party Selector Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 w-full mb-12">
          {parties.map((party, index) => {
            return (
              <motion.div
                key={party.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="relative group"
              >
                <Link
                  href={`/chat/${party.id}`}
                  className={cn(
                    "flex flex-col items-center justify-center aspect-square rounded-3xl border transition-all duration-300",
                    "bg-zinc-950/50 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 hover:scale-[1.02] active:scale-[0.98]"
                  )}
                >
                  <div className={cn(
                    "mb-4 w-20 h-20 relative rounded-2xl overflow-hidden transition-all duration-300 group-hover:scale-110 flex items-center justify-center shadow-lg",
                    "bg-white/95 group-hover:bg-white"
                  )}>
                    <Image
                      src={party.image}
                      alt={party.name}
                      width={70}
                      height={70}
                      className="object-contain"
                    />
                  </div>
                  <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest text-center px-4 group-hover:text-zinc-300 transition-colors">
                    {party.name}
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Action Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="w-full flex justify-center"
        >
          <Link
            href="/chat/compare"
            className={cn(
              "group relative overflow-hidden px-8 py-4 rounded-3xl font-bold text-lg transition-all duration-500 flex items-center gap-3",
              "bg-white text-black hover:pr-12 hover:shadow-[0_20px_60px_-15px_rgba(255,255,255,0.4)] active:scale-95 cursor-pointer"
            )}
          >
            <span className="relative z-10 font-[family-name:var(--font-poppins)] uppercase tracking-tight">Compare All Manifestos</span>
            <ArrowRightLeft
              className={cn(
                "w-5 h-5 transition-all duration-500 group-hover:translate-x-1"
              )}
            />

            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 translate-x-[-200%]"
              animate={{ translateX: ["150%", "-150%"] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
            />
          </Link>
        </motion.div>

        {/* Footer Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="mt-24 flex flex-col items-center gap-3 text-xs tracking-wide text-center"
        >
          <p className="text-zinc-600 font-medium">
            Developed for a more informed democracy by <span className="font-bold text-white/60 underline"><Link href="https://subigyasubedi.com.np" className="hover:text-white transition-colors" target="_blank">subedi.js</Link></span>
          </p>
          <div className="flex flex-col items-center gap-2">
            <p className="text-zinc-700 font-medium">
              This is an open-source project. We welcome your contributions on <Link href="https://github.com/subigya-js/manifesto-gpt" className="hover:text-white transition-colors text-white/85 underline font-semibold" target="_blank">GitHub</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
