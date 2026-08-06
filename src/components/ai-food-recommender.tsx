import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Utensils,
  Flame,
  Droplets,
  HeartPulse,
  Shield,
  Activity,
  Plus,
  Check,
  RefreshCw,
  Zap,
  Info,
  Apple,
  Clock,
  Send,
  Sliders,
  ChevronRight,
  Smile,
  AlertTriangle
} from "lucide-react";
import { useScan } from "@/lib/scan-context";
import { useNutrition, type MealType } from "@/lib/nutrition-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

const DIETARY_OPTIONS = [
  "Vegetarian",
  "Vegan",
  "Dairy-Free",
  "Gluten-Free",
  "Keto",
  "Low GI",
  "High Protein",
  "Nut-Free",
  "Halal"
];

const GOAL_OPTIONS = [
  { id: "skin_glow", label: "🌟 Skin Radiance & Glow", desc: "High antioxidants & Vitamin C for luminous tone" },
  { id: "anti_acne", label: "🔥 Anti-Acne & Sebum Control", desc: "Low Glycemic Index carbs & Zinc for pore control" },
  { id: "barrier_repair", label: "💧 Moisture Barrier Repair", desc: "Essential Fatty Acids & GLA for epidermal hydration" },
  { id: "anti_aging", label: "⏳ Anti-Aging & Collagen", desc: "Amino acids & Vitamin E for skin firming & elasticity" },
  { id: "weight_loss", label: "⚖️ Calorie Control & Detox", desc: "Metabolic deficit with skin nutrient density" }
];

