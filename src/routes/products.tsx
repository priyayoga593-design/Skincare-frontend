import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Star, Tag, ShieldCheck } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { products, type Product } from "@/lib/mock-data";
import productsHero from "@/assets/products-hero.jpg";

export const Route = createFileRoute("/products")({
  head: () => ({
    meta: [
      { title: "AI Matched Products & Best Price — Lumea" },
      {
        name: "description",
        content:
          "AI-matched skincare and makeup for your skin type, tone and undertone, with live price and offer comparison across brand stores, Nykaa, Amazon and Flipkart.",
      },
      { property: "og:title", content: "AI Matched Products & Best Price — Lumea" },
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
      <div className="surface mb-8 overflow-hidden">
        <img
          src={productsHero}
          alt="Minimal skincare bottles arranged on a warm neutral surface"
          width={1440}
          height={960}
          loading="lazy"
          className="h-44 w-full object-cover sm:h-56"
        />
      </div>
      <PageHeader
        eyebrow="Modules 7 & 8 · Matching + smart shopping"
        title="Matched for oily, medium, warm"
        description="Nothing is pre-decided. After your scan the engine filters the catalogue on skin type, tone, undertone, concerns and your fragrance allergy — then compares live prices."
        action={
          <div className="flex gap-1 rounded-full bg-muted p-1">
            {(["All", "Skincare", "Makeup"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                  filter === f
                    ? "bg-card text-foreground shadow-[var(--shadow-soft)]"
                    : "text-muted-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        }
      />

      <div className="space-y-6">
        {list.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </AppShell>
  );
}

function ProductCard({ product: p }: { product: Product }) {
  const best = p.stores.find((s) => s.best) ?? p.stores[0];
  return (
    <article className="surface p-6">
      <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{p.subcategory}</Badge>
            <Badge className="bg-sage text-sage-foreground">{p.match}% match</Badge>
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Star className="size-3.5 fill-clay text-clay" />
              {p.rating} · {p.reviews.toLocaleString("en-IN")} reviews
            </span>
          </div>
          <h2 className="mt-3 text-2xl">{p.name}</h2>
          <p className="text-sm text-muted-foreground">{p.brand}</p>

          <div className="mt-5 rounded-xl bg-accent/50 p-4">
            <p className="eyebrow">Why the AI recommended it</p>
            <p className="mt-1.5 text-sm">{p.reason}</p>
          </div>

          <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="eyebrow">Key ingredients</dt>
              <dd className="mt-1">{p.ingredients.join(" · ")}</dd>
            </div>
            <div>
              <dt className="eyebrow">Benefits</dt>
              <dd className="mt-1">{p.benefits.join(" · ")}</dd>
            </div>
            <div>
              <dt className="eyebrow">Suitable for</dt>
              <dd className="mt-1">{p.suitable}</dd>
            </div>
            <div>
              <dt className="eyebrow">How to use</dt>
              <dd className="mt-1">{p.usage}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl border border-border bg-muted/60 p-5">
          <div className="flex items-center justify-between">
            <p className="eyebrow">Price comparison</p>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5" /> Updated 2 min ago
            </span>
          </div>
          <ul className="mt-4 space-y-2">
            {p.stores.map((s) => (
              <li
                key={s.store}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${
                  s.best ? "bg-card shadow-[var(--shadow-soft)]" : ""
                }`}
              >
                <span className="flex-1 text-sm font-medium">{s.store}</span>
                <span className="text-sm tabular-nums">₹{s.price}</span>
                <span className="hidden w-36 text-right text-xs text-muted-foreground sm:block">
                  {s.offer}
                </span>
                <Button size="sm" variant={s.best ? "default" : "outline"}>
                  Buy
                </Button>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-clay/20 px-3 py-2.5 text-sm">
            <Tag className="size-4" />
            Best deal today: {best.store} at ₹{best.price} — {best.offer}
          </div>
        </div>
      </div>
    </article>
  );
}
