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
import { TrendingUp, ScanFace, Camera, Upload, ArrowRight, BarChart3, Trash2 } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useScan, ScanReport } from "@/lib/scan-context";
import { useProgress } from "@/lib/progress-context";
import { useAuth } from "@/lib/auth-context";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Calendar } from "lucide-react";
import { API_BASE_URL } from "@/lib/config";

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
  const { scanHistory, deleteScan } = useScan();
  const { reports, isLoading: reportsLoading, isGenerating, generateReport } = useProgress();
  const { user } = useAuth();
  
  const [compareA, setCompareA] = useState<number>(0);
  const [compareB, setCompareB] = useState<number>(1);
  const [timeframe, setTimeframe] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [filterMonth, setFilterMonth] = useState<string>("All");
  const [isComparing, setIsComparing] = useState(false);
  const [aiComparison, setAiComparison] = useState<string | null>(null);

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    scanHistory.forEach(s => {
      const date = new Date(s.date);
      months.add(date.toLocaleString("default", { month: "long", year: "numeric" }));
    });
    return ["All", ...Array.from(months)];
  }, [scanHistory]);

  const filteredHistory = useMemo(() => {
    if (filterMonth === "All") return scanHistory;
    return scanHistory.filter(s => {
      const date = new Date(s.date);
      return date.toLocaleString("default", { month: "long", year: "numeric" }) === filterMonth;
    });
  }, [scanHistory, filterMonth]);

  const handleAICompare = async () => {
    const reportA = scanHistory[compareA] ?? null;
    const reportB = scanHistory[compareB] ?? null;
    if (!reportA || !reportB || !user?.uid) return;
    
    setIsComparing(true);
    setAiComparison(null);
    try {
      const apiUrl = `${API_BASE_URL}/scans/${user.uid}/compare`;
        
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scan1: reportA, scan2: reportB })
      });
      const data = await response.json();
      if (data.success) {
        setAiComparison(data.comparison);
      } else {
        console.error("AI Compare failed", data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsComparing(false);
    }
  };

  // Merge real scan history data into the trend chart (most recent 7 entries)
  const chartData = useMemo(() => {
    if (scanHistory.length === 0) return [];
    const real = [...scanHistory]
      .reverse()
      .slice(0, 7)
      .map((s, i) => ({
        day: `Scan ${i + 1}`,
        score: s.healthScore,
        hydration: s.hydrationScore,
        acne: 100 - s.acneScore,
      }));
    return real;
  }, [scanHistory]);

  const latestScore = scanHistory.length > 0 ? scanHistory[0].healthScore : 0;
  const latestHydration = scanHistory.length > 0 ? scanHistory[0].hydrationScore : 0;
  const scoreImprovement =
    scanHistory.length >= 2
      ? `${scanHistory[0].healthScore - scanHistory[scanHistory.length - 1].healthScore > 0 ? "+" : ""}${scanHistory[0].healthScore - scanHistory[scanHistory.length - 1].healthScore} pts`
      : "Not enough data";

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
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))", 
                  borderColor: "hsl(var(--border))",
                  borderRadius: "12px",
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl">Scan History</h2>
            {availableMonths.length > 1 && (
              <select 
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm"
              >
                {availableMonths.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            )}
          </div>
          <div className="space-y-3">
            {filteredHistory.map((scan, i) => (
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
                    <p className="font-semibold text-sm">Scan #{scanHistory.length - scanHistory.indexOf(scan)}</p>
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
                <div className="flex flex-col items-end shrink-0 gap-2">
                  <div className="text-right">
                    <p className={`font-display text-2xl leading-none ${scoreColor(scan.healthScore)}`}>
                      {scan.healthScore}
                    </p>
                    <p className="text-2xs text-muted-foreground mt-1">Health Score</p>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this scan?")) {
                        deleteScan(scan.id);
                      }
                    }}
                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                    title="Delete Scan"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
            {filteredHistory.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-4">No scans found for this period.</p>
            )}
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
                      <label className="text-xs text-muted-foreground font-medium">{side === "A" ? "Older" : "Newer"}</label>
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
                          <p className="text-xs text-white/80">{i === 0 ? "Older" : "Newer"}</p>
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

              {/* Delta & AI Compare Button */}
              {reportA && reportB && (
                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl bg-primary/10 border border-primary/20 p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="size-5 text-primary shrink-0" />
                      <p className="text-sm">
                        Skin health score changed by{" "}
                        <strong className={reportB.healthScore >= reportA.healthScore ? "text-success" : "text-destructive"}>
                          {reportB.healthScore >= reportA.healthScore ? "+" : ""}
                          {reportB.healthScore - reportA.healthScore}
                        </strong>{" "}
                        points.
                      </p>
                    </div>
                    <Button size="sm" onClick={handleAICompare} disabled={isComparing}>
                      {isComparing ? <Loader2 className="size-4 animate-spin mr-2" /> : <ScanFace className="size-4 mr-2" />}
                      Generate AI Comparison
                    </Button>
                  </div>
                  
                  {/* AI Insights Result */}
                  <AnimatePresence>
                    {aiComparison && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="rounded-2xl bg-muted/40 p-4 border border-border mt-3 text-sm"
                      >
                        <h4 className="font-medium mb-1 flex items-center gap-2">
                          <ScanFace className="size-4 text-primary" /> AI Insights
                        </h4>
                        <p className="text-muted-foreground">{aiComparison}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
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

        {/* AI Progress Report */}
        <div className="surface p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl">AI Progress Report</h2>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as any)}
              className="h-8 rounded-lg border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div className="flex-1">
            {reportsLoading ? (
              <div className="h-full flex items-center justify-center py-10">
                <Loader2 className="size-6 animate-spin text-primary" />
              </div>
            ) : reports[timeframe] ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={timeframe}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-4"
                >
                  <p className="text-sm text-foreground/90 leading-relaxed">
                    {reports[timeframe].overallProgress}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="rounded-xl bg-muted/50 p-3">
                      <p className="text-2xs text-muted-foreground uppercase tracking-wider font-semibold">Adherence Score</p>
                      <p className={`text-xl font-display mt-1 ${scoreColor(reports[timeframe].adherenceScore)}`}>{reports[timeframe].adherenceScore}</p>
                    </div>
                    <div className="rounded-xl bg-muted/50 p-3">
                      <p className="text-2xs text-muted-foreground uppercase tracking-wider font-semibold">Improvement</p>
                      <p className="text-xl font-display mt-1 text-primary">{reports[timeframe].improvementRate}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2 mt-4">Key Insights</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {reports[timeframe].keyInsights.map((insight, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="shrink-0 mt-1 size-1.5 rounded-full bg-primary/60" />
                          <span>{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2 mt-4">Actionable Steps</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {reports[timeframe].actionableSteps.map((step, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="shrink-0 mt-1 size-1.5 rounded-full bg-warning/60" />
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <p className="text-2xs text-muted-foreground text-right pt-2 flex items-center justify-end gap-1 border-t border-border mt-4">
                    <Calendar className="size-3" /> Generated: {new Date(reports[timeframe].generatedAt).toLocaleDateString()}
                  </p>
                </motion.div>
              </AnimatePresence>
            ) : (
              <div className="text-center py-10 space-y-3">
                <BarChart3 className="size-10 mx-auto text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No {timeframe} report generated yet.</p>
              </div>
            )}
          </div>

          <Button 
            className="w-full mt-4" 
            onClick={() => generateReport(timeframe)}
            disabled={isGenerating || reportsLoading}
          >
            {isGenerating ? (
              <><Loader2 className="mr-2 size-4 animate-spin" /> Analyzing...</>
            ) : (
              `Generate ${timeframe === 'daily' ? 'Daily' : timeframe === 'weekly' ? 'Weekly' : 'Monthly'} Report`
            )}
          </Button>
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
