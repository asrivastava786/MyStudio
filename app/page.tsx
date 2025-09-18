"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import hero from "@/assets/Zbag.jpeg";

//export const runtime = "edge"; //issue with cloudflare pages

export default function HandbagHome() {
  const [subscribed, setSubscribed] = useState(false);

  return (
    <div className="min-h-screen bg-black text-white">


      {/* Hero */}
      <section className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl sm:text-5xl font-semibold leading-tight tracking-tight">
              Unique Art‑Led Handbags only for you 
            </h1>
            <p className="mt-5 text-white/70 max-w-xl">
              Real designer bags. Limited drops. Crafted with intention. A black‑and‑white canvas that lets the artistry speak.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#collection" className="px-5 py-3 rounded-2xl bg-white text-black hover:bg-white/90 transition">
                Shop the Drop
              </a>
              <a href="#designers" className="px-5 py-3 rounded-2xl border border-white/20 hover:border-white/40">
                Meet the Artists
              </a>
            </div>
            <div className="mt-8 flex items-center gap-6 text-xs text-white/60">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-white/70" />
                Real designer royalties
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-white/70" />
                Limited editions
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-white/70" />
                EU fulfillment
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-[4/5] w-full rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
              
                <Image
                  src= {hero}
                  alt="Stylish black and white handbag"
                  fill   
                  className="object-cover"
                  sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
                  priority     
                  />
              
              <div className="w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.12),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.06),transparent)]" />
            </div>
            <div className="absolute -bottom-6 -left-6 hidden sm:block">
              <div className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur px-4 py-3 text-xs text-white/70 shadow-lg">
                Minimal. Bold. Timeless.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* USPs */}
      <section className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-12 grid sm:grid-cols-3 gap-4">
          {[
            { title: "Real Designer Bag", desc: "Every piece credited. Artists paid fairly." },
            { title: "Monochrome Aesthetic", desc: "Pure black & white to elevate any fit." },
            { title: "Sustainably Made", desc: "Small batches. EU-first logistics." },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-white/10 p-5 hover:border-white/20 transition">
              <h3 className="font-medium">{f.title}</h3>
              <p className="mt-1 text-sm text-white/60">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Collection grid */}
      <section id="collection" className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-2xl font-semibold">New Drop · Noir Series</h2>
            <a href="#" className="text-sm text-white/70 hover:text-white">View all</a>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <article
                key={i}
                className="group rounded-3xl border border-white/10 overflow-hidden hover:border-white/20 transition"
              >
                <div className="aspect-square bg-[conic-gradient(from_180deg,rgba(255,255,255,0.08),transparent_55%)] group-hover:bg-[conic-gradient(from_0deg,rgba(255,255,255,0.1),transparent_55%)] transition" />
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Monochrome Tote {i + 1}</h3>
                    <p className="text-sm text-white/60">Grained vegan leather</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">€{(120 + i * 5).toFixed(0)}</p>
                    <button className="mt-2 text-xs px-3 py-1.5 rounded-full border border-white/20 hover:border-white/40">
                      Shop
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Designers */}
      <section id="designers" className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-semibold">Featured Designers</h2>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
            {["Noor", "Mara", "Ivo"].map((name, idx) => (
              <div key={name} className="rounded-3xl border border-white/10 overflow-hidden">
                <div className="aspect-[4/5] bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.12),transparent_40%)]" />
                <div className="p-4">
                  <h3 className="font-medium">{name}</h3>
                  <p className="text-sm text-white/60">“Black & white lets form take the spotlight.”</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About strip */}
      <section id="about" className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-14 grid lg:grid-cols-3 gap-8 items-center">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-semibold">Built with artists. For collectors.</h2>
            <p className="mt-3 text-white/70 max-w-2xl">
              We collaborate with independent designers to craft limited monochrome handbags. Each piece is signed, numbered, and produced in small batches to minimize waste and maximize character.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 p-5">
            <ul className="text-sm space-y-2 text-white/70">
              <li>• Limited runs with drop calendar</li>
              <li>• Transparent royalties to creators</li>
              <li>• EU shipping & easy returns</li>
              <li>• Hand‑finish quality checks</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-2xl font-semibold">Get first dibs on drops</h2>
            <p className="mt-2 text-white/70">Join the Zory list. No spam, only art.</p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSubscribed(true);
            }}
            className="flex gap-3"
          >
            <input
              type="email"
              required
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-2xl bg-transparent border border-white/20 focus:outline-none focus:border-white/40 placeholder:text-white/40"
            />
            <button className="px-5 py-3 rounded-2xl bg-white text-black hover:bg-white/90 whitespace-nowrap">
              Subscribe
            </button>
          </form>
          {subscribed && (
            <p className="md:col-span-2 text-sm text-white/70">Thanks! You're on the list.</p>
          )}
        </div>
      </section>

      {/* Footer */}
      

    </div>
  );
}
