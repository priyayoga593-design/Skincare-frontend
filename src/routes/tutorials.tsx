import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { 
  Clock, Sparkles, Heart, Share2, Globe, PlayCircle, 
  AlertTriangle, Lightbulb, CheckCircle2, SlidersHorizontal, Loader2
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AIVideoPlayer, TutorialData } from "@/components/AIVideoPlayer";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/config";
import { useAuth } from "@/lib/auth-context";
import { useScan } from "@/lib/scan-context";

export const Route = createFileRoute("/tutorials")({
  head: () => ({
    meta: [
      { title: "AI Tutorial Video Hub — 360° Skincare & Makeup" },
      {
        name: "description",
        content:
          "Personalized AI video tutorials with multi-language narration, step-by-step skincare & makeup walkthroughs, and dermatologist tips.",
      },
    ],
  }),
  component: TutorialsPage,
});

const LANGUAGES = [
  { code: "en", label: "🇺🇸 English" },
  { code: "es", label: "🇪🇸 Español" },
  { code: "fr", label: "🇫🇷 Français" },
  { code: "hi", label: "🇮🇳 हिन्दी" },
  { code: "de", label: "🇩🇪 Deutsch" },
  { code: "ja", label: "🇯🇵 日本語" },
  { code: "ko", label: "🇰🇷 한국어" },
  { code: "zh", label: "🇨🇳 中文" },
  { code: "pt", label: "🇵🇹 Português" },
  { code: "it", label: "🇮🇹 Italiano" },
  { code: "ar", label: "🇸🇦 العربية" },
];

const DIFFICULTY_LEVELS = ["All", "Beginner", "Intermediate", "Advanced"];
const CATEGORIES = ["All", "Skincare Prep", "Foundation & Base", "Contouring & Highlight", "Removal & Night Routine"];

