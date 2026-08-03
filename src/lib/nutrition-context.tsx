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

interface NutritionContextType {
  dailyLogs: DailyNutritionLog[];
  todayLog: DailyNutritionLog;
  addFood: (food: Omit<FoodItem, "id" | "isSkinUnfriendly">) => Promise<{ isUnfriendly: boolean; reminder?: string; suggestion?: string }>;
  removeFood: (food: FoodItem) => Promise<void>;
  updateWaterIntake: (amount: number) => Promise<void>;
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

export function NutritionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [dailyLogs, setDailyLogs] = useState<DailyNutritionLog[]>([defaultToday]);
  const [remindersEnabled, setRemindersEnabled] = useState(true);

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
      const loadedLogs = snapshot.docs.map((doc) => ({
        date: doc.id,
        ...doc.data(),
      })) as DailyNutritionLog[];

      // Ensure today exists
      if (!loadedLogs.find(l => l.date === todayStr)) {
        loadedLogs.unshift({ ...defaultToday, date: todayStr });
      }

      setDailyLogs(loadedLogs);
    });

    return () => unsubscribe();
  }, [user?.uid, todayStr]);

  const todayLog = dailyLogs.find(l => l.date === todayStr) || defaultToday;

  const addFood = async (foodData: Omit<FoodItem, "id" | "isSkinUnfriendly">) => {
    // Call the backend API
    const apiUrl = `${API_BASE_URL}/analyze-food`;

    let analysis = {
      calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, fibre: 0,
      isSkinUnfriendly: false, reminder: "", suggestion: ""
    };

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: foodData.name,
          quantity: foodData.quantity
        }),
      });
      const data = await response.json();
      if (data.success && data.analysis) {
        analysis = data.analysis;
      }
    } catch (err) {
      console.error("[Nutrition] Failed to fetch AI analysis", err);
    }
    
    const newFood: FoodItem = {
      ...foodData,
      id: Math.random().toString(36).substr(2, 9),
      isSkinUnfriendly: analysis.isSkinUnfriendly,
      // Merge AI estimates with user's optional inputs (user input overrides)
      calories: foodData.calories !== undefined ? foodData.calories : analysis.calories,
      protein: foodData.protein !== undefined ? foodData.protein : analysis.protein,
      carbs: foodData.carbs !== undefined ? foodData.carbs : analysis.carbs,
      fat: foodData.fat !== undefined ? foodData.fat : analysis.fat,
      sugar: foodData.sugar !== undefined ? foodData.sugar : analysis.sugar,
      fibre: foodData.fibre !== undefined ? foodData.fibre : analysis.fibre,
    };

    if (user?.uid) {
      const docRef = doc(db, "users", user.uid, "nutritionLogs", todayStr);
      await setDoc(docRef, {
        foods: arrayUnion(newFood),
        date: todayStr
      }, { merge: true });
    }

    return {
      isUnfriendly: analysis.isSkinUnfriendly,
      reminder: analysis.reminder,
      suggestion: analysis.suggestion
    };
  };

  const removeFood = async (food: FoodItem) => {
    if (user?.uid) {
      const docRef = doc(db, "users", user.uid, "nutritionLogs", todayStr);
      await updateDoc(docRef, {
        foods: arrayRemove(food)
      });
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

  return (
    <NutritionContext.Provider
      value={{
        dailyLogs,
        todayLog,
        addFood,
        removeFood,
        updateWaterIntake,
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
