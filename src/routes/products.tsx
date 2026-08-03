import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { useProducts } from "@/lib/products-context";
import { useScan } from "@/lib/scan-context";
import { SmartOfferCard } from "@/components/SmartOfferCard";
import productsHero from "@/assets/products-hero.jpg";
import { motion } from "framer-motion";
import { Loader2, Sparkles } from "lucide-react";

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
  const [filter, setFilter] = useState<"All" | "Skincare" | "Makeup" | "Favorites">("All");
  const { products, favorites, isLoading, isGenerating, generateRecommendations } = useProducts();
  const { currentScan } = useScan();

  const list = products.filter((p) => {
    if (filter === "Favorites") return favorites.includes(p.id);
    if (filter === "All") return true;
    return p.category === filter;
  });

  const skinTypeStr = currentScan?.skinType ? `Matched for ${currentScan.skinType}` : "AI Matched Products";

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
        title={skinTypeStr}
        description="Nothing is pre-decided. The AI engine filters the catalogue based on your skin type, concerns and goals — then compares live prices."
        action={
          <div className="flex flex-wrap gap-1 rounded-full bg-muted p-1">
            {(["All", "Skincare", "Makeup", "Favorites"] as const).map((f) => (
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
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p>Loading your recommendations...</p>
          </div>
        ) : isGenerating ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Sparkles className="h-8 w-8 animate-pulse text-primary mb-4" />
            <p>AI is analyzing your profile and generating matches...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center surface rounded-2xl">
            <Sparkles className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-xl font-medium mb-2">No recommendations yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Let our AI analyze your skin profile and generate personalized skincare and makeup recommendations.
            </p>
            <button 
              onClick={generateRecommendations}
              className="btn-primary rounded-full px-6 py-3"
            >
              Generate AI Recommendations
            </button>
          </div>
        ) : (
          <>
            <div className="flex justify-end mb-4">
              <button 
                onClick={generateRecommendations}
                className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
              >
                <Sparkles className="h-4 w-4" /> Refresh Recommendations
              </button>
            </div>
            
            {list.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No products found in this category.</p>
              </div>
            ) : (
              list.map((p) => (
                <SmartOfferCard key={p.id} product={p} />
              ))
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}


