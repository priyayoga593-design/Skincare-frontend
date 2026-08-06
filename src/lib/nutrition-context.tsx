import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { db } from "@/firebase/firebase";
import { collection, query, orderBy, onSnapshot, setDoc, doc, updateDoc, arrayUnion, arrayRemove, increment } from "firebase/firestore";
import { useAuth } from "./auth-context";
import { API_BASE_URL } from "./config";

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export interface FoodItem {
  id: string;
  name: string;
  quantity: string;
  time: string;
  mealType: MealType;
  // Optional details
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  sugar?: number;
  fibre?: number;
  mood?: string;
  energyLevel?: string;
  notes?: string;
  // Computed
  isSkinUnfriendly: boolean;
}

export interface DailyNutritionLog {
  date: string;
  foods: FoodItem[];
  waterIntake: number; // in ml
}

export interface OptimalMacroTarget {
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  ratios?: { carbs: number; protein: number; fat: number };
  bmr?: number;
  tdee?: number;
  micronutrients?: Record<string, { amount: string; benefit: string }>;
  skinFocusReason?: string;
}

interface NutritionContextType {
  dailyLogs: DailyNutritionLog[];
  todayLog: DailyNutritionLog;
  optimalMacros: OptimalMacroTarget;
  healthGoal: string;
  setHealthGoal: (goal: string) => void;
  dietaryPreferences: string[];
  setDietaryPreferences: (prefs: string[]) => void;
  addFood: (food: Omit<FoodItem, "id" | "isSkinUnfriendly">) => Promise<{ isUnfriendly: boolean; reminder?: string; suggestion?: string }>;
  removeFood: (food: FoodItem) => Promise<void>;
  updateWaterIntake: (amount: number) => Promise<void>;
  calculateOptimalMacros: (scanReport?: any) => Promise<OptimalMacroTarget>;
  fetchMealRecommendations: (scanReport?: any, customQuery?: string) => Promise<any>;
  remindersEnabled: boolean;
  setRemindersEnabled: (enabled: boolean) => void;
}

const NutritionContext = createContext<NutritionContextType | undefined>(undefined);

const getTodayDateString = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split("T")[0];
};

const defaultToday: DailyNutritionLog = {
  date: getTodayDateString(),
  foods: [],
  waterIntake: 0,
};

const defaultOptimalMacros: OptimalMacroTarget = {
  calories: 2000,
  carbs: 225,
  protein: 125,
  fat: 67,
  ratios: { carbs: 45, protein: 25, fat: 30 },
  skinFocusReason: "Balanced nutrient intake for clear, radiant skin."
};

