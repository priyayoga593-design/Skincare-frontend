import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Camera, Upload, ScanFace, ArrowRight } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { skinAnalysis, safetyTips } from "@/lib/mock-data";
import scanVisual from "@/assets/scan-visual.jpg";

export const Route = createFileRoute("/scan")({
  head: () => ({
    meta: [
      { title: "AI Face Scan & Skin Report — Lumea" },
      {
        name: "description",
        content:
          "Run an AI face scan to detect skin type, tone, undertone, acne, pigmentation, pores and hydration, with a single skin health score.",
      },
      { property: "og:title", content: "AI Face Scan & Skin Report — Lumea" },
      {
        property: "og:description",
        content:
          "Detect skin type, tone, undertone, acne, pigmentation and hydration with an AI face scan.",
      },
    ],
  }),
  component: ScanPage,
});

function ScanPage() {
  const [state, setState] = useState<"idle" | "scanning" | "done">("done");

  const run = () => {
    setState("scanning");
    setTimeout(() => setState("done"), 1800);
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Module 2 · AI face scan"
        title="Skin analysis"
        description="A single capture reads 14 skin markers. Results feed the recommendation engine, your routine and your product matches."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="surface glow-veil overflow-hidden p-6">
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted">
            <img
              src={scanVisual}
              alt="Face scan guide outline"
              width={1024}
              height={1024}
              loading="lazy"
              className="size-full object-cover"
            />
            <div className="absolute inset-6 rounded-[40%] border border-sage/70" />
            {state === "scanning" ? (
              <div className="absolute inset-x-0 top-0 h-1 animate-[bounce_1.4s_ease-in-out_infinite] bg-sage" />
            ) : null}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Button onClick={run} disabled={state === "scanning"}>
              <Camera className="size-4" />
              {state === "scanning" ? "Scanning…" : "Live scan"}
            </Button>
            <Button variant="outline" onClick={run} disabled={state === "scanning"}>
              <Upload className="size-4" /> Upload photo
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Even lighting, no makeup, hair tied back. Scans are compared against your history.
          </p>
        </div>

        <div className="space-y-6">
          <div className="surface p-6">
            <div className="flex items-end justify-between">
              <div>
                <p className="eyebrow">Skin health score</p>
                <p className="font-display text-5xl leading-none">{skinAnalysis.healthScore}</p>
              </div>
              <Badge className="bg-success text-success-foreground">
                +{skinAnalysis.scoreDelta} this week
              </Badge>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {skinAnalysis.attributes.map((a) => (
                <div key={a.label} className="rounded-xl bg-muted p-4">
                  <p className="eyebrow">{a.label}</p>
                  <p className="mt-1 font-display text-xl">{a.value}</p>
                  <p className="text-xs text-muted-foreground">{a.note}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="surface p-6">
            <h2 className="text-xl">Detected concerns</h2>
            <ul className="mt-4 space-y-4">
              {skinAnalysis.concerns.map((c) => (
                <li key={c.label}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-medium">{c.label}</span>
                    <span className="text-muted-foreground">{c.severity}</span>
                  </div>
                  <Progress value={c.level} className="mt-2 h-1.5" />
                </li>
              ))}
            </ul>
            <Button asChild className="mt-6">
              <Link to="/products">
                <ScanFace className="size-4" /> See matched products{" "}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="surface mt-6 p-6">
        <h2 className="text-xl">Safety notes for your profile</h2>
        <ul className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
          {safetyTips.map((t) => (
            <li key={t} className="flex gap-2">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-clay" />
              {t}
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}
