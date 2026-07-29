import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Clock, Sparkles, TrendingUp, Calendar, Heart, Share2, Save } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { tutorials, safetyTips, skinAnalysis } from "@/lib/mock-data";
import { AIVideoPlayer } from "@/components/AIVideoPlayer";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export const Route = createFileRoute("/tutorials")({
  head: () => ({
    meta: [
      { title: "AI Personalized Tutorial — 360° Skincare" },
      {
        name: "description",
        content:
          "Personalized step-by-step video tutorials based on your AI skin analysis and recommended products.",
      },
    ],
  }),
  component: TutorialsPage,
});

function TutorialsPage() {
  const [active, setActive] = useState(0);
  const current = tutorials[active];

  const handleSave = () => {
    toast.success("Tutorial saved to your history.");
  };

  return (
    <AppShell>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <PageHeader
          eyebrow="AI Personalized Video"
          title="Your Guided Routine"
          description="A fully customized video tutorial showing exactly how to apply your recommended products."
        />
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem] mt-6">
        {/* Main Player Section */}
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-3xl overflow-hidden ring-1 ring-border/50 shadow-2xl bg-card"
          >
            {/* The AIVideoPlayer */}
            {/* @ts-ignore - The types match but TS sometimes complains about dynamic imports in this setup */}
            <AIVideoPlayer tutorial={current} />
            
            <div className="p-6 bg-card border-t border-border/50 flex flex-wrap gap-4 items-center justify-between">
              <div>
                <h2 className="text-2xl font-display font-medium tracking-tight">{current.title}</h2>
                <p className="text-muted-foreground text-sm mt-1 flex items-center gap-2">
                  <Clock className="size-4" /> {current.duration} · AI Generated for {skinAnalysis.attributes.find(a => a.label === "Skin Type")?.value} Skin
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" className="rounded-full hover:bg-primary/10 hover:text-primary transition-colors">
                  <Heart className="size-5" />
                </Button>
                <Button variant="outline" size="icon" className="rounded-full hover:bg-primary/10 hover:text-primary transition-colors" onClick={handleSave}>
                  <Save className="size-5" />
                </Button>
                <Button variant="outline" size="icon" className="rounded-full hover:bg-primary/10 hover:text-primary transition-colors">
                  <Share2 className="size-5" />
                </Button>
              </div>
            </div>
          </motion.div>



        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="surface p-2 space-y-2">
            <h3 className="text-sm font-semibold p-3 pb-1">Your Video Library</h3>
            {tutorials.map((t, i) => (
              <button
                key={t.title}
                onClick={() => setActive(i)}
                className={`w-full p-4 rounded-xl text-left transition-all duration-300 relative overflow-hidden ${
                  i === active 
                    ? "bg-primary/10 text-primary border border-primary/20 shadow-sm" 
                    : "hover:bg-muted border border-transparent"
                }`}
              >
                {i === active && (
                  <motion.div 
                    layoutId="active-indicator"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-primary"
                  />
                )}
                <div className="flex items-center justify-between">
                  <Badge variant={i === active ? "default" : "secondary"} className={i === active ? "" : "opacity-70"}>{t.kind}</Badge>
                  <span className="flex items-center gap-1 text-xs opacity-70">
                    <Clock className="size-3.5" /> {t.duration}
                  </span>
                </div>
                <p className={`mt-2.5 font-display text-base font-medium ${i === active ? "text-primary" : "text-foreground"}`}>{t.title}</p>
                <p className="text-xs opacity-70 mt-1">{t.steps.length} steps</p>
              </button>
            ))}
          </div>

          <div className="surface p-5 bg-clay/5 border-clay/20">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <Sparkles className="size-4 text-clay" />
              AI Safety Tips
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {safetyTips.slice(0, 3).map((tip) => (
                <li key={tip} className="flex gap-2 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-clay mt-1.5 shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

