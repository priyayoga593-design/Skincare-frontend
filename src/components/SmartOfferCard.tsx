import { Star, ShieldCheck, Tag, ExternalLink, ShoppingCart, Percent, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Product, useProducts } from "@/lib/products-context";
import { motion } from "framer-motion";

export function SmartOfferCard({ product: p }: { product: Product }) {
  const best = p.stores.find((s) => s.best) ?? p.stores[0];
  const { favorites, toggleFavorite } = useProducts();
  const isFavorite = favorites.includes(p.id);

  return (
    <motion.article 
      initial={{ opacity: 0, scale: 0.98 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.3 }}
      className="surface p-6 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all"
    >
      <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Product Image */}
          <div className="w-full md:w-48 h-48 shrink-0 rounded-2xl overflow-hidden bg-muted/30">
            <img 
              src={p.image} 
              alt={p.name} 
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            />
          </div>
          
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="bg-primary/10 text-primary border-transparent">{p.subcategory}</Badge>
              <Badge className="bg-sage text-sage-foreground">{p.match}% match</Badge>
              <span className="flex items-center gap-1 text-sm text-muted-foreground ml-auto">
                <Star className="size-3.5 fill-clay text-clay" />
                {p.rating} · {p.reviews.toLocaleString("en-IN")} reviews
              </span>
            </div>
            
            <div className="mt-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">{p.name}</h2>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mt-1">{p.brand}</p>
              </div>
              <button 
                onClick={() => toggleFavorite(p.id)}
                className="p-2 rounded-full hover:bg-muted/50 transition-colors shrink-0"
              >
                <Heart className={`size-6 ${isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
              </button>
            </div>

            <div className="mt-5 rounded-xl bg-gradient-to-r from-accent/50 to-transparent p-5 border border-accent">
              <p className="eyebrow flex items-center gap-2 text-primary">
                <ShieldCheck className="size-4" /> Why AI Recommended It
              </p>
              <p className="mt-2 text-sm leading-relaxed">{p.reason}</p>
            </div>

            <dl className="mt-6 grid gap-5 text-sm sm:grid-cols-2">
              <div>
                <dt className="eyebrow text-muted-foreground">Key ingredients</dt>
                <dd className="mt-1.5 font-medium">{p.ingredients.join(" · ")}</dd>
              </div>
              <div>
                <dt className="eyebrow text-muted-foreground">Benefits</dt>
                <dd className="mt-1.5 font-medium">{p.benefits.join(" · ")}</dd>
              </div>
              <div>
                <dt className="eyebrow text-muted-foreground">Suitable for</dt>
                <dd className="mt-1.5 font-medium">{p.suitable}</dd>
              </div>
              <div>
                <dt className="eyebrow text-muted-foreground">How to use</dt>
                <dd className="mt-1.5 font-medium">{p.usage}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold flex items-center gap-2">
                <ShoppingCart className="size-4" /> Smart Price Comparison
              </h3>
              <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                Live Prices
              </span>
            </div>
            <ul className="space-y-3">
              {p.stores.map((s, idx) => (
                <motion.li
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  key={s.store}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 border transition-colors ${
                    s.best 
                      ? "border-primary/50 bg-primary/5 shadow-md shadow-primary/5" 
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <span className="flex-1 text-sm font-medium">{s.store}</span>
                  <div className="flex flex-col items-end mr-4">
                    <span className="text-sm font-bold tabular-nums">₹{s.price}</span>
                    {s.offer && s.offer !== "—" && (
                      <span className="text-[10px] text-success font-semibold uppercase tracking-wider">
                        {s.offer}
                      </span>
                    )}
                  </div>
                  <Button size="sm" variant={s.best ? "default" : "secondary"} asChild className="rounded-full shadow-none group">
                    <a href={s.url} target="_blank" rel="noreferrer">
                      Buy
                      <ExternalLink className="ml-1.5 size-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </a>
                  </Button>
                </motion.li>
              ))}
            </ul>
          </div>
          
          <div className="mt-6 flex flex-col gap-2 rounded-xl bg-gradient-to-r from-clay/20 to-clay/5 border border-clay/20 px-4 py-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Tag className="size-4 text-clay" />
              Best deal today: {best.store} at ₹{best.price}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground pl-6">
              <Percent className="size-3" />
              {best.offer} — direct link available
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
