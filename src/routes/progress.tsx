import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { TrendingUp, ScanFace, Camera, Upload, ArrowRight, BarChart3 } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useScan, ScanReport } from "@/lib/scan-context";
import { progressSeries, skinAnalysis, habits } from "@/lib/mock-data";
import { motion } from "framer-motion";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "Skin Progress & Reports — 360° Skincare" },
      {
        name: "description",
        content:
          "Track skin health over time with before/after comparisons, weekly and monthly reports, hydration and acne trends, and lifestyle correlation.",
      },
    ],
  }),
  component: ProgressPage,
});

function scoreColor(score: number) {
  if (score >= 75) return "text-success";
  if (score >= 55) return "text-warning";
  return "text-destructive";
}

function ProgressPage() {
  const { scanHistory } = useScan();
  const [compareA, setCompareA] = useState<number>(0);
  const [compareB, setCompareB] = useState<number>(1);

  // Merge real scan history data into the trend chart (most recent 7 entries)
  const chartData = useMemo(() => {
    if (scanHistory.length === 0) return progressSeries;
    const real = [...scanHistory]
      .reverse()
      .slice(0, 7)
      .map((s, i) => ({
        day: `Scan ${i + 1}`,
        score: s.healthScore,
        hydration: s.hydrationScore,
        acne: 100 - s.acneScore,
      }));
    return real.length >= 2 ? real : progressSeries;
  }, [scanHistory]);

  const latestScore = scanHistory[0]?.healthScore ?? skinAnalysis.healthScore;
  const latestHydration = scanHistory[0]?.hydrationScore ?? 68;
  const scoreImprovement =
    scanHistory.length >= 2
      ? `+${scanHistory[0].healthScore - scanHistory[scanHistory.length - 1].healthScore} pts`
      : "+16 in 6 wks";

  const reportA: ScanReport | null = scanHistory[compareA] ?? null;
  const reportB: ScanReport | null = scanHistory[compareB] ?? null;

  return (
    <AppShell>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <PageHeader
          eyebrow="Progress and reports"
          title="Skin Progress"
          description="Every scan is stored and compared so improvement is measured rather than guessed."
        />
      </motion.div>

      {/* ── Key stats ─────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Skin health score" value={`${latestScore}`} delta={scoreImprovement} />
        <Stat label="Hydration" value={`${latestHydration}%`} delta="+27 pts" />
        <Stat label="Total scans" value={`${scanHistory.length}`} delta="Keep scanning!" />
      </div>

      {/* ── Trend chart ───────────────────────────────────────────── */}
      <div className="surface mt-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl flex items-center gap-2">
            <BarChart3 className="size-5 text-primary" /> Skin Health Graph
          </h2>
          <div className="flex gap-2">
            <Badge variant="secondary">Score</Badge>
            <Badge variant="outline">Hydration</Badge>
            <Badge variant="outline">Acne</Badge>
          </div>
        </div>
        <div className="mt-6 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="day"
                stroke="var(--color-muted-foreground)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="var(--color-muted-foreground)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "0.75rem",
                  fontSize: "0.8rem",
                }}
              />
              <Line type="monotone" dataKey="score" stroke="var(--color-chart-1)" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="hydration" stroke="var(--color-chart-3)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="acne" stroke="var(--color-chart-2)" strokeWidth={2} strokeDasharray="4 4" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Scan history list ─────────────────────────────────────── */}
      {scanHistory.length > 0 ? (
        <div className="surface mt-6 p-6">
          <h2 className="text-xl mb-4">Scan History</h2>
          <div className="space-y-3">
            {scanHistory.map((scan, i) => (
              <div
                key={scan.id}
                className="flex items-center gap-4 rounded-2xl bg-muted/40 p-4 transition-all hover:bg-muted/70"
              >
                <img
                  src={scan.imageDataUrl}
                  alt="Scan thumbnail"
                  className="size-14 rounded-xl object-cover ring-1 ring-border shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm">Scan #{scanHistory.length - i}</p>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-2xs font-medium text-primary capitalize flex items-center gap-1">
                      {scan.method === "camera" ? <Camera className="size-3" /> : <Upload className="size-3" />}
                      {scan.method}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{scan.date}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {scan.skinType} · {scan.skinTone} · {scan.undertone}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`font-display text-2xl leading-none ${scoreColor(scan.healthScore)}`}>
                    {scan.healthScore}
                  </p>
                  <p className="text-2xs text-muted-foreground mt-1">Health Score</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="surface mt-6 p-10 text-center">
          <ScanFace className="mx-auto size-12 text-muted-foreground/50 mb-4" />
          <h3 className="font-display text-xl">No scans yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Run your first AI face scan to start tracking skin progress.
          </p>
          <Button asChild className="mt-5">
            <Link to="/scan">
              <ScanFace className="mr-2 size-4" /> Start First Scan
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </div>
      )}

      {/* ── Before & After comparison ─────────────────────────────── */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="surface p-6 lg:col-span-2">
          <h2 className="text-xl mb-4">Before & After Comparison</h2>

          {scanHistory.length >= 2 ? (
            <>
              {/* Pickers */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {(["A", "B"] as const).map((side) => {
                  const idx = side === "A" ? compareA : compareB;
                  const set = side === "A" ? setCompareA : setCompareB;
                  return (
                    <div key={side} className="space-y-1.5">
                      <label className="text-xs text-muted-foreground font-medium">{side === "A" ? "Before" : "After"}</label>
                      <select
                        value={idx}
                        onChange={(e) => set(Number(e.target.value))}
                        className="flex h-9 w-full rounded-xl border border-input bg-background px-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {scanHistory.map((s, i) => (
                          <option key={s.id} value={i}>
                            Scan #{scanHistory.length - i} — {s.date}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>

              {/* Side-by-side comparison cards */}
              <div className="grid grid-cols-2 gap-3">
                {[reportA, reportB].map((r, i) => (
                  r ? (
                    <div key={i} className="rounded-2xl bg-muted/40 overflow-hidden">
                      <div className="relative aspect-[3/2]">
                        <img src={r.imageDataUrl} alt="" className="w-full h-full object-cover" />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 p-3">
                          <p className="text-xs text-white/80">{i === 0 ? "Before" : "After"}</p>
                          <p className={`font-display text-xl text-white`}>{r.healthScore}</p>
                        </div>
                      </div>
                      <div className="p-3 space-y-1 text-xs">
                        <p><span className="text-muted-foreground">Type:</span> <span className="font-medium">{r.skinType}</span></p>
                        <p><span className="text-muted-foreground">Tone:</span> <span className="font-medium">{r.skinTone}</span></p>
                        <p><span className="text-muted-foreground">Hydration:</span> <span className="font-medium">{r.hydrationScore}</span></p>
                      </div>
                    </div>
                  ) : null
                ))}
              </div>

              {/* Delta */}
              {reportA && reportB && (
                <div className="mt-3 rounded-2xl bg-primary/10 border border-primary/20 p-3.5 flex items-center gap-3">
                  <TrendingUp className="size-5 text-primary shrink-0" />
                  <p className="text-sm">
                    Skin health score changed by{" "}
                    <strong className={reportB.healthScore >= reportA.healthScore ? "text-success" : "text-destructive"}>
                      {reportB.healthScore >= reportA.healthScore ? "+" : ""}
                      {reportB.healthScore - reportA.healthScore} pts
                    </strong>{" "}
                    between these scans.
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-2xl bg-muted/40 p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Complete at least 2 scans to enable Before & After comparisons.
              </p>
              <Button asChild variant="outline" className="mt-4">
                <Link to="/scan"><ScanFace className="mr-2 size-4" /> Go to Scan</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Weekly report */}
        <div className="surface p-6">
          <h2 className="text-xl">Weekly Report</h2>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li>Routine adherence: 83% (13 of 14 nights)</li>
            <li>Water goal met on 4 of 7 days</li>
            <li>Average sleep 6.4 h — biggest limiter</li>
            <li>2 high-sugar entries correlated with chin flare-ups</li>
            <li>Sunscreen reapplied on 5 of 7 days</li>
          </ul>
          <p className="mt-5 flex items-center gap-2 text-sm">
            <TrendingUp className="size-4 text-success" />
            Improvement rate: 27% since start
          </p>
        </div>
      </div>
    </AppShell>
  );
}

function Stat({ label, value, delta }: { label: string; value: string; delta: string }) {
  return (
    <div className="surface p-6">
      <p className="eyebrow">{label}</p>
      <p className="mt-2 font-display text-4xl leading-none">{value}</p>
      <p className="mt-2 text-xs text-success">{delta}</p>
    </div>
  );
}
