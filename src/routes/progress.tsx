import { createFileRoute } from "@tanstack/react-router";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { TrendingUp } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { progressSeries, skinAnalysis, habits } from "@/lib/mock-data";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "Skin Progress & Reports — Lumea" },
      {
        name: "description",
        content:
          "Track skin health over time with before/after comparisons, weekly and monthly reports, hydration and acne trends, and lifestyle correlation.",
      },
      { property: "og:title", content: "Skin Progress & Reports — Lumea" },
      {
        property: "og:description",
        content: "Weekly and monthly skin progress reports with hydration and acne trend graphs.",
      },
    ],
  }),
  component: ProgressPage,
});

function ProgressPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Modules 3 & 10 · Progress and reports"
        title="Six weeks of change"
        description="Each scan is stored and compared, so improvement is measured rather than guessed."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Skin health score" value={`${skinAnalysis.healthScore}`} delta="+16 in 6 wks" />
        <Stat label="Hydration" value="68%" delta="+27 pts" />
        <Stat label="Lifestyle score" value={`${habits.lifestyleScore}`} delta="+9 pts" />
      </div>

      <div className="surface mt-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl">Skin health graph</h2>
          <div className="flex gap-2">
            <Badge variant="secondary">Score</Badge>
            <Badge variant="outline">Hydration</Badge>
            <Badge variant="outline">Acne density</Badge>
          </div>
        </div>
        <div className="mt-6 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={progressSeries}>
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
              <Line
                type="monotone"
                dataKey="score"
                stroke="var(--color-chart-1)"
                strokeWidth={2.5}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="hydration"
                stroke="var(--color-chart-3)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="acne"
                stroke="var(--color-chart-2)"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="surface p-6 lg:col-span-2">
          <h2 className="text-xl">Before &amp; after</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {[
              { label: "Week 1", score: 58, notes: "Active breakouts on chin, dull tone, tight skin after cleansing." },
              { label: "Week 6", score: 74, notes: "Fewer active lesions, marks fading, oil balanced by midday." },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-muted p-5">
                <p className="eyebrow">{s.label}</p>
                <p className="mt-1 font-display text-3xl">{s.score}</p>
                <p className="mt-2 text-sm text-muted-foreground">{s.notes}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="surface p-6">
          <h2 className="text-xl">Weekly report</h2>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li>Routine adherence: 83% (13 of 14 nights)</li>
            <li>Water goal met on 4 of 7 days</li>
            <li>Average sleep 6.4h — biggest limiter</li>
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