export function AIFoodRecommender() {
  const { currentScan } = useScan();
  const {
    todayLog,
    optimalMacros,
    healthGoal,
    setHealthGoal,
    dietaryPreferences,
    setDietaryPreferences,
    calculateOptimalMacros,
    fetchMealRecommendations,
    addFood
  } = useNutrition();

  const [loadingMacros, setLoadingMacros] = useState(false);
  const [loadingMeals, setLoadingMeals] = useState(false);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"all" | "breakfast" | "lunch" | "dinner" | "snacks">("all");
  const [customQuery, setCustomQuery] = useState("");
  const [loggingMealId, setLoggingMealId] = useState<string | null>(null);

  // Initial calculation on mount or scan change
  useEffect(() => {
    handleSync();
  }, [currentScan?.id, healthGoal, JSON.stringify(dietaryPreferences)]);

  const handleSync = async () => {
    setLoadingMacros(true);
    setLoadingMeals(true);
    try {
      await calculateOptimalMacros(currentScan);
      const recs = await fetchMealRecommendations(currentScan);
      setRecommendations(recs);
    } catch (err) {
      console.error("Failed to sync AI nutrition", err);
    } finally {
      setLoadingMacros(false);
      setLoadingMeals(false);
    }
  };

  const handleToggleDietary = (pref: string) => {
    if (dietaryPreferences.includes(pref)) {
      setDietaryPreferences(dietaryPreferences.filter(p => p !== pref));
    } else {
      setDietaryPreferences([...dietaryPreferences, pref]);
    }
  };

  const handleCustomSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuery.trim()) return;
    setLoadingMeals(true);
    try {
      const recs = await fetchMealRecommendations(currentScan, customQuery);
      if (recs) {
        setRecommendations(recs);
        toast.success("Custom meal recommendations updated!");
      }
    } catch (err) {
      toast.error("Failed to search custom meal recommendations.");
    } finally {
      setLoadingMeals(false);
    }
  };

  const handleLogMeal = async (meal: any, mealType: MealType) => {
    setLoggingMealId(meal.title);
    try {
      await addFood({
        name: meal.title,
        quantity: "1 serving",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mealType,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat,
        notes: `AI Recommended for ${meal.skinBenefit || "Skin Health"}`
      });
      toast.success(`Logged "${meal.title}" to your daily intake!`, {
        icon: "🥗",
        description: `+${meal.calories} kcal, +${meal.protein}g protein added.`
      });
    } catch (err) {
      toast.error("Failed to log meal to daily intake.");
    } finally {
      setLoggingMealId(null);
    }
  };

  // Intake Calculations
  const foodsList = todayLog?.foods || [];
  const eatenCalories = foodsList.reduce((acc, f) => acc + (f?.calories || 0), 0);
  const eatenCarbs = foodsList.reduce((acc, f) => acc + (f?.carbs || 0), 0);
  const eatenProtein = foodsList.reduce((acc, f) => acc + (f?.protein || 0), 0);
  const eatenFat = foodsList.reduce((acc, f) => acc + (f?.fat || 0), 0);

  const calTarget = optimalMacros?.calories || 2000;
  const carbTarget = optimalMacros?.carbs || 225;
  const proteinTarget = optimalMacros?.protein || 125;
  const fatTarget = optimalMacros?.fat || 67;

  const calProgress = Math.min(100, Math.round((eatenCalories / calTarget) * 100));
  const carbProgress = Math.min(100, Math.round((eatenCarbs / carbTarget) * 100));
  const proteinProgress = Math.min(100, Math.round((eatenProtein / proteinTarget) * 100));
  const fatProgress = Math.min(100, Math.round((eatenFat / fatTarget) * 100));

  const skinType = currentScan?.skinType || "Combination";
  const skinTypeEmoji = currentScan?.skinTypeEmoji || "⚖️";
  const activeConcerns = currentScan?.concerns?.filter(c => c.severity === "Moderate" || c.severity === "High") || [];

  return (
    <div className="space-y-8">
      {/* ─── FACIAL SKIN ANALYSIS CONNECTIVITY CARD ─── */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-accent/10 p-6 shadow-md backdrop-blur-md">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Facial Skin Scan Synced
            </div>
            <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl flex items-center gap-2">
              Skin-Targeted Nutrition Engine {skinTypeEmoji}
            </h2>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Connected with your <strong>{skinType} Skin Profile</strong>. Analyzes your current skin condition, acne/hydration metrics, and daily intake gap to calculate optimal macronutrients.
            </p>
          </div>

          <Button
            onClick={handleSync}
            disabled={loadingMacros || loadingMeals}
            variant="outline"
            className="self-start md:self-auto rounded-xl border-primary/30 bg-background/80 hover:bg-primary hover:text-primary-foreground transition-all shadow-sm"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loadingMacros ? "animate-spin" : ""}`} />
            Re-sync Skin Scan
          </Button>
        </div>

        {/* Skin Metrics Snapshot Badges */}
        <div className="mt-4 pt-4 border-t border-border/50 flex flex-wrap gap-2 items-center text-xs">
          <span className="text-muted-foreground font-medium mr-1">Facial Analysis Profile:</span>
          <span className="rounded-lg bg-card px-2.5 py-1 font-medium border border-border shadow-xs">
            Skin Type: <strong>{skinType}</strong>
          </span>
          {currentScan?.acneScore !== undefined && (
            <span className="rounded-lg bg-card px-2.5 py-1 font-medium border border-border shadow-xs flex items-center gap-1">
              <Flame className="h-3 w-3 text-amber-500" /> Acne Score: <strong>{currentScan.acneScore}/100</strong>
            </span>
          )}
          {currentScan?.hydrationScore !== undefined && (
            <span className="rounded-lg bg-card px-2.5 py-1 font-medium border border-border shadow-xs flex items-center gap-1">
              <Droplets className="h-3 w-3 text-blue-500" /> Hydration: <strong>{currentScan.hydrationScore}/100</strong>
            </span>
          )}
          {activeConcerns.length > 0 ? (
            activeConcerns.slice(0, 3).map((c, i) => (
              <span key={i} className="rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 px-2.5 py-1 font-medium">
                {c.emoji} {c.label} ({c.severity})
              </span>
            ))
          ) : (
            <span className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 px-2.5 py-1 font-medium">
              🌿 Clear & Balanced Skin
            </span>
          )}
        </div>
      </div>

      {/* ─── GOAL & DIETARY PREFERENCE SELECTORS ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Health & Skin Goal Selector */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-3">
          <label className="text-sm font-semibold flex items-center gap-2 text-foreground">
            <HeartPulse className="h-4 w-4 text-primary" /> Primary Skin & Health Goal
          </label>
          <div className="space-y-2">
            {GOAL_OPTIONS.map((g) => (
              <button
                key={g.id}
                onClick={() => setHealthGoal(g.id)}
                className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-start justify-between ${
                  healthGoal === g.id
                    ? "border-primary bg-primary/10 font-semibold text-primary shadow-xs"
                    : "border-border/60 bg-background/60 hover:bg-muted text-muted-foreground"
                }`}
              >
                <div>
                  <div className="font-semibold text-sm text-foreground">{g.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{g.desc}</div>
                </div>
                {healthGoal === g.id && <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />}
              </button>
            ))}
          </div>
        </div>

        {/* Dietary Preferences Selector */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <label className="text-sm font-semibold flex items-center gap-2 text-foreground mb-2">
              <Sliders className="h-4 w-4 text-primary" /> Dietary Preferences & Restrictions
            </label>
            <p className="text-xs text-muted-foreground mb-4">
              Select any dietary requirements to filter meal recommendations for your lifestyle.
            </p>

            <div className="flex flex-wrap gap-2">
              {DIETARY_OPTIONS.map((pref) => {
                const isSelected = dietaryPreferences.includes(pref);
                return (
                  <button
                    key={pref}
                    onClick={() => handleToggleDietary(pref)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all border ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                    }`}
                  >
                    {isSelected ? "✓ " : "+ "}{pref}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
            <Info className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
            <div>
              <strong>Skin Focus Reason:</strong> {optimalMacros?.skinFocusReason || "Balanced nutrient ratios tailored for optimal facial health."}
            </div>
          </div>
        </div>
      </div>

      {/* ─── OPTIMAL DAILY MACRO REQUIREMENT DASHBOARD ─── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" /> Daily Optimal Macronutrient Targets
          </h3>
          <span className="text-xs text-muted-foreground">
            BMR: <strong>{optimalMacros?.bmr || 1450} kcal</strong> | TDEE: <strong>{optimalMacros?.tdee || 1950} kcal</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* CALORIES CARD */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-xs space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="h-4 w-4 text-orange-500" /> Calories
              </span>
              <span className="font-bold text-foreground">{eatenCalories} / {calTarget} kcal</span>
            </div>
            <div className="space-y-1">
              <Progress value={calProgress} className="h-2.5 bg-muted" />
              <div className="flex justify-between text-[11px] text-muted-foreground pt-1">
                <span>{calProgress}% Consumed</span>
                <span className="font-medium text-foreground">{Math.max(0, calTarget - eatenCalories)} kcal remaining</span>
              </div>
            </div>
          </div>

          {/* CARBOHYDRATES CARD */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Apple className="h-4 w-4 text-emerald-500" /> Carbs
              </span>
              <span className="font-bold text-foreground">{eatenCarbs} / {carbTarget}g</span>
            </div>
            <div className="space-y-1">
              <Progress value={carbProgress} className="h-2.5 bg-muted" />
              <div className="flex justify-between text-[11px] text-muted-foreground pt-1">
                <span>{carbProgress}% ({optimalMacros?.ratios?.carbs || 45}% Target)</span>
                <span className="font-medium text-foreground">{Math.max(0, carbTarget - eatenCarbs)}g gap</span>
              </div>
            </div>
          </div>

          {/* PROTEIN CARD */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-blue-500" /> Protein
              </span>
              <span className="font-bold text-foreground">{eatenProtein} / {proteinTarget}g</span>
            </div>
            <div className="space-y-1">
              <Progress value={proteinProgress} className="h-2.5 bg-muted" />
              <div className="flex justify-between text-[11px] text-muted-foreground pt-1">
                <span>{proteinProgress}% ({optimalMacros?.ratios?.protein || 25}% Target)</span>
                <span className="font-medium text-foreground">{Math.max(0, proteinTarget - eatenProtein)}g gap</span>
              </div>
            </div>
          </div>

          {/* FAT CARD */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Droplets className="h-4 w-4 text-amber-500" /> Healthy Fat
              </span>
              <span className="font-bold text-foreground">{eatenFat} / {fatTarget}g</span>
            </div>
            <div className="space-y-1">
              <Progress value={fatProgress} className="h-2.5 bg-muted" />
              <div className="flex justify-between text-[11px] text-muted-foreground pt-1">
                <span>{fatProgress}% ({optimalMacros?.ratios?.fat || 30}% Target)</span>
                <span className="font-medium text-foreground">{Math.max(0, fatTarget - eatenFat)}g gap</span>
              </div>
            </div>
          </div>
        </div>

        {/* Skin Specific Micronutrient Focus Bar */}
        <div className="rounded-xl border border-border/80 bg-muted/40 p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="font-semibold text-foreground flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-primary" /> Key Skin Micronutrient Focus:
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-md bg-background px-2.5 py-1 border border-border font-medium text-foreground">
              ⚡ <strong>Zinc:</strong> 12 mg (Acne & Sebum)
            </span>
            <span className="rounded-md bg-background px-2.5 py-1 border border-border font-medium text-foreground">
              🌟 <strong>Vitamin C:</strong> 100 mg (Collagen Synthesis)
            </span>
            <span className="rounded-md bg-background px-2.5 py-1 border border-border font-medium text-foreground">
              💧 <strong>Omega-3:</strong> 2.0 g (Moisture Barrier)
            </span>
            <span className="rounded-md bg-background px-2.5 py-1 border border-border font-medium text-foreground">
              🌿 <strong>Vitamin A:</strong> 800 mcg (Cell Renewal)
            </span>
          </div>
        </div>
      </div>

      {/* ─── AI MEAL RECOMMENDATION ENGINE ─── */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Utensils className="h-5 w-5 text-primary" /> Personalized AI Meal Recommendations
            </h3>
            <p className="text-xs text-muted-foreground">
              Tailored to satisfy your remaining macro requirements while targeting your active facial skin needs.
            </p>
          </div>

          {/* Meal Filter Tabs */}
          <div className="flex rounded-full bg-muted p-1 text-xs font-medium self-start">
            {(["all", "breakfast", "lunch", "dinner", "snacks"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-3 py-1 capitalize transition-all ${
                  activeTab === tab
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* AI Insight Header Banner */}
        {recommendations?.insight && (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs text-foreground flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <strong className="text-primary block font-semibold mb-0.5">AI Clinical Dietary Insight:</strong>
              {recommendations.insight}
            </div>
          </div>
        )}

        {/* Custom AI Meal Generator Input */}
        <form onSubmit={handleCustomSearch} className="flex gap-2">
          <Input
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
            placeholder="Ask AI for specific meals (e.g. 'Low-carb dinner rich in Zinc for acne skin'...)"
            className="rounded-xl border-border bg-card text-xs text-foreground shadow-xs"
          />
          <Button
            type="submit"
            disabled={loadingMeals || !customQuery.trim()}
            className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs px-4"
          >
            {loadingMeals ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
            Ask AI
          </Button>
        </form>

        {/* MEAL CARDS GRID */}
        {loadingMeals ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-48 rounded-2xl border border-border bg-card/50 animate-pulse p-6 space-y-3">
                <div className="h-6 bg-muted rounded-md w-2/3" />
                <div className="h-4 bg-muted rounded-md w-full" />
                <div className="h-4 bg-muted rounded-md w-4/5" />
                <div className="h-8 bg-muted rounded-xl w-1/3 pt-4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* BREAKFAST */}
            {(activeTab === "all" || activeTab === "breakfast") && recommendations?.breakfast && (
              <MealCard
                meal={recommendations.breakfast}
                mealType="breakfast"
                onLog={handleLogMeal}
                isLogging={loggingMealId === recommendations.breakfast.title}
              />
            )}

            {/* LUNCH */}
            {(activeTab === "all" || activeTab === "lunch") && recommendations?.lunch && (
              <MealCard
                meal={recommendations.lunch}
                mealType="lunch"
                onLog={handleLogMeal}
                isLogging={loggingMealId === recommendations.lunch.title}
              />
            )}

            {/* DINNER */}
            {(activeTab === "all" || activeTab === "dinner") && recommendations?.dinner && (
              <MealCard
                meal={recommendations.dinner}
                mealType="dinner"
                onLog={handleLogMeal}
                isLogging={loggingMealId === recommendations.dinner.title}
              />
            )}

            {/* SNACKS */}
            {(activeTab === "all" || activeTab === "snacks") && Array.isArray(recommendations?.snacks) && (
              recommendations.snacks.map((snack: any, index: number) => (
                <MealCard
                  key={index}
                  meal={snack}
                  mealType="snack"
                  onLog={handleLogMeal}
                  isLogging={loggingMealId === snack.title}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── REUSABLE MEAL CARD COMPONENT ───
function MealCard({
  meal,
  mealType,
  onLog,
  isLogging
}: {
  meal: any;
  mealType: MealType;
  onLog: (meal: any, type: MealType) => void;
  isLogging: boolean;
}) {
  return (
    <div className="group relative rounded-2xl border border-border bg-card p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4">
      <div className="space-y-2.5">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl p-2 rounded-xl bg-muted/60 border border-border/40 shrink-0">
              {meal.icon || "🥣"}
            </span>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                {mealType} • {meal.prepTime || "15 mins"}
              </span>
              <h4 className="text-base font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
                {meal.title}
              </h4>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground leading-relaxed">
          {meal.description}
        </p>

        {/* Skin Benefit Badge */}
        {meal.skinBenefit && (
          <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[11px] font-medium text-emerald-800 dark:text-emerald-300">
            <Sparkles className="h-3 w-3 text-emerald-500 shrink-0" />
            <span>{meal.skinBenefit}</span>
          </div>
        )}

        {/* Ingredients */}
        {Array.isArray(meal.ingredients) && meal.ingredients.length > 0 && (
          <div className="text-[11px] text-muted-foreground pt-1">
            <strong className="text-foreground">Key Ingredients:</strong> {meal.ingredients.join(", ")}
          </div>
        )}
      </div>

      {/* Footer / Macro Pills & One-click Log Button */}
      <div className="pt-3 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <span className="rounded-md bg-muted px-2 py-0.5 text-foreground font-semibold">
            {meal.calories} kcal
          </span>
          <span>C: {meal.carbs}g</span>
          <span>•</span>
          <span>P: {meal.protein}g</span>
          <span>•</span>
          <span>F: {meal.fat}g</span>
        </div>

        <Button
          onClick={() => onLog(meal, mealType)}
          disabled={isLogging}
          size="sm"
          className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs shadow-xs shrink-0"
        >
          {isLogging ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1" />
          ) : (
            <Plus className="h-3.5 w-3.5 mr-1" />
          )}
          Log to Intake
        </Button>
      </div>
    </div>
  );
}