function TutorialsPage() {
  const { user } = useAuth();
  const { scanReport } = useScan();

  const [tutorialsList, setTutorialsList] = useState<TutorialData[]>([]);
  const [activeTutorialIdx, setActiveTutorialIdx] = useState<number>(0);
  const [activeStepIdx, setActiveStepIdx] = useState<number>(0);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("en");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("All");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [showGenerateModal, setShowGenerateModal] = useState<boolean>(false);
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  const uid = user?.uid || "demo_user";

  // 1. Fetch Curated Tutorials & User Progress
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [tutRes, progRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/tutorials`),
          fetch(`${API_BASE_URL}/api/tutorials/${uid}/progress`)
        ]);

        const tutData = await tutRes.json();
        const progData = await progRes.json();

        if (tutData.success && tutData.tutorials) {
          setTutorialsList(tutData.tutorials);
        }

        if (progData.success && progData.progress) {
          setFavorites(progData.progress.favorites || []);
          setCompletedSteps(progData.progress.completed || []);
          if (progData.progress.language) setSelectedLanguage(progData.progress.language);
        }
      } catch (err) {
        console.error("Error loading tutorials:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [uid]);

  const activeTutorial: TutorialData | undefined = tutorialsList[activeTutorialIdx] || tutorialsList[0];
  const activeStep = activeTutorial?.steps[activeStepIdx] || activeTutorial?.steps[0];

  // Sync Progress & Language to Backend / Firestore
  const syncProgress = async (favoriteId?: string, stepId?: string, lang?: string) => {
    try {
      await fetch(`${API_BASE_URL}/api/tutorials/${uid}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activeTutorialId: activeTutorial?.id,
          activeStep: activeStepIdx + 1,
          favoriteTutorialId: favoriteId,
          completedStepId: stepId,
          language: lang || selectedLanguage
        })
      });
    } catch (err) {
      console.warn("Failed to sync progress:", err);
    }
  };

  const handleToggleFavorite = () => {
    if (!activeTutorial?.id) return;
    const isFav = favorites.includes(activeTutorial.id);
    const updated = isFav ? favorites.filter(id => id !== activeTutorial.id) : [...favorites, activeTutorial.id];
    setFavorites(updated);
    syncProgress(activeTutorial.id);
    toast.success(isFav ? "Removed from favorites" : "Added tutorial to your favorites!");
  };

  const handleLanguageChange = (langCode: string) => {
    setSelectedLanguage(langCode);
    syncProgress(undefined, undefined, langCode);
    toast.info(`Switched audio narration & subtitles to ${LANGUAGES.find(l => l.code === langCode)?.label}`);
  };

  // Generate Custom AI Tutorial via Gemini API
  const handleGenerateCustomTutorial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;

    setIsGenerating(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/tutorials/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skinScan: {
            skinType: scanReport?.skinType || "Combination",
            concerns: scanReport?.concerns || ["Radiance", "Hydration"]
          },
          query: customPrompt.trim(),
          difficulty: difficultyFilter !== "All" ? difficultyFilter : "Beginner"
        })
      });

      const data = await res.json();
      if (data.success && data.tutorial) {
        setTutorialsList(prev => [data.tutorial, ...prev]);
        setActiveTutorialIdx(0);
        setActiveStepIdx(0);
        setShowGenerateModal(false);
        setCustomPrompt("");
        toast.success("✨ Your custom AI video tutorial has been generated!");
      } else {
        toast.error("Could not generate custom tutorial. Please try again.");
      }
    } catch (err) {
      toast.error("Failed to connect to AI generation server.");
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredTutorials = tutorialsList.filter(t => {
    const matchDiff = difficultyFilter === "All" || (t.level || "Beginner") === difficultyFilter;
    const matchCat = categoryFilter === "All" || (t.category || "Skincare Prep") === categoryFilter;
    return matchDiff && matchCat;
  });

  return (
    <AppShell>
      {/* Page Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <PageHeader
            eyebrow="🎥 AI-Powered Video Module"
            title="Skincare & Makeup Video Tutorials"
            description="Personalized step-by-step video tutorials from beginner to advanced levels, featuring AI voice narration and multi-language subtitles."
          />
          <div className="flex items-center gap-3">
            {/* Language Selector */}
            <div className="flex items-center gap-2 bg-card border border-border/60 rounded-full px-4 py-2 shadow-sm">
              <Globe className="size-4 text-primary" />
              <select
                value={selectedLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="bg-transparent text-xs font-medium text-foreground focus:outline-none cursor-pointer"
              >
                {LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code} className="bg-card text-foreground">
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>

            {/* AI Generator Trigger */}
            <Button 
              className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2 font-medium shadow-md"
              onClick={() => setShowGenerateModal(true)}
            >
              <Sparkles className="size-4" /> Custom AI Video
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Main Content Layout */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="size-10 animate-spin text-primary mb-4" />
          <p className="text-sm text-muted-foreground">Loading personalized AI video tutorials...</p>
        </div>
      ) : activeTutorial ? (
        <div className="grid gap-8 lg:grid-cols-[1fr_22rem] mt-6">
          {/* Main Video & Timeline Section */}
          <div className="space-y-6">
            {/* AI Video Player Component */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="rounded-3xl overflow-hidden shadow-2xl bg-card border border-border/50"
            >
              <AIVideoPlayer 
                tutorial={activeTutorial} 
                selectedLanguage={selectedLanguage}
                onStepChange={(stepIdx) => setActiveStepIdx(stepIdx)}
              />

              {/* Video Title & Actions */}
              <div className="p-6 bg-card border-t border-border/50 flex flex-wrap gap-4 items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Badge variant="secondary" className="text-xs bg-primary/10 text-primary font-medium border-0">
                      {activeTutorial.level || "Beginner"}
                    </Badge>
                    <Badge variant="outline" className="text-xs border-border/60 text-muted-foreground">
                      {activeTutorial.category || "Skincare Prep"}
                    </Badge>
                  </div>
                  <h2 className="text-2xl font-display font-medium tracking-tight text-foreground">{activeTutorial.title}</h2>
                  <p className="text-muted-foreground text-xs mt-1 flex items-center gap-2">
                    <Clock className="size-3.5 text-primary" /> {activeTutorial.duration} · {activeTutorial.steps.length} Steps · Tailored for {scanReport?.skinType || "Combination"} Skin
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className={`rounded-full transition-colors ${favorites.includes(activeTutorial.id || "") ? "bg-rose-500/10 text-rose-500 border-rose-500/30" : "hover:bg-primary/10 hover:text-primary"}`}
                    onClick={handleToggleFavorite}
                  >
                    <Heart className="size-5 fill-current" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
                    onClick={() => {
                      navigator.clipboard?.writeText(window.location.href);
                      toast.success("Tutorial link copied to clipboard!");
                    }}
                  >
                    <Share2 className="size-5" />
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Active Step Detailed Technique Breakdown */}
            {activeStep && (
              <motion.div 
                key={`${activeTutorial.id}-${activeStepIdx}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="surface p-6 space-y-4 border border-border/60 rounded-3xl"
              >
                <div className="flex items-center justify-between border-b border-border/50 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center size-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                      {activeStep.stepNumber}
                    </span>
                    <div>
                      <h3 className="font-display font-medium text-lg text-foreground">{activeStep.title}</h3>
                      <p className="text-xs text-muted-foreground">Product Type: {activeStep.productType || "Skincare Essential"}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                    Duration: {activeStep.durationSec || 60}s
                  </Badge>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  {/* Application Technique */}
                  <div className="p-4 rounded-2xl bg-card border border-border/50 space-y-1.5">
                    <div className="flex items-center gap-2 text-primary font-medium text-xs">
                      <CheckCircle2 className="size-4" /> Correct Technique
                    </div>
                    <p className="text-xs text-foreground/90 leading-relaxed">{activeStep.technique || "Apply gently using upward strokes."}</p>
                  </div>

                  {/* Common Mistake to Avoid */}
                  <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-1.5">
                    <div className="flex items-center gap-2 text-amber-500 font-medium text-xs">
                      <AlertTriangle className="size-4" /> Mistake to Avoid
                    </div>
                    <p className="text-xs text-foreground/90 leading-relaxed">{activeStep.avoidMistake || "Avoid pulling sensitive skin around eyes."}</p>
                  </div>

                  {/* MUA / Derm Pro Tip */}
                  <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-1.5">
                    <div className="flex items-center gap-2 text-emerald-500 font-medium text-xs">
                      <Lightbulb className="size-4" /> Dermatologist Pro Tip
                    </div>
                    <p className="text-xs text-foreground/90 leading-relaxed">{activeStep.proTip || "Allow 60 seconds absorption between steps."}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar: Library & Filters */}
          <div className="space-y-6">
            {/* Category & Difficulty Filter Pills */}
            <div className="surface p-4 space-y-3 border border-border/60 rounded-3xl">
              <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                <span className="flex items-center gap-1.5">
                  <SlidersHorizontal className="size-3.5 text-primary" /> Filter Tutorials
                </span>
                <span className="text-muted-foreground font-normal">{filteredTutorials.length} available</span>
              </div>

              {/* Difficulty Filter */}
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Level</span>
                <div className="flex flex-wrap gap-1.5">
                  {DIFFICULTY_LEVELS.map(level => (
                    <button
                      key={level}
                      onClick={() => setDifficultyFilter(level)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                        difficultyFilter === level
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-card"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Filter */}
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Category</span>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                        categoryFilter === cat
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-card"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Video Library Catalog List */}
            <div className="surface p-3 space-y-2 border border-border/60 rounded-3xl">
              <h3 className="text-sm font-semibold p-2 pb-1 text-foreground">Curated Video Catalog</h3>
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {filteredTutorials.map((t, idx) => {
                  const globalIdx = tutorialsList.findIndex(item => item.id === t.id);
                  const isSelected = globalIdx === activeTutorialIdx;

                  return (
                    <button
                      key={t.id || t.title}
                      onClick={() => {
                        setActiveTutorialIdx(globalIdx >= 0 ? globalIdx : 0);
                        setActiveStepIdx(0);
                      }}
                      className={`w-full p-3.5 rounded-2xl text-left transition-all duration-300 relative overflow-hidden flex gap-3 ${
                        isSelected 
                          ? "bg-primary/10 text-primary border border-primary/30 shadow-sm" 
                          : "hover:bg-card border border-transparent text-muted-foreground"
                      }`}
                    >
                      <div className="relative size-16 rounded-xl overflow-hidden shrink-0 bg-muted">
                        <img src={t.thumbnail || "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&q=80&w=300"} alt={t.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <PlayCircle className="size-5 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                            {t.level || "Beginner"}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground font-mono">{t.duration}</span>
                        </div>
                        <h4 className={`text-xs font-semibold line-clamp-1 ${isSelected ? "text-primary" : "text-foreground"}`}>{t.title}</h4>
                        <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{t.steps.length} Step-by-Step Breakdown</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* AI Custom Tutorial Prompt Modal */}
      <AnimatePresence>
        {showGenerateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border/60 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-5 text-primary" />
                  <h3 className="font-display font-medium text-lg text-foreground">Generate AI Custom Tutorial</h3>
                </div>
                <button onClick={() => setShowGenerateModal(false)} className="text-muted-foreground hover:text-foreground text-sm font-semibold">✕</button>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Describe any specific skincare routine, makeup style, foundation matching issue, or night repair technique you wish to learn.
              </p>

              <form onSubmit={handleGenerateCustomTutorial} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Custom Tutorial Goal / Technique</label>
                  <Input
                    placeholder="e.g., Glass Skin Routine for Sensitive Skin, Contouring for Round Face, Safe Mascara Removal..."
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    className="rounded-2xl"
                    disabled={isGenerating}
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <Button type="button" variant="outline" className="rounded-full" onClick={() => setShowGenerateModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isGenerating || !customPrompt.trim()} className="rounded-full bg-primary text-primary-foreground gap-2">
                    {isGenerating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                    {isGenerating ? "Generating Tutorial..." : "Generate AI Tutorial"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