export function NutritionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [dailyLogs, setDailyLogs] = useState<DailyNutritionLog[]>([defaultToday]);
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [healthGoal, setHealthGoal] = useState<string>("skin_glow");
  const [dietaryPreferences, setDietaryPreferences] = useState<string[]>([]);
  const [optimalMacros, setOptimalMacros] = useState<OptimalMacroTarget>(defaultOptimalMacros);

  const todayStr = getTodayDateString();

  // Load chat history from Firestore
  useEffect(() => {
    if (!user?.uid) {
      setDailyLogs([defaultToday]);
      return;
    }

    const logsRef = collection(db, "users", user.uid, "nutritionLogs");
    const q = query(logsRef, orderBy("date", "desc")); // Fetch recent logs

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedLogs = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() || {};
        return {
          date: docSnap.id,
          foods: Array.isArray(data.foods) ? data.foods : [],
          waterIntake: typeof data.waterIntake === "number" ? data.waterIntake : 0,
        };
      }) as DailyNutritionLog[];

      // Ensure today exists
      if (!loadedLogs.find(l => l.date === todayStr)) {
        loadedLogs.unshift({ ...defaultToday, date: todayStr });
      }

      setDailyLogs(loadedLogs);
    });

    return () => unsubscribe();
  }, [user?.uid, todayStr]);

  const rawToday = dailyLogs.find(l => l.date === todayStr) || defaultToday;
  const todayLog: DailyNutritionLog = {
    date: rawToday.date || todayStr,
    foods: Array.isArray(rawToday.foods) ? rawToday.foods : [],
    waterIntake: typeof rawToday.waterIntake === "number" ? rawToday.waterIntake : 0,
  };

  const addFood = async (foodData: Omit<FoodItem, "id" | "isSkinUnfriendly">) => {
    // 1. Call backend validation & analysis API
    const apiUrl = `${API_BASE_URL}/validate-food`;

    let analysis: any = {
      calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, fibre: 0,
      isSkinUnfriendly: false, reminder: "", suggestion: ""
    };

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: foodData.name,
        quantity: foodData.quantity
      }),
    });

    const data = await response.json();
    if (!response.ok || !data.success || data.isValid === false) {
      throw new Error(data.message || "Please enter a valid food name.");
    }

    if (data.analysis) {
      analysis = data.analysis;
    }
    
    const newFood: FoodItem = {
      ...foodData,
      id: Math.random().toString(36).substr(2, 9),
      isSkinUnfriendly: !!analysis.isSkinUnfriendly,
      // Merge AI estimates with user's optional inputs (user input overrides)
      calories: foodData.calories !== undefined ? foodData.calories : analysis.calories,
      protein: foodData.protein !== undefined ? foodData.protein : analysis.protein,
      carbs: foodData.carbs !== undefined ? foodData.carbs : analysis.carbs,
      fat: foodData.fat !== undefined ? foodData.fat : analysis.fat,
      sugar: foodData.sugar !== undefined ? foodData.sugar : analysis.sugar,
      fibre: foodData.fibre !== undefined ? foodData.fibre : analysis.fibre,
    };

    // 2. Dual Database Sync: Save to Cloud Firestore & Backend DB API
    if (user?.uid) {
      try {
        // Backend DB sync endpoint
        await fetch(`${API_BASE_URL}/nutrition/${user.uid}/log`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ food: newFood, date: todayStr }),
        });

        // Firestore direct sync
        const docRef = doc(db, "users", user.uid, "nutritionLogs", todayStr);
        await setDoc(docRef, {
          foods: arrayUnion(newFood),
          date: todayStr
        }, { merge: true });
      } catch (err) {
        console.warn("[Nutrition Sync Warning]", err);
      }
    }

    return {
      isUnfriendly: analysis.isSkinUnfriendly,
      reminder: analysis.reminder,
      suggestion: analysis.suggestion
    };
  };

  const removeFood = async (food: FoodItem) => {
    if (user?.uid) {
      try {
        await fetch(`${API_BASE_URL}/nutrition/${user.uid}/log/${food.id}?date=${todayStr}`, {
          method: "DELETE"
        });

        const docRef = doc(db, "users", user.uid, "nutritionLogs", todayStr);
        await updateDoc(docRef, {
          foods: arrayRemove(food)
        });
      } catch (err) {
        console.warn("[Delete Sync Error]", err);
      }
    }
  };

  const updateWaterIntake = async (amount: number) => {
    if (user?.uid) {
      const docRef = doc(db, "users", user.uid, "nutritionLogs", todayStr);
      await setDoc(docRef, {
        waterIntake: increment(amount),
        date: todayStr
      }, { merge: true });
    }
  };

  const calculateOptimalMacros = async (scanReport?: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/calculate-optimal-macros`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          age: user?.profile?.age || 26,
          gender: user?.profile?.gender || "Female",
          weight: 62,
          height: 165,
          activityLevel: "moderate",
          healthGoal,
          skinScan: scanReport || null,
          dietaryPreferences
        }),
      });

      const data = await response.json();
      if (data.success && data.data?.optimalMacros) {
        const fullData: OptimalMacroTarget = {
          calories: data.data.optimalMacros.calories,
          carbs: data.data.optimalMacros.carbs,
          protein: data.data.optimalMacros.protein,
          fat: data.data.optimalMacros.fat,
          ratios: data.data.optimalMacros.ratios,
          bmr: data.data.bmr,
          tdee: data.data.tdee,
          micronutrients: data.data.micronutrients,
          skinFocusReason: data.data.skinFocusReason
        };
        setOptimalMacros(fullData);
        return fullData;
      }
    } catch (err) {
      console.error("Failed to calculate optimal macros", err);
    }
    return defaultOptimalMacros;
  };

  const fetchMealRecommendations = async (scanReport?: any, customQuery: string = "") => {
    try {
      const foodsList = todayLog?.foods || [];
      const eatenCalories = foodsList.reduce((acc, f) => acc + (f?.calories || 0), 0);
      const eatenProtein = foodsList.reduce((acc, f) => acc + (f?.protein || 0), 0);
      const eatenCarbs = foodsList.reduce((acc, f) => acc + (f?.carbs || 0), 0);
      const eatenFat = foodsList.reduce((acc, f) => acc + (f?.fat || 0), 0);

      const response = await fetch(`${API_BASE_URL}/recommend-meals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skinScan: scanReport || null,
          dailyIntake: {
            calories: eatenCalories,
            carbs: eatenCarbs,
            protein: eatenProtein,
            fat: eatenFat,
            foods: foodsList
          },
          optimalMacros,
          healthGoal,
          dietaryPreferences,
          customQuery
        }),
      });

      const data = await response.json();
      if (data.success && data.recommendations) {
        return data.recommendations;
      }
    } catch (err) {
      console.error("Failed to fetch meal recommendations", err);
    }
    return null;
  };

  return (
    <NutritionContext.Provider
      value={{
        dailyLogs,
        todayLog,
        optimalMacros,
        healthGoal,
        setHealthGoal,
        dietaryPreferences,
        setDietaryPreferences,
        addFood,
        removeFood,
        updateWaterIntake,
        calculateOptimalMacros,
        fetchMealRecommendations,
        remindersEnabled,
        setRemindersEnabled,
      }}
    >
      {children}
    </NutritionContext.Provider>
  );
}

export function useNutrition() {
  const context = useContext(NutritionContext);
  if (context === undefined) {
    throw new Error("useNutrition must be used within a NutritionProvider");
  }
  return context;
}
