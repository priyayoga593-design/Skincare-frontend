import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { assistantQuestions, profile, skinAnalysis } from "@/lib/mock-data";

export const Route = createFileRoute("/assistant")({
  head: () => ({
    meta: [
      { title: "AI Beauty Assistant — Lumea" },
      {
        name: "description",
        content:
          "Ask your AI beauty assistant anything about your skin, ingredients, shade matching or why a product was recommended — answered from your own scan data.",
      },
      { property: "og:title", content: "AI Beauty Assistant — Lumea" },
      {
        property: "og:description",
        content: "Ask about acne causes, shade matching and ingredient safety, grounded in your scan.",
      },
    ],
  }),
  component: AssistantPage,
});

type Msg = { role: "user" | "ai"; text: string };

function AssistantPage() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "ai",
      text: `Hi ${profile.name.split(" ")[0]} — I have your latest scan (score ${skinAnalysis.healthScore}, oily / medium / warm) and this week's habits. Ask me anything.`,
    },
  ]);
  const [draft, setDraft] = useState("");

  const send = (text: string) => {
    if (!text.trim()) return;
    const known = assistantQuestions.find(
      (q) => q.q.toLowerCase() === text.trim().toLowerCase(),
    );
    setMessages((m) => [
      ...m,
      { role: "user", text },
      {
        role: "ai",
        text:
          known?.a ??
          "In this prototype I answer from a sample knowledge base. Connected to Cloud, I would reason over your scan history, food log, habits and the product catalogue to answer this specifically.",
      },
    ]);
    setDraft("");
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Module 10 · AI assistant"
        title="Ask about your skin"
        description="Answers are grounded in your scan results, lifestyle log and recommended products — not generic advice."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <div className="surface flex min-h-[28rem] flex-col p-6">
          <div className="flex-1 space-y-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                  m.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                {m.text}
              </div>
            ))}
          </div>
          <form
            className="mt-6 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              send(draft);
            }}
          >
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Which sunscreen is suitable for me?"
            />
            <Button type="submit" aria-label="Send message">
              <Send className="size-4" />
            </Button>
          </form>
        </div>

        <div className="surface h-fit p-6">
          <p className="eyebrow">Try asking</p>
          <div className="mt-3 space-y-2">
            {assistantQuestions.map((q) => (
              <button
                key={q.q}
                onClick={() => send(q.q)}
                className="flex w-full gap-2 rounded-xl bg-muted p-3 text-left text-sm transition-colors hover:bg-accent/60"
              >
                <Sparkles className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                {q.q}
              </button>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
