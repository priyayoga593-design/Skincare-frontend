import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { analyzeFood } from "./nutrition-utils";

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
  addFood: (food: Omit<FoodItem, "id" | "isSkinUnfriendly">) => { isUnfriendly: boolean; reminder?: string; suggestion?: string };
  removeFood: (id: string) => void;
  updateWaterIntake: (amount: number) => void;
  remindersEnabled: boolean;
  setRemindersEnabled: (enabled: boolean) => void;
}

const NutritionContext = createContext<NutritionContextType | undefined>(undefined);

const defaultToday: DailyNutritionLog = {
  date: new Date().toISOString().split("T")[0],
  foods: [],
  waterIntake: 0,
};

export function NutritionProvider({ children }: { children: ReactNode }) {
  const [dailyLogs, setDailyLogs] = useState<DailyNutritionLog[]>([]);
  const [remindersEnabled, setRemindersEnabled] = useState(true);

  // Initialize with some mock data for reports if needed, or empty
  useEffect(() => {
    // Generate some mock historical data for the reports
    const mockLogs: DailyNutritionLog[] = [];
    for (let i = 1; i <= 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      mockLogs.push({
        date: d.toISOString().split("T")[0],
        foods: [
          {
            id: `mock-${i}-1`,
            name: "Oatmeal",
            quantity: "1 bowl",
            time: "08:00",
            mealType: "breakfast",
            calories: 300,
            protein: 10,
            carbs: 45,
            fat: 5,
            sugar: 2,
            isSkinUnfriendly: false,
          },
          {
            id: `mock-${i}-2`,
            name: i % 2 === 0 ? "Pizza" : "Salad",
            quantity: "1 portion",
            time: "13:00",
            mealType: "lunch",
            calories: i % 2 === 0 ? 600 : 350,
            isSkinUnfriendly: i % 2 === 0,
          }
        ],
        waterIntake: 1500 + Math.random() * 1000,
      });
    }
    setDailyLogs([...mockLogs, defaultToday]);
  }, []);

  const todayLog = dailyLogs.find(l => l.date === defaultToday.date) || defaultToday;

  const addFood = (foodData: Omit<FoodItem, "id" | "isSkinUnfriendly">) => {
    const analysis = analyzeFood(foodData.name);
    
    const newFood: FoodItem = {
      ...foodData,
      id: Math.random().toString(36).substr(2, 9),
      isSkinUnfriendly: analysis.isSkinUnfriendly,
    };

    setDailyLogs(prev => {
      const logs = [...prev];
      const todayIndex = logs.findIndex(l => l.date === defaultToday.date);
      if (todayIndex >= 0) {
        logs[todayIndex] = {
          ...logs[todayIndex],
          foods: [...logs[todayIndex].foods, newFood],
        };
      } else {
        logs.push({
          date: defaultToday.date,
          foods: [newFood],
          waterIntake: 0,
        });
      }
      return logs;
    });

    return {
      isUnfriendly: analysis.isSkinUnfriendly,
      reminder: analysis.reminder,
      suggestion: analysis.suggestion
    };
  };

  const removeFood = (id: string) => {
    setDailyLogs(prev => {
      const logs = [...prev];
      const todayIndex = logs.findIndex(l => l.date === defaultToday.date);
      if (todayIndex >= 0) {
        logs[todayIndex] = {
          ...logs[todayIndex],
          foods: logs[todayIndex].foods.filter(f => f.id !== id),
        };
      }
      return logs;
    });
  };

  const updateWaterIntake = (amount: number) => {
    setDailyLogs(prev => {
      const logs = [...prev];
      const todayIndex = logs.findIndex(l => l.date === defaultToday.date);
      if (todayIndex >= 0) {
        logs[todayIndex] = {
          ...logs[todayIndex],
          waterIntake: logs[todayIndex].waterIntake + amount,
        };
      }
      return logs;
    });
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
