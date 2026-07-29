import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Droplets,
  Moon,
  Footprints,
  Flame,
  Milestone,
  Plus,
  RefreshCw,
  Info,
  TrendingUp,
  Sparkles,
  Smartphone,
  Check,
  Zap,
  Activity,
  Heart,
  Eye,
} from "lucide-react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";
import { AppShell, PageHeader } from "@/components/app-shell";
import { useHealth } from "@/lib/health-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

export const Route = createFileRoute("/health")({
  head: () => ({
    meta: [
      { title: "Health & Telemetry Monitoring — 360° Skincare" },
      {
        name: "description",
        content: "Track water intake, sleep cycles, steps, and see real-time AI skincare correlations.",
      },
    ],
  }),
  component: HealthPage,
});

type TabView = "overview" | "water" | "sleep" | "steps" | "reports";

function HealthPage() {
  const {
    waterGoal,
    waterLogs,
    todayWater,
    addWater,
    setWaterGoal,
    clearWaterLogs,

    sleepLogs,
    sleepSyncMethod,
    todaySleep,
    addSleep,
    setSleepSyncMethod,

    stepsLogs,
    stepsGoal,
    stepSyncMethod,
    todaySteps,
    addSteps,
    setStepsGoal,
    setStepSyncMethod,

    aiRecommendations,
  } = useHealth();

  const [activeTab, setActiveTab] = useState<TabView>("overview");

  // Local Form states
  const [customWaterGoal, setCustomWaterGoal] = useState(waterGoal / 1000);
  const [bedtime, setBedtime] = useState(todaySleep?.bedtime || "23:00");
  const [wakeup, setWakeup] = useState(todaySleep?.wakeup || "06:30");
  const [customStepsGoal, setCustomStepsGoal] = useState(stepsGoal);
  const [manualSteps, setManualSteps] = useState(todaySteps.steps);

  // Sync animation triggers
  const [syncingType, setSyncingType] = useState<string | null>(null);

  const triggerSync = (type: "sleep" | "steps", method: string) => {
    setSyncingType(method);
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: `Synchronising with ${method}...`,
        success: () => {
          setSyncingType(null);
          if (type === "sleep") {
            setSleepSyncMethod(method as any);
          } else {
            setStepSyncMethod(method);
          }
          return `Successfully updated health data from ${method}!`;
        },
        error: "Sync failed.",
      }
    );
  };

  const handleWaterGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ml = Math.round(customWaterGoal * 1000);
    if (ml < 500 || ml > 10000) {
      toast.error("Please enter a valid goal between 0.5L and 10L");
      return;
    }
    setWaterGoal(ml);
    toast.success(`Daily water goal updated to ${customWaterGoal} Litres.`);
  };

  const handleSleepSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addSleep(bedtime, wakeup, "manual");
    toast.success("Sleep log added successfully!");
  };

  const handleStepsGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customStepsGoal < 1000 || customStepsGoal > 50000) {
      toast.error("Please enter a valid steps goal between 1,000 and 50,000 steps.");
      return;
    }
    setStepsGoal(customStepsGoal);
    toast.success(`Daily step goal updated to ${customStepsGoal.toLocaleString()} steps.`);
  };

  const handleManualStepsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addSteps(manualSteps, "manual");
    toast.success("Steps logged successfully!");
  };

  // Mock Graph Data formatted for Recharts
  const weeklyData = [
    { day: "Mon", water: 2.2, sleep: 7.2, steps: 8400 },
    { day: "Tue", water: 3.0, sleep: 8.0, steps: 11200 },
    { day: "Wed", water: 2.5, sleep: 6.8, steps: 6100 },
    { day: "Thu", water: 3.2, sleep: 7.5, steps: 8900 },
    { day: "Fri", water: 1.8, sleep: 6.4, steps: 5200 },
    { day: "Sat", water: 2.8, sleep: 8.2, steps: 9800 },
    { day: "Sun", water: (todayWater / 1000), sleep: todaySleep?.duration || 6.4, steps: todaySteps.steps },
  ];

  const monthlyData = [
    { week: "Wk 1", water: 2.3, sleep: 7.1, steps: 7800 },
    { week: "Wk 2", water: 2.6, sleep: 7.3, steps: 8200 },
    { week: "Wk 3", water: 2.4, sleep: 6.9, steps: 7100 },
    { week: "Wk 4", water: (todayWater / 1000 || 2.7), sleep: todaySleep?.duration || 7.0, steps: todaySteps.steps || 8000 },
  ];

  return (
    <AppShell>
      <PageHeader
        eyebrow="Clinical Telemetry & Skincare Correlation"
        title="Health Monitoring Dashboard"
        description="Monitor daily water, sleep cycles, movement steps, and see how physical metrics impact your skin score."
      />

      {/* Tabs list */}
      <div className="mb-6 flex rounded-full bg-muted p-1 overflow-x-auto select-none">
        {(["overview", "water", "sleep", "steps", "reports"] as TabView[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 min-w-[5rem] rounded-full py-2 text-center text-sm font-medium transition-all capitalize ${
              activeTab === tab
                ? "bg-card text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Quick Status Grid */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="surface p-5 flex items-center gap-4">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                <Droplets className="size-6" />
              </span>
              <div>
                <p className="eyebrow">Water Intake</p>
                <p className="font-display text-2xl mt-1">{(todayWater / 1000).toFixed(1)}L / {(waterGoal / 1000).toFixed(0)}L</p>
                <Progress value={Math.min(100, (todayWater / waterGoal) * 100)} className="h-1.5 w-32 mt-2" />
              </div>
            </div>

            <div className="surface p-5 flex items-center gap-4">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-sage/20 text-sage-foreground">
                <Moon className="size-6" />
              </span>
              <div>
                <p className="eyebrow">Sleep Log</p>
                <p className="font-display text-2xl mt-1">
                  {todaySleep ? `${todaySleep.duration}h` : "6.4h (Avg)"}
                  {todaySleep && <span className="text-sm font-sans ml-2 text-success">Score: {todaySleep.score}</span>}
                </p>
                <Progress value={todaySleep ? todaySleep.score : 68} className="h-1.5 w-32 mt-2" />
              </div>
            </div>

            <div className="surface p-5 flex items-center gap-4">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-clay/20 text-clay-foreground">
                <Footprints className="size-6" />
              </span>
              <div>
                <p className="eyebrow">Steps Counter</p>
                <p className="font-display text-2xl mt-1">{todaySteps.steps.toLocaleString()} / {stepsGoal.toLocaleString()}</p>
                <Progress value={Math.min(100, (todaySteps.steps / stepsGoal) * 100)} className="h-1.5 w-32 mt-2" />
              </div>
            </div>
          </div>

          {/* AI recommendations */}
          <div className="surface glow-veil p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2.5 text-primary">
              <Sparkles className="size-5" />
              <h2 className="text-xl font-display">AI Skincare Recommendations</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
              Based on your face scan score, regional weather humidity, active UV levels, and today's tracked telemetry, 360° Skincare has generated the following custom health directives:
            </p>

            <div className="mt-4 divide-y divide-border/60">
              {aiRecommendations.map((rec, i) => (
                <div key={i} className="flex gap-3 py-3.5 first:pt-0 last:pb-0 items-start">
                  <div className="size-2 rounded-full bg-primary mt-2 shrink-0" />
                  <p className="text-sm text-foreground leading-relaxed">{rec}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* WATER TRACKER TAB */}
      {activeTab === "water" && (
        <div className="grid gap-6 lg:grid-cols-[1.8fr_1fr] animate-fadeIn">
          <div className="surface p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <h2 className="text-xl font-display flex items-center gap-2">
                <Droplets className="size-5 text-accent-foreground" /> Water Intake Log
              </h2>
              <span className="text-xs eyebrow bg-accent/20 px-2.5 py-1 rounded-full text-accent-foreground font-semibold">
                Daily Goal: {(waterGoal / 1000).toFixed(1)}L
              </span>
            </div>

            {/* Wave Progress indicator */}
            <div className="flex flex-col items-center justify-center p-6 bg-muted/30 rounded-2xl border border-border/40 relative overflow-hidden">
              <p className="text-xs eyebrow">Consumed Today</p>
              <h3 className="font-display text-5xl mt-2 leading-none">{(todayWater / 1000).toFixed(2)} <span className="text-xl text-muted-foreground font-sans">Litres</span></h3>
              
              <div className="w-full max-w-md mt-6 space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{Math.round((todayWater / waterGoal) * 100)}% Met</span>
                  <span>{todayWater >= waterGoal ? "Goal Achieved!" : `${((waterGoal - todayWater) / 1000).toFixed(2)}L remaining`}</span>
                </div>
                <Progress value={Math.min(100, (todayWater / waterGoal) * 100)} className="h-2.5" />
              </div>
            </div>

            {/* Quick Log buttons */}
            <div className="space-y-3">
              <Label>Quick Log Water</Label>
              <div className="grid grid-cols-4 gap-2.5">
                {[
                  { value: 250, label: "250 ml", icon: "🥛" },
                  { value: 500, label: "500 ml", icon: "🥤" },
                  { value: 750, label: "750 ml", icon: "🧴" },
                  { value: 1000, label: "1.0 L", icon: "🍼" },
                ].map((item) => (
                  <Button
                    key={item.value}
                    variant="outline"
                    type="button"
                    onClick={() => {
                      addWater(item.value);
                      toast.success(`Logged +${item.label} of water!`);
                    }}
                    className="flex flex-col h-14 items-center justify-center rounded-xl bg-card border-border/70 hover:bg-accent/40"
                  >
                    <span className="text-base">{item.icon}</span>
                    <span className="text-xs font-semibold mt-1">{item.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom Goal Form */}
            <form onSubmit={handleWaterGoalSubmit} className="flex items-end gap-3 pt-2 border-t border-border/50">
              <div className="space-y-1.5 flex-1 max-w-[12rem]">
                <Label htmlFor="custom-water-goal">Customize Goal (L)</Label>
                <Input
                  id="custom-water-goal"
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="10"
                  value={customWaterGoal}
                  onChange={(e) => setCustomWaterGoal(parseFloat(e.target.value) || 3.0)}
                />
              </div>
              <Button type="submit">Update Goal</Button>
              {waterLogs.length > 0 && (
                <Button type="button" variant="outline" onClick={clearWaterLogs} className="text-destructive border-destructive/30 hover:bg-destructive/10 ml-auto">
                  Reset Logs
                </Button>
              )}
            </form>
          </div>

          {/* Water History Sidebar */}
          <div className="surface p-6 space-y-4 h-fit">
            <h3 className="eyebrow mb-2">Logs History</h3>
            {waterLogs.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                <Info className="size-8 mx-auto mb-2 text-muted-foreground/50" />
                No water logged today yet.
              </div>
            ) : (
              <div className="space-y-2 max-h-[18rem] overflow-y-auto">
                {waterLogs
                  .slice()
                  .reverse()
                  .map((log) => {
                    const date = new Date(log.timestamp);
                    const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                    return (
                      <div key={log.id} className="flex justify-between items-center bg-muted/40 rounded-xl p-3 text-sm">
                        <span className="font-semibold text-foreground">+{log.amount} ml</span>
                        <span className="text-xs text-muted-foreground">{timeStr}</span>
                      </div>
                    );
                  })}
              </div>
            )}

            <div className="bg-accent/10 border border-accent/20 rounded-2xl p-4 mt-4 space-y-2">
              <h4 className="text-xs font-semibold text-accent-foreground flex items-center gap-1.5">
                <Zap className="size-4" /> Smart Reminders
              </h4>
              <p className="text-2xs text-muted-foreground leading-relaxed">
                If enabled, 360° Skincare sends desktop push alerts and emails if you haven't logged water for 3 consecutive hours during daytime.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SLEEP TRACKER TAB */}
      {activeTab === "sleep" && (
        <div className="grid gap-6 lg:grid-cols-[1.8fr_1fr] animate-fadeIn">
          <div className="surface p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <h2 className="text-xl font-display flex items-center gap-2">
                <Moon className="size-5 text-primary" /> Sleep Telemetry
              </h2>
              <span className="text-xs eyebrow bg-primary/10 px-2.5 py-1 rounded-full text-primary font-semibold">
                Sync: {sleepSyncMethod === "manual" ? "Manual Entry" : `${sleepSyncMethod === "google" ? "Google" : "Apple"} Health`}
              </span>
            </div>

            {/* Dynamic Sleep Summary */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="bg-muted/40 rounded-2xl border border-border/40 p-5 flex flex-col items-center justify-center text-center">
                <p className="text-xs eyebrow">Last Night's Sleep</p>
                <h3 className="font-display text-4xl mt-2 leading-none">
                  {todaySleep ? todaySleep.duration : "6.4"} <span className="text-lg font-sans text-muted-foreground">hours</span>
                </h3>
                <p className="text-2xs text-muted-foreground mt-2">
                  {todaySleep ? `Bedtime: ${todaySleep.bedtime} - Wake: ${todaySleep.wakeup}` : "No sleep log registered for today"}
                </p>
              </div>

              <div className="bg-muted/40 rounded-2xl border border-border/40 p-5 flex flex-col items-center justify-center text-center">
                <p className="text-xs eyebrow">Computed Sleep Score</p>
                <h3 className="font-display text-4xl mt-2 leading-none text-success">
                  {todaySleep ? todaySleep.score : "68"} <span className="text-lg font-sans text-muted-foreground">/100</span>
                </h3>
                <p className="text-2xs text-muted-foreground mt-2">
                  {todaySleep ? (todaySleep.score >= 80 ? "Optimal restoration quality" : "Slightly low restoration") : "Restorative rate based on 7.5h baseline"}
                </p>
              </div>
            </div>

            {/* Syncing toggles */}
            <div className="space-y-3 pt-2 border-t border-border/40">
              <Label>Method 2: Automatic Synchronisation</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => triggerSync("sleep", "google")}
                  disabled={syncingType !== null}
                  className={`flex items-center justify-center gap-2 rounded-xl border p-4 text-sm font-semibold transition-all ${
                    sleepSyncMethod === "google"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:bg-muted"
                  }`}
                >
                  <Activity className="size-4" />
                  Google Health Connect
                </button>

                <button
                  type="button"
                  onClick={() => triggerSync("sleep", "apple")}
                  disabled={syncingType !== null}
                  className={`flex items-center justify-center gap-2 rounded-xl border p-4 text-sm font-semibold transition-all ${
                    sleepSyncMethod === "apple"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:bg-muted"
                  }`}
                >
                  <Heart className="size-4" />
                  Apple Health (iOS)
                </button>
              </div>
            </div>

            {/* Manual Form */}
            <form onSubmit={handleSleepSubmit} className="space-y-4 pt-2 border-t border-border/40">
              <Label>Method 1: Manual Sleep Entry</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="bedtime">Bedtime</Label>
                  <Input
                    id="bedtime"
                    type="time"
                    value={bedtime}
                    onChange={(e) => setBedtime(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="wakeup">Wake-up time</Label>
                  <Input
                    id="wakeup"
                    type="time"
                    value={wakeup}
                    onChange={(e) => setWakeup(e.target.value)}
                  />
                </div>
              </div>
              <Button type="submit" disabled={sleepSyncMethod !== "manual"}>
                Log Sleep Manually
              </Button>
              {sleepSyncMethod !== "manual" && (
                <button
                  type="button"
                  onClick={() => {
                    setSleepSyncMethod("manual");
                    toast.success("Switched to manual entry mode.");
                  }}
                  className="text-xs font-semibold text-primary hover:underline ml-4"
                >
                  Enable Manual Entry
                </button>
              )}
            </form>
          </div>

          {/* Sleep History Logs */}
          <div className="surface p-6 space-y-4 h-fit">
            <h3 className="eyebrow mb-2">Sleep Logs History</h3>
            <div className="space-y-3">
              {sleepLogs.map((log) => (
                <div key={log.id} className="rounded-xl border border-border/60 p-3 text-xs bg-card space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-foreground">{log.date}</span>
                    <span className="text-success font-semibold">Score: {log.score}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Duration: {log.duration} hrs</span>
                    <span className="capitalize">{log.method} Sync</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STEPS TAB */}
      {activeTab === "steps" && (
        <div className="grid gap-6 lg:grid-cols-[1.8fr_1fr] animate-fadeIn">
          <div className="surface p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <h2 className="text-xl font-display flex items-center gap-2">
                <Footprints className="size-5 text-clay-foreground" /> Step Counter
              </h2>
              <span className="text-xs eyebrow bg-clay/20 px-2.5 py-1 rounded-full text-clay-foreground font-semibold">
                Sync: {stepSyncMethod}
              </span>
            </div>

            {/* Main Stats Display */}
            <div className="flex flex-col items-center justify-center p-6 bg-muted/30 rounded-2xl border border-border/40 relative">
              <p className="text-xs eyebrow">Steps Walked Today</p>
              <h3 className="font-display text-5xl mt-2 leading-none">
                {todaySteps.steps.toLocaleString()} <span className="text-lg font-sans text-muted-foreground">/ {stepsGoal.toLocaleString()}</span>
              </h3>

              <div className="w-full max-w-md mt-6 space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{Math.round((todaySteps.steps / stepsGoal) * 100)}% of goal</span>
                  <span>{todaySteps.steps >= stepsGoal ? "Daily target completed!" : `${(stepsGoal - todaySteps.steps).toLocaleString()} steps left`}</span>
                </div>
                <Progress value={Math.min(100, (todaySteps.steps / stepsGoal) * 100)} className="h-2.5" />
              </div>
            </div>

            {/* Calculations Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/40 rounded-xl border border-border/40 p-4 flex items-center gap-3">
                <Flame className="size-5 text-destructive" />
                <div>
                  <p className="text-2xs eyebrow">Calories Burned</p>
                  <p className="font-display text-lg mt-0.5">{todaySteps.calories} kcal</p>
                </div>
              </div>

              <div className="bg-muted/40 rounded-xl border border-border/40 p-4 flex items-center gap-3">
                <Milestone className="size-5 text-primary" />
                <div>
                  <p className="text-2xs eyebrow">Distance Walked</p>
                  <p className="font-display text-lg mt-0.5">{todaySteps.distance} km</p>
                </div>
              </div>
            </div>

            {/* Devices connection panels */}
            <div className="space-y-3 pt-2 border-t border-border/40">
              <Label>Method 3: Connect Wearable Devices</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "fitbit", label: "Fitbit" },
                  { id: "garmin", label: "Garmin" },
                  { id: "samsung", label: "Samsung" },
                  { id: "applewatch", label: "Apple Watch" },
                ].map((wearable) => {
                  const isConnected = stepSyncMethod === wearable.id;
                  return (
                    <button
                      key={wearable.id}
                      type="button"
                      onClick={() => triggerSync("steps", wearable.id)}
                      className={`flex h-12 items-center justify-center rounded-xl border text-xs font-semibold transition-all ${
                        isConnected
                          ? "bg-primary border-primary text-primary-foreground"
                          : "bg-background border-border hover:bg-muted"
                      }`}
                    >
                      {isConnected ? <Check className="size-3.5 mr-1" /> : null}
                      {wearable.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* System sync toggles */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/40">
              <div className="space-y-1">
                <Label>Method 1: Built-in Sensor</Label>
                <Button
                  type="button"
                  variant={stepSyncMethod === "sensor" ? "default" : "outline"}
                  onClick={() => {
                    setStepSyncMethod("sensor");
                    toast.success("Synced with mobile device built-in sensor");
                  }}
                  className="w-full flex gap-1.5"
                >
                  <Smartphone className="size-4" /> Device Sensor
                </Button>
              </div>

              <div className="space-y-1">
                <Label>Method 2: OS Health Apps</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={stepSyncMethod === "google_health" ? "default" : "outline"}
                    onClick={() => triggerSync("steps", "google_health")}
                    className="flex-1 text-2xs"
                  >
                    Google Health
                  </Button>
                  <Button
                    type="button"
                    variant={stepSyncMethod === "apple_health" ? "default" : "outline"}
                    onClick={() => triggerSync("steps", "apple_health")}
                    className="flex-1 text-2xs"
                  >
                    Apple Health
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Config sidebar */}
          <div className="space-y-6">
            <div className="surface p-6">
              <form onSubmit={handleStepsGoalSubmit} className="space-y-4">
                <h3 className="eyebrow border-b border-border/50 pb-2">Step Goals</h3>
                <div className="space-y-1.5">
                  <Label htmlFor="custom-steps-goal">Customize Goal (steps)</Label>
                  <Input
                    id="custom-steps-goal"
                    type="number"
                    min="1000"
                    max="50000"
                    step="500"
                    value={customStepsGoal}
                    onChange={(e) => setCustomStepsGoal(parseInt(e.target.value) || 8000)}
                  />
                </div>
                <Button type="submit" className="w-full">Save Steps Goal</Button>
              </form>
            </div>

            <div className="surface p-6">
              <form onSubmit={handleManualStepsSubmit} className="space-y-4">
                <h3 className="eyebrow border-b border-border/50 pb-2">Manual Entry Override</h3>
                <div className="space-y-1.5">
                  <Label htmlFor="manual-steps-entry">Today's steps</Label>
                  <Input
                    id="manual-steps-entry"
                    type="number"
                    value={manualSteps}
                    onChange={(e) => setManualSteps(parseInt(e.target.value) || 0)}
                  />
                </div>
                <Button type="submit" variant="outline" className="w-full">Log Steps Override</Button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* REPORTS TAB */}
      {activeTab === "reports" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Weekly Report Graph */}
          <div className="surface p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
              <h2 className="text-xl font-display flex items-center gap-2">
                <TrendingUp className="size-5 text-success" /> Weekly Health Metrics
              </h2>
              <span className="text-xs eyebrow text-muted-foreground font-semibold">
                Daily telemetry logs
              </span>
            </div>

            <div className="grid gap-6 md:grid-cols-2 mt-6">
              {/* Water Recharts Bar */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Water Intake (L) - Past 7 Days</Label>
                <div className="h-60 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyData}>
                      <CartesianGrid stroke="var(--color-border)" vertical={false} />
                      <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "0.75rem", fontSize: "0.8rem" }} />
                      <Bar dataKey="water" fill="oklch(0.9 0.036 145)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Steps Area Recharts */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Steps Counter - Past 7 Days</Label>
                <div className="h-60 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weeklyData}>
                      <CartesianGrid stroke="var(--color-border)" vertical={false} />
                      <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "0.75rem", fontSize: "0.8rem" }} />
                      <defs>
                        <linearGradient id="colorSteps" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="steps" stroke="var(--color-chart-1)" strokeWidth={2} fillOpacity={1} fill="url(#colorSteps)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Report Summary */}
          <div className="grid gap-6 md:grid-cols-3">
            <div className="surface p-5 space-y-3">
              <h3 className="eyebrow flex items-center gap-1.5"><Droplets className="size-4 text-accent-foreground" /> Water Report</h3>
              <p className="text-sm text-muted-foreground">Monthly Intake Target: <span className="font-semibold text-foreground">90 Litres</span></p>
              <p className="text-sm text-muted-foreground">Total Logged: <span className="font-semibold text-foreground">74.5 Litres</span></p>
              <div className="text-xs text-success flex items-center gap-1 mt-1 font-semibold">
                <TrendingUp className="size-3.5" /> +12% increase from last month
              </div>
            </div>

            <div className="surface p-5 space-y-3">
              <h3 className="eyebrow flex items-center gap-1.5"><Moon className="size-4 text-primary" /> Sleep Cycles</h3>
              <p className="text-sm text-muted-foreground">Avg Sleep Duration: <span className="font-semibold text-foreground">7.1 hours</span></p>
              <p className="text-sm text-muted-foreground">Avg Sleep Score: <span className="font-semibold text-foreground">76 /100</span></p>
              <div className="text-xs text-success flex items-center gap-1 mt-1 font-semibold">
                <TrendingUp className="size-3.5" /> Sleep score improved by 4 points
              </div>
            </div>

            <div className="surface p-5 space-y-3">
              <h3 className="eyebrow flex items-center gap-1.5"><Footprints className="size-4 text-clay-foreground" /> Daily Movement</h3>
              <p className="text-sm text-muted-foreground">Avg Daily Steps: <span className="font-semibold text-foreground">8,050 steps</span></p>
              <p className="text-sm text-muted-foreground">Total Distance: <span className="font-semibold text-foreground">181 km</span></p>
              <div className="text-xs text-success flex items-center gap-1 mt-1 font-semibold">
                <TrendingUp className="size-3.5" /> Daily goals met on 22 of 30 days
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
