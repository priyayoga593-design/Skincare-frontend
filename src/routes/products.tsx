import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { products } from "@/lib/mock-data";
import { SmartOfferCard } from "@/components/SmartOfferCard";
import productsHero from "@/assets/products-hero.jpg";
import { motion } from "framer-motion";

export const Route = createFileRoute("/products")({
  head: () => ({
    meta: [
      { title: "AI Matched Products & Best Price — 360° Skincare" },
      {
        name: "description",
        content:
          "AI-matched skincare and makeup for your skin type, tone and undertone, with live price and offer comparison across brand stores, Nykaa, Amazon and Flipkart.",
      },
      { property: "og:title", content: "AI Matched Products & Best Price — 360° Skincare" },
      {
        property: "og:description",
        content:
          "Matched skincare and makeup picks with store-by-store price, discount and coupon comparison.",
      },
    ],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  const [filter, setFilter] = useState<"All" | "Skincare" | "Makeup">("All");
  const list = products.filter((p) => filter === "All" || p.category === filter);

  return (
    <AppShell>
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="surface mb-8 overflow-hidden rounded-2xl"
      >
        <img
          src={productsHero}
          alt="Minimal skincare bottles arranged on a warm neutral surface"
          width={1440}
          height={960}
          loading="lazy"
          className="h-44 w-full object-cover sm:h-56"
        />
      </motion.div>
      <PageHeader
        eyebrow="Matching + smart shopping"
        title="Matched for oily, medium, warm"
        description="Nothing is pre-decided. After your scan the engine filters the catalogue on skin type, tone, undertone, concerns and your fragrance allergy — then compares live prices."
        action={
          <div className="flex gap-1 rounded-full bg-muted p-1">
            {(["All", "Skincare", "Makeup"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full px-4 py-1.5 text-sm transition-all duration-300 ${
                  filter === f
                    ? "bg-primary text-primary-foreground shadow-md scale-105"
                    : "text-muted-foreground hover:bg-muted-foreground/10"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        }
      />

      <div className="space-y-8 mt-8">
        {list.map((p) => (
          <SmartOfferCard key={p.id} product={p} />
        ))}
      </div>
    </AppShell>
  );
}

