import { createFileRoute } from "@tanstack/react-router";
import { Sunrise, Moon, CalendarDays } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { routines, habits, foodGuidance } from "@/lib/mock-data";

export const Route = createFileRoute("/routine")({
  head: () => ({
    meta: [
      { title: "Personalised Skincare Routine — Lumea" },
      {
        name: "description",
        content:
          "Your AI-built morning, night and weekly routine with exact products, quantities, waiting times and diet plus lifestyle targets.",
      },
      { property: "og:title", content: "Personalised Skincare Routine — Lumea" },
      {
        property: "og:description",
        content:
          "Morning, night and weekly routines generated from your scan, food, sleep and weather data.",
      },
    ],
  }),
  component: RoutinePage,
});

const blocks = [
  { key: "morning", label: "Morning routine", icon: Sunrise, steps: routines.morning },
  { key: "night", label: "Night routine", icon: Moon, steps: routines.night },
  { key: "weekly", label: "Weekly rituals", icon: CalendarDays, steps: routines.weekly },
] as const;

function RoutinePage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Module 6 · Recommendation engine"
        title="Your plan for this week"
        description="Built from your face scan, food log, sleep, stress, weather and UV index. It updates automatically after every scan."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {blocks.map(({ key, label, icon: Icon, steps }) => (
          <div key={key} className="surface p-6">
            <div className="flex items-center gap-2">
              <Icon className="size-4 text-muted-foreground" />
              <h2 className="text-xl">{label}</h2>
            </div>
            <ol className="mt-5 space-y-4">
              {steps.map((s, i) => (
                <li key={s.step} className="flex gap-3">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs text-accent-foreground">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{s.step}</p>
                    <p className="text-sm text-muted-foreground">{s.product}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {s.note}
                      {s.wait !== "—" ? ` · wait ${s.wait}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="surface p-6">
          <h2 className="text-xl">Daily targets</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <Target label="Water" value={`${habits.water.goal} L`} />
            <Target label="Sleep" value={`${habits.sleep.goal} h`} />
            <Target label="Movement" value={`${habits.steps.goal} steps`} />
            <Target label="Screen time" value={`under ${habits.screen.goal} h`} />
            <Target label="Stress" value={`${habits.stress.goal}/10 or lower`} />
          </ul>
        </div>
        <div className="surface p-6">
          <h2 className="text-xl">Diet suggestions</h2>
          <div className="mt-4 space-y-1.5 text-sm">
            {foodGuidance.eat.map((f) => (
              <p key={f}>{f}</p>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {foodGuidance.avoid.map((f) => (
              <Badge key={f} variant="outline">
                Limit {f}
              </Badge>
            ))}
          </div>
        </div>
        <div className="surface p-6">
          <h2 className="text-xl">Seasonal note</h2>
          <p className="mt-4 text-sm text-muted-foreground">
            Humidity is high and UV index reads {habits.uv.current}. We kept textures light, moved
            exfoliation to twice weekly, and prioritised a matte high-protection sunscreen. Expect a
            heavier barrier cream recommendation once temperatures drop.
          </p>
        </div>
      </div>
    </AppShell>
  );
}

function Target({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-baseline justify-between border-b border-border pb-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </li>
  );
}
