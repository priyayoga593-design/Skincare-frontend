import { createFileRoute, Link } from "@tanstack/react-router";
import { Droplets, Moon, Activity, Sun, ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import {
  profile as fallbackProfile,
  skinAnalysis,
  habits,
  meals,
  foodGuidance,
  reminders,
  products,
} from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "360° Skincare — AI Skincare & Beauty Companion" },
      {
        name: "description",
        content:
          "Scan your skin, track water, food and sleep, and get AI-matched skincare, makeup and best-price shopping picks — all in one daily dashboard.",
      },
      { property: "og:title", content: "360° Skincare — AI Skincare & Beauty Companion" },
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

const GREETINGS = {
  morning: [
    "☀️ Good Morning, Beautiful!",
    "🌞 Good Morning! Let's Make Your Skin Glow.",
    "✨ Rise & Shine, Your Skin Deserves Care.",
    "💖 Start Your Day with Healthy Skin.",
    "🌸 Good Morning! Time for Your Skincare Routine.",
    "🌿 Wake Up, Glow Up!",
    "💧 Hydrate, Protect & Glow.",
    "🌼 Fresh Morning, Fresh Skin."
  ],
  afternoon: [
    "☀️ Good Afternoon!",
    "🌿 Keep Your Skin Fresh This Afternoon.",
    "💧 Stay Hydrated, Stay Radiant.",
    "✨ Your Skin Deserves Midday Care.",
    "🌸 Hope Your Skin Is Glowing Today.",
    "🌞 Protect Your Glow with SPF.",
    "💖 Healthy Skin Starts with Consistency."
  ],
  evening: [
    "🌇 Good Evening!",
    "🌸 Time to Refresh Your Skin.",
    "✨ Give Your Skin the Care It Deserves.",
    "💖 Relax & Rejuvenate Your Skin.",
    "🌿 Evening Glow Starts Here.",
    "💧 Wash Away the Day, Reveal Your Glow."
  ],
  night: [
    "🌙 Good Evening! Time for Your Night Routine.",
    "🌜 Good Night! Let Your Skin Recover.",
    "✨ Repair While You Rest.",
    "🌸 Night Care, Morning Glow.",
    "💖 Nourish Your Skin Before Bed.",
    "🌿 Sleep Well, Glow Better Tomorrow.",
    "💧 Your Skin Heals While You Sleep."
  ]
};

function getTimeOfDay(): "morning" | "afternoon" | "evening" | "night" {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 20) return "evening";
  return "night";
}

function DynamicGreeting() {
  const [timeOfDay, setTimeOfDay] = useState(getTimeOfDay());
  const [greetingIndex, setGreetingIndex] = useState(0);

  useEffect(() => {
    // Check time every minute in case they leave it open across boundaries
    const timeInterval = setInterval(() => {
      const newTime = getTimeOfDay();
      if (newTime !== timeOfDay) {
        setTimeOfDay(newTime);
        setGreetingIndex(0); // reset index on period change
      }
    }, 60000);

    // Rotate greeting every 8 seconds
    const rotateInterval = setInterval(() => {
      setGreetingIndex((prev) => {
        const list = GREETINGS[timeOfDay];
        let next = Math.floor(Math.random() * list.length);
        while (next === prev && list.length > 1) {
          next = Math.floor(Math.random() * list.length);
        }
        return next;
      });
    }, 8000);

    return () => {
      clearInterval(timeInterval);
      clearInterval(rotateInterval);
    };
  }, [timeOfDay]);

  const currentGreeting = GREETINGS[timeOfDay][greetingIndex];

  return (
    <div className="h-auto min-h-[3rem] sm:min-h-[3.5rem] flex items-center mb-1">
      <AnimatePresence mode="wait">
        <motion.h1
          key={currentGreeting}
          initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="text-3xl sm:text-4xl lg:text-5xl font-display font-medium leading-tight tracking-tight text-foreground"
        >
          {currentGreeting}
        </motion.h1>
      </AnimatePresence>
    </div>
  );
}

function Today() {
  const { user } = useAuth();
  const currentProfile = user?.profile || fallbackProfile;
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AppShell>
      <AnimatePresence>
        {showSplash && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
              className="flex flex-col items-center justify-center space-y-4"
            >
              <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                <span className="font-display text-4xl font-semibold tracking-tight text-primary">360°</span>
              </div>
              <h1 className="font-display text-3xl tracking-wide">360° Skincare</h1>
              <p className="text-muted-foreground text-sm uppercase tracking-widest">AI Skincare & Beauty</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: showSplash ? 2 : 0, duration: 0.6 }}
        className="surface glow-veil animate-float-slow relative overflow-hidden p-6 sm:p-10 rounded-3xl bg-blur-premium"
      >
        <div className="relative sm:w-[60%] lg:w-[65%] z-10 pr-4">
          <DynamicGreeting />
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Your skin health score improved {skinAnalysis.scoreDelta} points this week. Hydration is
            still the limiting factor — UV index is {habits.uv.current} today, so sunscreen is
            non-negotiable.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-4">
            <Button asChild size="lg" className="rounded-full shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
              <Link to="/scan">
                Start face scan <ArrowRight className="size-4 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full hover:bg-muted/50 transition-colors">
              <Link to="/routine">Today&apos;s routine</Link>
            </Button>
          </div>
          <div className="mt-10 flex items-end gap-8">
            <div>
              <p className="eyebrow mb-2">Skin health</p>
              <p className="font-display text-5xl leading-none text-primary">{skinAnalysis.healthScore}</p>
            </div>
            <div>
              <p className="eyebrow mb-2">Lifestyle</p>
              <p className="font-display text-5xl leading-none text-sage">{habits.lifestyleScore}</p>
            </div>
            <div className="flex flex-wrap gap-2 pb-1">
              {currentProfile.goals.map((g) => (
                <Badge key={g} variant="secondary" className="rounded-full bg-accent/30 border-none font-medium">
                  {g}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-[40%] sm:w-[35%] h-full pointer-events-none rounded-r-3xl overflow-hidden">
           <img src="https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?q=80&w=800&auto=format&fit=crop" className="w-full h-full object-cover object-left mask-image-gradient" alt="Abstract Background" />
        </div>
      </motion.section>

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
    <div className={`rounded-xl p-4 ${tone === "sage" ? "bg-accent/60" : "bg-clay/20"}`}>
      <p className="eyebrow">{title}</p>
      <ul className="mt-2 space-y-1 text-sm">
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
  );
}
