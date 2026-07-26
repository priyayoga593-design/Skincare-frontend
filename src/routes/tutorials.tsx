import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Play, Clock, Sparkles } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { tutorials, safetyTips } from "@/lib/mock-data";

export const Route = createFileRoute("/tutorials")({
  head: () => ({
    meta: [
      { title: "AI Demo & Application Tutorials — Lumea" },
      {
        name: "description",
        content:
          "Step-by-step AI tutorials for your exact recommended products: quantity, placement, order, waiting time and makeup application walkthroughs.",
      },
      { property: "og:title", content: "AI Demo & Application Tutorials — Lumea" },
      {
        property: "og:description",
        content:
          "Guided skincare and makeup tutorials built around the products the AI picked for you.",
      },
    ],
  }),
  component: TutorialsPage,
});

function TutorialsPage() {
  const [active, setActive] = useState(0);
  const current = tutorials[active];

  return (
    <AppShell>
      <PageHeader
        eyebrow="Module 9 · AI demo & tutorial"
        title="How to actually use them"
        description="Every routine becomes a guided demo using your own recommended products — correct quantity, direction and timing."
      />

      <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
        <div className="space-y-3">
          {tutorials.map((t, i) => (
            <button
              key={t.title}
              onClick={() => setActive(i)}
              className={`surface w-full p-5 text-left transition-colors ${
                i === active ? "bg-accent/60" : "hover:bg-muted"
              }`}
            >
              <div className="flex items-center justify-between">
                <Badge variant="secondary">{t.kind}</Badge>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3.5" /> {t.duration}
                </span>
              </div>
              <p className="mt-2.5 font-display text-lg">{t.title}</p>
              <p className="text-xs text-muted-foreground">{t.steps.length} steps</p>
            </button>
          ))}
        </div>

        <div className="surface glow-veil p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl">{current.title}</h2>
            <button className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground transition-opacity hover:opacity-90">
              <Play className="size-3.5" /> Play with AI avatar
            </button>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            The 3D beauty assistant mirrors each step on a face matched to your tone and undertone.
          </p>

          <ol className="mt-7 space-y-5">
            {current.steps.map((s, i) => (
              <li key={s} className="flex gap-4">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-card font-display text-sm shadow-[var(--shadow-soft)]">
                  {i + 1}
                </span>
                <p className="pt-1.5 text-sm">{s}</p>
              </li>
            ))}
          </ol>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-muted p-4">
              <p className="eyebrow">Before &amp; after simulation</p>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Following this routine consistently projects a{" "}
                <span className="text-foreground">+11 skin health score</span> in 8 weeks, with acne
                density down roughly 30%.
              </p>
            </div>
            <div className="rounded-xl bg-clay/20 p-4">
              <p className="eyebrow">Safety first</p>
              <ul className="mt-1.5 space-y-1 text-sm">
                {safetyTips.slice(0, 3).map((t) => (
                  <li key={t} className="flex gap-2">
                    <Sparkles className="mt-0.5 size-3.5 shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
