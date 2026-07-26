import { createFileRoute, Link } from "@tanstack/react-router";
import { Droplets, Moon, Activity, Sun, ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  profile,
  skinAnalysis,
  habits,
  meals,
  foodGuidance,
  reminders,
  products,
} from "@/lib/mock-data";
import scanVisual from "@/assets/scan-visual.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lumea — AI Skincare & Beauty Companion" },
      {
        name: "description",
        content:
          "Scan your skin, track water, food and sleep, and get AI-matched skincare, makeup and best-price shopping picks — all in one daily dashboard.",
      },
      { property: "og:title", content: "Lumea — AI Skincare & Beauty Companion" },
      {
        property: "og:description",
        content:
          "AI skin analysis, lifestyle tracking, personalised routines and smart price comparison in one beauty platform.",
      },
    ],
  }),
  component: Today,
});

const habitCards = [
  { key: "water", label: "Water", icon: Droplets, data: habits.water },
  { key: "sleep", label: "Sleep", icon: Moon, data: habits.sleep },
  { key: "steps", label: "Movement", icon: Activity, data: habits.steps },
  { key: "uv", label: "UV Index", icon: Sun, data: habits.uv },
] as const;

function Today() {
  return (
    <AppShell>
      <section className="surface glow-veil relative overflow-hidden p-6 sm:p-10">
        <img
          src={scanVisual}
          alt=""
          aria-hidden="true"
          width={1024}
          height={1024}
          className="pointer-events-none absolute -top-10 -right-16 hidden w-[26rem] opacity-70 mix-blend-multiply md:block"
        />
        <div className="relative max-w-xl">
          <p className="eyebrow">{profile.lastScan}</p>
          <h1 className="mt-3 text-4xl sm:text-5xl">Good morning, {profile.name.split(" ")[0]}.</h1>
          <p className="mt-4 text-muted-foreground">
            Your skin health score improved {skinAnalysis.scoreDelta} points this week. Hydration is
            still the limiting factor — UV index is {habits.uv.current} today, so sunscreen is
            non-negotiable.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link to="/scan">
                Start face scan <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/routine">Today&apos;s routine</Link>
            </Button>
          </div>
          <div className="mt-8 flex items-end gap-6">
            <div>
              <p className="eyebrow">Skin health</p>
              <p className="font-display text-5xl leading-none">{skinAnalysis.healthScore}</p>
            </div>
            <div>
              <p className="eyebrow">Lifestyle</p>
              <p className="font-display text-5xl leading-none">{habits.lifestyleScore}</p>
            </div>
            <div className="flex flex-wrap gap-1.5 pb-1">
              {profile.goals.map((g) => (
                <Badge key={g} variant="secondary">
                  {g}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {habitCards.map(({ key, label, icon: Icon, data }) => {
          const pct =
            key === "uv"
              ? Math.min(100, (data.current / 11) * 100)
              : Math.min(100, (data.current / data.goal) * 100);
          return (
            <div key={key} className="surface p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{label}</p>
                <Icon className="size-4 text-muted-foreground" />
              </div>
              <p className="mt-3 font-display text-2xl">
                {data.current}
                {data.unit}
                {key === "uv" ? null : (
                  <span className="text-base text-muted-foreground">
                    {" / "}
                    {data.goal}
                    {data.unit}
                  </span>
                )}
              </p>
              <Progress value={pct} className="mt-3 h-1.5" />
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="surface p-6 lg:col-span-2">
          <PageHeaderInline title="Food log" subtitle="Today · 1,750 kcal" />
          <ul className="mt-4 divide-y divide-border">
            {meals.map((m) => (
              <li key={m.slot} className="flex items-center gap-3 py-3">
                <span className="w-20 shrink-0 text-sm font-medium">{m.slot}</span>
                <span className="flex-1 text-sm text-muted-foreground">{m.items}</span>
                <span className="text-sm tabular-nums">{m.kcal} kcal</span>
                {m.skinSafe ? (
                  <CheckCircle2 className="size-4 text-success" />
                ) : (
                  <XCircle className="size-4 text-destructive" />
                )}
              </li>
            ))}
          </ul>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <GuidanceList title="Skin-friendly today" items={foodGuidance.eat} tone="sage" />
            <GuidanceList title="Better to avoid" items={foodGuidance.avoid} tone="clay" />
          </div>
        </div>

        <div className="surface p-6">
          <PageHeaderInline title="Reminders" subtitle="Smart notifications" />
          <ul className="mt-4 space-y-3">
            {reminders.map((r) => (
              <li key={r.label} className="flex items-start gap-3">
                <span
                  className={`mt-1.5 size-2 shrink-0 rounded-full ${
                    r.tone === "sage" ? "bg-sage" : "bg-clay"
                  }`}
                />
                <div>
                  <p className="text-sm font-medium">{r.label}</p>
                  <p className="text-xs text-muted-foreground">{r.time}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-6 rounded-xl bg-muted p-4">
            <p className="eyebrow">Best deal today</p>
            <p className="mt-1.5 text-sm">
              {products[0].name} at ₹{products[0].stores[2].price} on Amazon — 15% OFF.
            </p>
            <Button asChild variant="link" className="mt-1 h-auto p-0">
              <Link to="/products">Compare all stores</Link>
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function PageHeaderInline({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <h2 className="text-xl">{title}</h2>
      <span className="text-xs text-muted-foreground">{subtitle}</span>
    </div>
  );
}

function GuidanceList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "sage" | "clay";
}) {
  return (
    <div
      className={`rounded-xl p-4 ${tone === "sage" ? "bg-accent/60" : "bg-clay/20"}`}
    >
      <p className="eyebrow">{title}</p>
      <ul className="mt-2 space-y-1 text-sm">
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
  );
}
