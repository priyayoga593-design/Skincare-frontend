import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { Send, Sparkles, Loader2 } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useScan } from "@/lib/scan-context";
import { assistantQuestions, profile as fallbackProfile } from "@/lib/mock-data";
import { db } from "@/firebase/firebase";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { API_BASE_URL } from "@/lib/config";

export const Route = createFileRoute("/assistant")({
  head: () => ({
    meta: [
      { title: "AI Beauty Assistant — 360° Skincare" },
      {
        name: "description",
        content:
          "Ask your AI beauty assistant anything about your skin, ingredients, shade matching or why a product was recommended — answered from your own scan data.",
      },
    ],
  }),
  component: AssistantPage,
});

type Msg = { id?: string; role: "user" | "ai"; text: string; createdAt?: any };

function AssistantPage() {
  const { user } = useAuth();
  const { currentScan } = useScan();
  const currentProfile = user?.profile || fallbackProfile;

  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load chat history from Firestore
  useEffect(() => {
    if (!user?.uid) return;

    const chatsRef = collection(db, "users", user.uid, "chats");
    const q = query(chatsRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedMessages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Msg[];

      // If empty, add a welcome message
      if (loadedMessages.length === 0) {
        setMessages([
          {
            role: "ai",
            text: `Hi ${currentProfile.name.split(" ")[0]} — I have your latest scan results and skincare data. Ask me anything about your skin journey!`,
          },
        ]);
      } else {
        setMessages(loadedMessages);
      }
    });

    return () => unsubscribe();
  }, [user?.uid, currentProfile.name]);

  const send = async (text: string) => {
    if (!text.trim() || isLoading) return;
    
    const userMessage = text.trim();
    setDraft("");
    setIsLoading(true);

    try {
      // 1. Update UI state immediately
      setMessages((prev) => [...prev, { role: "user", text: userMessage }]);

      // Save user message to Firestore asynchronously
      if (user?.uid) {
        try {
          await addDoc(collection(db, "users", user.uid, "chats"), {
            role: "user",
            text: userMessage,
            createdAt: serverTimestamp(),
          });
        } catch (dbErr) {
          console.warn("Could not save user message to Firestore", dbErr);
        }
      }

      // 2. Call the backend API
      const apiUrl = `${API_BASE_URL}/chat`;

      // Safely extract scan context to prevent JSON stringify errors on Firestore Timestamps or circular references
      const safeContext = currentScan ? {
        skinType: currentScan.skinType,
        healthScore: currentScan.healthScore,
        concerns: currentScan.concerns,
        recommendedProducts: currentScan.recommendedProducts
      } : null;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          history: messages, // Send context of the conversation
          context: safeContext, // Send safe scan context
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to get AI response");
      }

      // 3. Save AI response to Firestore
      if (user?.uid) {
        await addDoc(collection(db, "users", user.uid, "chats"), {
          role: "ai",
          text: data.reply,
          createdAt: serverTimestamp(),
        });
      } else {
        setMessages((prev) => [...prev, { role: "ai", text: data.reply }]);
      }

    } catch (error: any) {
      console.error("[Assistant] Error:", error);
      const errorMsg = `I'm sorry, an error occurred: ${error.message || "Could not connect."}`;
      
      // Update UI state first so the user always sees it
      setMessages((prev) => [...prev, { role: "ai", text: errorMsg }]);

      // Attempt to save to firestore, but don't crash if it fails
      if (user?.uid) {
        try {
          await addDoc(collection(db, "users", user.uid, "chats"), {
            role: "ai",
            text: errorMsg,
            createdAt: serverTimestamp(),
          });
        } catch (dbErr) {
          console.warn("Could not save error message to Firestore");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="AI assistant"
        title="Ask about your skin"
        description="Answers are grounded in your scan results, lifestyle log and recommended products — powered by Gemini AI."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <div className="surface flex min-h-[28rem] flex-col p-6 max-h-[70vh]">
          <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
            {messages.map((m, i) => (
              <div
                key={m.id || i}
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
                  m.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                {m.text}
              </div>
            ))}
            {isLoading && (
              <div className="max-w-[85%] rounded-2xl px-4 py-3 text-sm bg-muted text-foreground flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" /> Thinking...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <form
            className="mt-6 flex gap-2 pt-2 border-t border-border/50"
            onSubmit={(e) => {
              e.preventDefault();
              send(draft);
            }}
          >
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Which sunscreen is suitable for me?"
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading || !draft.trim()} aria-label="Send message">
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
                disabled={isLoading}
                className="flex w-full gap-2 rounded-xl bg-muted p-3 text-left text-sm transition-colors hover:bg-accent/60 disabled:opacity-50"
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
