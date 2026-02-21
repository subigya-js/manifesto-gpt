"use client";

import { clsx, type ClassValue } from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRightLeft,
  Check,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const parties = [
  { id: "nc", label: "NC", name: "Nepali Congress", image: "/images/congress.png", border: "border-emerald-500/20" },
  { id: "uml", label: "UML", name: "CPN-UML", image: "/images/uml.png", border: "border-red-500/20" },
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
    <main className="relative min-h-screen w-full flex flex-col items-center justify-center bg-[#0a0a0a] text-white overflow-hidden selection:bg-purple-500/30">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-4xl px-6 py-12 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 bg-white to-zinc-400 bg-clip-text text-transparent">
            Manifesto Exploration
          </h1>
          <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto">
            Choose a party to explore their individual manifesto or select multiple to compare side-by-side.
          </p>
        </motion.div>

        {/* Party Selector Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 w-full mb-12">
          {parties.map((party, index) => {
            const isSelected = selectedParties.includes(party.id);
            return (
              <motion.div
                key={party.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="relative group"
              >
                {/* Individual View Link */}
                <Link
                  href={`/party/${party.id}`}
                  className={cn(
                    "flex flex-col items-center justify-center aspect-square rounded-3xl border transition-all duration-300",
                    "bg-zinc-950/50 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900",
                    isSelected && "ring-2 ring-white/20 border-zinc-700"
                  )}
                >
                  <div className={cn(
                    "mb-4 w-20 h-20 relative rounded-2xl overflow-hidden transition-transform duration-300 group-hover:scale-110 flex items-center justify-center shadow-lg",
                    "bg-white/95"
                  )}>
                    <Image
                      src={party.image}
                      alt={party.name}
                      width={70}
                      height={70}
                      className="object-contain"
                    />
                  </div>
                  <span className="text-xs text-zinc-500 font-medium uppercase tracking-widest text-center px-2 group-hover:text-zinc-300 transition-colors">
                    {party.name}
                  </span>
                </Link>

                {/* Compare Checkbox / Selection Toggle */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    toggleParty(party.id);
                  }}
                  className={cn(
                    "absolute top-4 right-4 w-6 h-6 rounded-full border border-white/10 flex items-center justify-center transition-all duration-300 hover:scale-110 z-20",
                    isSelected ? "bg-white border-white" : "bg-black/50 backdrop-blur-sm border-white/20"
                  )}
                  title="Select for comparison"
                >
                  <AnimatePresence mode="wait">
                    {isSelected ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        <Check className="w-4 h-4 text-black" strokeWidth={3} />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="plus"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="text-[10px] font-bold text-white/50"
                      >
                        +
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>

                {/* Glow effect on select */}
                <div className={cn(
                  "absolute inset-0 rounded-3xl transition-opacity duration-300 pointer-events-none",
                  isSelected ? "opacity-20" : "opacity-0",
                  "bg-gradient-to-br from-white/10 to-transparent"
                )} />
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
          <button
            disabled={selectedParties.length < 2}
            className={cn(
              "group relative overflow-hidden px-12 py-5 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center gap-3",
              selectedParties.length >= 2
                ? "bg-white text-black hover:pr-10 hover:shadow-[0_20px_40px_-15px_rgba(255,255,255,0.3)] active:scale-95 cursor-pointer"
                : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
            )}
          >
            <span className="relative z-10 font-[family-name:var(--font-poppins)]">Compare Policies</span>
            <ArrowRightLeft
              className={cn(
                "w-5 h-5 transition-all duration-300 group-hover:translate-x-1",
                selectedParties.length >= 2 ? "opacity-100" : "opacity-50"
              )}
            />
            {selectedParties.length < 2 && (
              <span className="absolute bottom-1 text-[10px] text-zinc-600 font-medium uppercase tracking-tighter">
                Select at least 2 parties
              </span>
            )}

            {/* Shimmer effect for active button */}
            {selectedParties.length >= 2 && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-200%]"
                animate={{ translateX: ["150%", "-150%"] }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              />
            )}
          </button>
        </motion.div>

        {/* Footer Info */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="mt-24 text-zinc-600 text-sm font-medium tracking-wide"
        >
          Developed by <span><Link href="https://subedi.js.org" className="hover:text-white transition-colors">Subedi.js</Link></span>
        </motion.p>
      </div>

      {/* Background Noise/Texture */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] contrast-150 brightness-150" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
    </main>
  );
}
