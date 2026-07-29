import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Apple,
  Coffee,
  Croissant,
  Utensils,
  Plus,
  Info,
  TrendingUp,
  Activity,
  Heart,
  Settings as SettingsIcon,
  Bell,
  Trash2,
  Droplets,
  ChevronDown,
  ChevronUp
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
import { useNutrition, type MealType } from "@/lib/nutrition-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/nutrition")({
  head: () => ({
    meta: [
      { title: "Health & Nutrition — 360° Skincare" },
      {
        name: "description",
        content: "Daily food tracker, smart skin-friendly detection, and nutrition summary.",
      },
    ],
  }),
  component: NutritionPage,
});

type TabView = "today" | "summary" | "reports" | "settings";

function NutritionPage() {
  const {
    todayLog,
    dailyLogs,
    addFood,
    removeFood,
    updateWaterIntake,
    remindersEnabled,
    setRemindersEnabled
  } = useNutrition();

  const [activeTab, setActiveTab] = useState<TabView>("today");

  // Form State
  const [selectedMeal, setSelectedMeal] = useState<MealType>("breakfast");
  const [foodName, setFoodName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [time, setTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  
  // Optional Details State
  const [showOptional, setShowOptional] = useState(false);
  const [calories, setCalories] = useState<number | "">("");
  const [protein, setProtein] = useState<number | "">("");
  const [carbs, setCarbs] = useState<number | "">("");
  const [fat, setFat] = useState<number | "">("");
  const [sugar, setSugar] = useState<number | "">("");
  const [fibre, setFibre] = useState<number | "">("");
  const [mood, setMood] = useState("");
  const [energy, setEnergy] = useState("");
  const [notes, setNotes] = useState("");

  const resetForm = () => {
    setFoodName("");
    setQuantity("");
    setCalories("");
    setProtein("");
    setCarbs("");
    setFat("");
    setSugar("");
    setFibre("");
    setMood("");
    setEnergy("");
    setNotes("");
    setShowOptional(false);
  };

  const handleAddFood = (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodName || !quantity) {
      toast.error("Please enter a food name and quantity.");
      return;
    }

    const { isUnfriendly, reminder, suggestion } = addFood({
      name: foodName,
      quantity,
      time,
      mealType: selectedMeal,
      calories: calories === "" ? undefined : calories,
      protein: protein === "" ? undefined : protein,
      carbs: carbs === "" ? undefined : carbs,
      fat: fat === "" ? undefined : fat,
      sugar: sugar === "" ? undefined : sugar,
      fibre: fibre === "" ? undefined : fibre,
      mood,
      energyLevel: energy,
      notes,
    });

    if (isUnfriendly && reminder) {
      toast(reminder, {
        icon: "💛",
        style: {
          background: "oklch(0.97 0.05 90)",
          color: "oklch(0.3 0.1 90)",
          borderColor: "oklch(0.9 0.1 90)",
        },
      });
      if (suggestion) {
        setTimeout(() => {
          toast(`Healthy Alternative: Try ${suggestion} next time!`, {
            icon: "✨",
            style: {
              background: "oklch(0.95 0.05 140)",
              color: "oklch(0.3 0.1 140)",
              borderColor: "oklch(0.85 0.1 140)",
            },
          });
        }, 3000);
      }
    } else {
      toast.success("Food logged successfully!");
    }

    resetForm();
  };

  // Calculations for Summary
  const totalCalories = todayLog.foods.reduce((acc, f) => acc + (f.calories || 0), 0);
  const totalProtein = todayLog.foods.reduce((acc, f) => acc + (f.protein || 0), 0);
  const totalCarbs = todayLog.foods.reduce((acc, f) => acc + (f.carbs || 0), 0);
  const totalFat = todayLog.foods.reduce((acc, f) => acc + (f.fat || 0), 0);
  
  const totalFoods = todayLog.foods.length;
  const unfriendlyFoodsCount = todayLog.foods.filter(f => f.isSkinUnfriendly).length;
  const friendlyFoodsCount = totalFoods - unfriendlyFoodsCount;
  
  const skinFriendlyScore = totalFoods === 0 ? 100 : Math.round((friendlyFoodsCount / totalFoods) * 100);

  // Mock Graph Data for Reports
  const weeklyData = dailyLogs.slice(-7).map((log, index) => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const totalLogFoods = log.foods.length || 1;
    const healthyCount = log.foods.filter(f => !f.isSkinUnfriendly).length;
    return {
      day: days[index % 7],
      healthy: Math.round((healthyCount / totalLogFoods) * 100) || (80 + Math.random() * 20),
      sugar: log.foods.reduce((acc, f) => acc + (f.sugar || 0), 0) || (10 + Math.random() * 30),
      calories: log.foods.reduce((acc, f) => acc + (f.calories || 0), 0) || 1800 + Math.random() * 500,
    };
  });

  return (
    <AppShell>
      <PageHeader
        eyebrow="Daily Food Tracker"
        title="Health & Nutrition"
        description="Log your daily meals, track macros, and get smart skin-friendly food suggestions."
      />

      {/* Tabs */}
      <div className="mb-6 flex rounded-full bg-muted p-1 overflow-x-auto select-none">
        {(["today", "summary", "reports", "settings"] as TabView[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 min-w-[6rem] rounded-full py-2 text-center text-sm font-medium transition-all capitalize ${
              activeTab === tab
                ? "bg-card text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "today" ? "Today's Log" : tab}
          </button>
        ))}
      </div>

      {/* TODAY'S LOG TAB */}
      {activeTab === "today" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr] animate-fadeIn">
          
          {/* Meal Entry Form */}
          <div className="surface p-6 sm:p-8 space-y-6">
            <h2 className="text-xl font-display flex items-center gap-2">
              <Utensils className="size-5 text-primary" /> Log a Meal
            </h2>

            <div className="flex gap-2 overflow-x-auto pb-2">
              {[
                { id: "breakfast", label: "Breakfast", icon: <Coffee className="size-4" /> },
                { id: "lunch", label: "Lunch", icon: <Utensils className="size-4" /> },
                { id: "dinner", label: "Dinner", icon: <Heart className="size-4" /> },
                { id: "snack", label: "Snack", icon: <Croissant className="size-4" /> },
              ].map((m) => (
                <Button
                  key={m.id}
                  variant={selectedMeal === m.id ? "default" : "outline"}
                  onClick={() => setSelectedMeal(m.id as MealType)}
                  className="flex gap-2 items-center rounded-xl whitespace-nowrap"
                >
                  {m.icon} {m.label}
                </Button>
              ))}
            </div>

            <form onSubmit={handleAddFood} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="foodName">Food Name <span className="text-destructive">*</span></Label>
                <Input
                  id="foodName"
                  placeholder="e.g. Grilled Chicken Sandwich"
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="quantity">Quantity <span className="text-destructive">*</span></Label>
                  <Input
                    id="quantity"
                    placeholder="e.g. 1 portion, 200g"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>
              </div>

              {/* Optional Fields Accordion */}
              <div className="border border-border/60 rounded-xl overflow-hidden bg-muted/20 transition-all">
                <button
                  type="button"
                  onClick={() => setShowOptional(!showOptional)}
                  className="w-full flex items-center justify-between p-4 text-sm font-semibold hover:bg-muted/40 transition-colors"
                >
                  Optional Details (Macros, Mood, Notes)
                  {showOptional ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                </button>
                
                {showOptional && (
                  <div className="p-4 pt-0 space-y-4 border-t border-border/40">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
                      <div className="space-y-1">
                        <Label className="text-xs">Calories</Label>
                        <Input type="number" value={calories} onChange={e => setCalories(e.target.value ? Number(e.target.value) : "")} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Protein (g)</Label>
                        <Input type="number" value={protein} onChange={e => setProtein(e.target.value ? Number(e.target.value) : "")} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Carbs (g)</Label>
                        <Input type="number" value={carbs} onChange={e => setCarbs(e.target.value ? Number(e.target.value) : "")} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Fat (g)</Label>
                        <Input type="number" value={fat} onChange={e => setFat(e.target.value ? Number(e.target.value) : "")} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Sugar (g)</Label>
                        <Input type="number" value={sugar} onChange={e => setSugar(e.target.value ? Number(e.target.value) : "")} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Fibre (g)</Label>
                        <Input type="number" value={fibre} onChange={e => setFibre(e.target.value ? Number(e.target.value) : "")} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Mood after eating</Label>
                        <Input placeholder="e.g. Energetic, Sluggish" value={mood} onChange={e => setMood(e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Energy Level</Label>
                        <Input placeholder="e.g. High, Normal, Low" value={energy} onChange={e => setEnergy(e.target.value)} />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label>Notes</Label>
                      <Textarea placeholder="Any additional details..." value={notes} onChange={e => setNotes(e.target.value)} className="resize-none h-20" />
                    </div>
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full h-12 text-base shadow-lg hover:shadow-primary/25 transition-all">
                <Plus className="size-5 mr-2" /> Add Food to {selectedMeal.charAt(0).toUpperCase() + selectedMeal.slice(1)}
              </Button>
            </form>
          </div>

          {/* Today's Log Display */}
          <div className="surface p-6 space-y-6 flex flex-col h-full max-h-[800px]">
            <div className="flex items-center justify-between border-b border-border/60 pb-4 shrink-0">
              <h2 className="text-xl font-display flex items-center gap-2">
                <Apple className="size-5 text-success" /> Today's Diet
              </h2>
              <span className="text-xs font-semibold bg-success/15 text-success px-2.5 py-1 rounded-full">
                {totalFoods} Items Logged
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
              {["breakfast", "lunch", "dinner", "snack"].map((meal) => {
                const mealFoods = todayLog.foods.filter(f => f.mealType === meal);
                if (mealFoods.length === 0) return null;
                
                return (
                  <div key={meal} className="space-y-3">
                    <h3 className="text-sm font-semibold capitalize flex items-center gap-2 text-muted-foreground">
                      <span className="w-2 h-2 rounded-full bg-primary/60"></span>
                      {meal}
                    </h3>
                    <div className="space-y-2">
                      {mealFoods.map(food => (
                        <div key={food.id} className="bg-card border border-border/50 rounded-xl p-3 flex justify-between items-center group relative overflow-hidden transition-all hover:border-border">
                          {food.isSkinUnfriendly && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400" />
                          )}
                          <div className="pl-2">
                            <p className="font-semibold text-sm flex items-center gap-2">
                              {food.name}
                              {food.isSkinUnfriendly && <span title="May not be skin-friendly" className="text-xs">⚠️</span>}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {food.quantity} • {food.time} 
                              {food.calories ? ` • ${food.calories} kcal` : ''}
                            </p>
                          </div>
                          <button 
                            onClick={() => removeFood(food.id)}
                            className="p-2 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 bg-background/50 rounded-lg"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {totalFoods === 0 && (
                <div className="flex flex-col items-center justify-center text-center py-16 text-muted-foreground space-y-3 h-full">
                  <div className="size-16 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground/50">
                    <Utensils className="size-8" />
                  </div>
                  <p className="text-sm max-w-[200px]">You haven't logged any meals today. Start by adding your breakfast!</p>
                </div>
              )}
            </div>

            {/* Quick Water Log in Sidebar */}
            <div className="shrink-0 pt-4 border-t border-border/60">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold flex items-center gap-1.5"><Droplets className="size-3.5 text-accent-foreground" /> Quick Water</p>
                <p className="text-xs text-muted-foreground">{todayLog.waterIntake} ml logged</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" size="sm" onClick={() => { updateWaterIntake(250); toast.success("+250ml Water added"); }} className="text-xs h-9">
                  + 250ml
                </Button>
                <Button variant="outline" size="sm" onClick={() => { updateWaterIntake(500); toast.success("+500ml Water added"); }} className="text-xs h-9">
                  + 500ml
                </Button>
                <Button variant="outline" size="sm" onClick={() => { updateWaterIntake(1000); toast.success("+1L Water added"); }} className="text-xs h-9">
                  + 1L
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUMMARY TAB */}
      {activeTab === "summary" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Main Score Board */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="surface p-6 sm:p-8 flex items-center gap-6 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-success/5 to-transparent pointer-events-none" />
              <div className="relative z-10 flex size-24 shrink-0 items-center justify-center rounded-[2rem] bg-success/15 text-success shadow-inner border border-success/20">
                <span className="font-display text-4xl">{skinFriendlyScore}</span>
              </div>
              <div className="relative z-10">
                <p className="eyebrow text-success">Skin-Friendly Diet Score</p>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-sm">
                  {skinFriendlyScore >= 80 ? "Excellent! Your food choices are highly beneficial for maintaining clear and healthy skin." : 
                   skinFriendlyScore >= 50 ? "Good effort. Try to reduce oily and sugary foods for even better skin health." : 
                   "Your diet contains many foods that might trigger breakouts. Consider healthier alternatives."}
                </p>
              </div>
            </div>

            <div className="surface p-6 sm:p-8 flex items-center gap-6 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
              <div className="relative z-10 flex size-24 shrink-0 items-center justify-center rounded-[2rem] bg-primary/15 text-primary shadow-inner border border-primary/20">
                <span className="font-display text-4xl">{Math.round((todayLog.waterIntake / 3000) * 100)}<span className="text-xl">%</span></span>
              </div>
              <div className="relative z-10">
                <p className="eyebrow text-primary">Hydration Goal (3L)</p>
                <p className="mt-1 font-display text-2xl">{todayLog.waterIntake} ml</p>
                <Progress value={Math.min(100, (todayLog.waterIntake / 3000) * 100)} className="h-1.5 w-full mt-3 bg-primary/20" />
              </div>
            </div>
          </div>

          {/* Macros & Calorie Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="surface p-5 space-y-2 border-t-4 border-t-amber-400">
              <p className="eyebrow">Estimated Calories</p>
              <h3 className="font-display text-3xl">{totalCalories} <span className="text-sm font-sans text-muted-foreground font-normal">kcal</span></h3>
            </div>
            <div className="surface p-5 space-y-2 border-t-4 border-t-rose-400">
              <p className="eyebrow">Protein</p>
              <h3 className="font-display text-3xl">{totalProtein} <span className="text-sm font-sans text-muted-foreground font-normal">g</span></h3>
            </div>
            <div className="surface p-5 space-y-2 border-t-4 border-t-emerald-400">
              <p className="eyebrow">Carbohydrates</p>
              <h3 className="font-display text-3xl">{totalCarbs} <span className="text-sm font-sans text-muted-foreground font-normal">g</span></h3>
            </div>
            <div className="surface p-5 space-y-2 border-t-4 border-t-blue-400">
              <p className="eyebrow">Fat</p>
              <h3 className="font-display text-3xl">{totalFat} <span className="text-sm font-sans text-muted-foreground font-normal">g</span></h3>
            </div>
          </div>
        </div>
      )}

      {/* REPORTS TAB */}
      {activeTab === "reports" && (
        <div className="space-y-6 animate-fadeIn">
          <div className="surface p-6 sm:p-8">
            <div className="flex items-center justify-between border-b border-border/60 pb-4 mb-6">
              <h2 className="text-xl font-display flex items-center gap-2">
                <TrendingUp className="size-5 text-accent-foreground" /> Weekly Nutrition Trends
              </h2>
            </div>
            
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Healthy Diet Consistency */}
              <div className="space-y-4">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Apple className="size-4 text-success" /> Skin-Friendly Diet Score (%)
                </Label>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorHealthy" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="oklch(0.7 0.15 140)" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="oklch(0.7 0.15 140)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.5} />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }} domain={[0, 100]} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)' }} />
                      <Area type="monotone" dataKey="healthy" stroke="oklch(0.6 0.15 140)" strokeWidth={3} fillOpacity={1} fill="url(#colorHealthy)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Calories Trend */}
              <div className="space-y-4">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Activity className="size-4 text-amber-500" /> Daily Calories (kcal)
                </Label>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.5} />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)' }} cursor={{ fill: 'var(--color-muted)' }} />
                      <Bar dataKey="calories" fill="oklch(0.75 0.15 70)" radius={[6, 6, 0, 0]} barSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SETTINGS TAB */}
      {activeTab === "settings" && (
        <div className="space-y-6 animate-fadeIn max-w-2xl">
          <div className="surface p-6 sm:p-8 space-y-6">
            <h2 className="text-xl font-display flex items-center gap-2 border-b border-border/60 pb-4">
              <SettingsIcon className="size-5 text-primary" /> Nutrition Settings
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/40 rounded-xl border border-border/50">
                <div className="space-y-0.5">
                  <Label className="text-base flex items-center gap-2">
                    <Bell className="size-4" /> Meal Reminders
                  </Label>
                  <p className="text-xs text-muted-foreground">Receive friendly push notifications to log your breakfast, lunch, and dinner.</p>
                </div>
                <div className="flex items-center h-6">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={remindersEnabled}
                      onChange={(e) => {
                        setRemindersEnabled(e.target.checked);
                        toast.success(e.target.checked ? "Meal reminders enabled" : "Meal reminders disabled");
                      }} 
                    />
                    <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>

              <div className="p-4 bg-primary/10 rounded-xl border border-primary/20 flex gap-3">
                <Info className="size-5 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-primary-foreground">Smart AI Analysis</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    360° Skincare automatically analyzes your food entries. High-glycemic, oily, and dairy-heavy foods are flagged as they commonly impact skin clarity and contribute to acne based on dermatological research.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
