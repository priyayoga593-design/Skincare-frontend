import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./auth-context";
import { useScan } from "./scan-context";
import { API_BASE_URL } from "./config";

export interface WaterLog {
  id: string;
  amount: number; // in ml
  timestamp: string; // ISO string
}

export interface SleepLog {
  id: string;
  bedtime: string; // Time string HH:MM
  wakeup: string; // Time string HH:MM
  duration: number; // in hours
  score: number; // 0-100
  method: "manual" | "google" | "apple";
  date: string; // YYYY-MM-DD
}

export interface StepsLog {
  date: string; // YYYY-MM-DD
  steps: number;
  calories: number; // kcal
  distance: number; // km
  method: string;
}

interface HealthContextType {
  waterGoal: number; // in ml
  waterLogs: WaterLog[];
  todayWater: number; // in ml
  addWater: (amount: number) => void;
  setWaterGoal: (goal: number) => void;
  clearWaterLogs: () => void;

  sleepLogs: SleepLog[];
  sleepSyncMethod: "manual" | "google" | "apple";
  todaySleep: SleepLog | null;
  addSleep: (bedtime: string, wakeup: string, method?: "manual" | "google" | "apple") => void;
  setSleepSyncMethod: (method: "manual" | "google" | "apple") => void;

  stepsLogs: StepsLog[];
  stepsGoal: number;
  stepSyncMethod: string;
  todaySteps: StepsLog;
  addSteps: (steps: number, method?: string) => void;
  setStepsGoal: (goal: number) => void;
  setStepSyncMethod: (method: string) => void;

  aiRecommendations: string[];
}

const HealthContext = createContext<HealthContextType | undefined>(undefined);

export const HealthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { currentScan } = useScan();
  
  // --- WATER STATE ---
  const [waterGoal, setWaterGoalInternal] = useState(3000); // 3L default
  const [waterLogs, setWaterLogs] = useState<WaterLog[]>([]);

  // --- SLEEP STATE ---
  const [sleepSyncMethod, setSleepSyncMethodInternal] = useState<"manual" | "google" | "apple">("manual");
  const [sleepLogs, setSleepLogs] = useState<SleepLog[]>([]);

  // --- STEPS STATE ---
  const [stepsGoal, setStepsGoalInternal] = useState(8000);
  const [stepSyncMethod, setStepSyncMethodInternal] = useState("sensor");
  const [stepsLogs, setStepsLogs] = useState<StepsLog[]>([]);

  const [aiRecommendations, setAiRecommendations] = useState<string[]>([]);

  // Helpers to get dates
  function getTodayDateString() {
    const today = new Date();
    return today.toISOString().split("T")[0];
  }

  // Load health data from Backend on mount
  useEffect(() => {
    if (!user?.uid) {
      setWaterLogs([]);
      setSleepLogs([]);
      setStepsLogs([]);
      return;
    }

    const loadData = async () => {
      try {
        const apiUrl = `${API_BASE_URL}/health/${user.uid}`;
          
        const res = await fetch(apiUrl);
        if (res.ok) {
          const result = await res.json();
          if (result.success && result.data) {
            const data = result.data;
            if (data.waterGoal !== undefined) setWaterGoalInternal(data.waterGoal);
            if (data.waterLogs) setWaterLogs(data.waterLogs);
            
            if (data.sleepLogs) setSleepLogs(data.sleepLogs);
            if (data.sleepSyncMethod) setSleepSyncMethodInternal(data.sleepSyncMethod);
            
            if (data.stepsGoal !== undefined) setStepsGoalInternal(data.stepsGoal);
            if (data.stepsLogs) setStepsLogs(data.stepsLogs);
            if (data.stepSyncMethod) setStepSyncMethodInternal(data.stepSyncMethod);
          }
        }
      } catch (err) {
        console.error("Failed to load health data", err);
      }
    };
    
    loadData();
  }, [user?.uid]);

  const apiUrlBase = `${API_BASE_URL}/health/${user?.uid}`;

  // --- WATER ACTIONS ---
  const addWater = async (amount: number) => {
    const newLog: WaterLog = {
      id: Math.random().toString(36).substring(7),
      amount,
      timestamp: new Date().toISOString(),
    };
    const updated = [...waterLogs, newLog];
    setWaterLogs(updated); // Optimistic Update

    if (user?.uid) {
      try {
        await fetch(`${apiUrlBase}/water`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ waterLogs: updated })
        });
      } catch (err) { console.error(err); }
    }
  };

  const setWaterGoal = async (goal: number) => {
    setWaterGoalInternal(goal);
    if (user?.uid) {
      try {
        await fetch(`${apiUrlBase}/goals`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ waterGoal: goal })
        });
      } catch (err) { console.error(err); }
    }
  };

  const clearWaterLogs = async () => {
    setWaterLogs([]);
    if (user?.uid) {
      try {
        await fetch(`${apiUrlBase}/water`, { method: "DELETE" });
      } catch (err) { console.error(err); }
    }
  };

  const todayWater = waterLogs
    .filter((log) => log.timestamp.startsWith(getTodayDateString()))
    .reduce((sum, log) => sum + log.amount, 0);

  // --- SLEEP ACTIONS ---
  const addSleep = async (bedtime: string, wakeup: string, method: "manual" | "google" | "apple" = "manual") => {
    const [bedH, bedM] = bedtime.split(":").map(Number);
    const [wakeH, wakeM] = wakeup.split(":").map(Number);

    let duration = 0;
    if (wakeH > bedH || (wakeH === bedH && wakeM >= bedM)) {
      duration = (wakeH * 60 + wakeM - (bedH * 60 + bedM)) / 60;
    } else {
      duration = (24 * 60 - (bedH * 60 + bedM) + (wakeH * 60 + wakeM)) / 60;
    }
    duration = Math.round(duration * 10) / 10;

    let score = 100;
    if (duration < 7.5) {
      score -= (7.5 - duration) * 15;
    } else if (duration > 8.5) {
      score -= (duration - 8.5) * 10;
    }
    score = Math.max(30, Math.min(100, Math.round(score)));

    const newLog: SleepLog = {
      id: Math.random().toString(36).substring(7),
      bedtime,
      wakeup,
      duration,
      score,
      method,
      date: getTodayDateString(),
    };

    const updated = sleepLogs.filter((log) => log.date !== getTodayDateString()).concat(newLog);
    setSleepLogs(updated);

    if (user?.uid) {
      try {
        await fetch(`${apiUrlBase}/sleep`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sleepLogs: updated })
        });
      } catch (err) { console.error(err); }
    }
  };

  const setSleepSyncMethod = async (method: "manual" | "google" | "apple") => {
    setSleepSyncMethodInternal(method);
    if (user?.uid) {
      try {
        await fetch(`${apiUrlBase}/sync`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sleepSyncMethod: method })
        });
      } catch (err) { console.error(err); }
    }

    if (method === "google" || method === "apple") {
      setTimeout(() => { addSleep("22:45", "07:00", method); }, 1000);
    }
  };

  const todaySleep = sleepLogs.find((log) => log.date === getTodayDateString()) || null;

  // --- STEPS ACTIONS ---
  const addSteps = async (steps: number, method: string = "sensor") => {
    const todayStr = getTodayDateString();
    const calories = Math.round(steps * 0.04);
    const distance = Math.round((steps * 0.00075) * 100) / 100;

    const newLog: StepsLog = {
      date: todayStr,
      steps,
      calories,
      distance,
      method,
    };

    const updated = stepsLogs.filter((log) => log.date !== todayStr).concat(newLog);
    setStepsLogs(updated);

    if (user?.uid) {
      try {
        await fetch(`${apiUrlBase}/steps`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stepsLogs: updated })
        });
      } catch (err) { console.error(err); }
    }
  };

  const setStepsGoal = async (goal: number) => {
    setStepsGoalInternal(goal);
    if (user?.uid) {
      try {
        await fetch(`${apiUrlBase}/goals`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stepsGoal: goal })
        });
      } catch (err) { console.error(err); }
    }
  };

  const setStepSyncMethod = async (method: string) => {
    setStepSyncMethodInternal(method);
    if (user?.uid) {
      try {
        await fetch(`${apiUrlBase}/sync`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stepSyncMethod: method })
        });
      } catch (err) { console.error(err); }
    }

    if (method !== "sensor" && method !== "manual") {
      setTimeout(() => { addSteps(10420, method); }, 1000);
    }
  };

  const todaySteps = stepsLogs.find((log) => log.date === getTodayDateString()) || {
    date: getTodayDateString(),
    steps: 0,
    calories: 0,
    distance: 0,
    method: "sensor",
  };

  // --- AI RECOMMENDATION ENGINE ---
  useEffect(() => {
    const fetchInsights = async () => {
      if (!user?.uid) return;
      const waterLitre = todayWater / 1000;
      const sleepHrs = todaySleep?.duration || 6.4;
      const stepsCount = todaySteps.steps;
      const skinType = currentScan?.skinType || "Unknown";
      
      try {
        const query = new URLSearchParams({
          water: waterLitre.toString(),
          sleep: sleepHrs.toString(),
          steps: stepsCount.toString(),
          skinType
        }).toString();
        
        const res = await fetch(`${apiUrlBase}/insights?${query}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.recommendations) {
            setAiRecommendations(data.recommendations);
          }
        }
      } catch (err) {
        console.error("Failed to fetch AI insights", err);
      }
    };

    // Debounce or only fetch when metrics change substantially to avoid spamming the backend
    const timeout = setTimeout(() => {
      fetchInsights();
    }, 1500);

    return () => clearTimeout(timeout);
  }, [todayWater, todaySleep?.duration, todaySteps.steps, currentScan?.skinType, user?.uid, apiUrlBase]);

  return (
    <HealthContext.Provider
      value={{
        waterGoal,
        waterLogs,
        todayWater,
        addWater,
        setWaterGoal,
        clearWaterLogs,

        sleepLogs,
        sleepSyncMethod,
        todaySleep,
        addSleep,
        setSleepSyncMethod,

        stepsLogs,
        stepsGoal,
        stepSyncMethod,
        todaySteps,
        addSteps,
        setStepsGoal,
        setStepSyncMethod,

        aiRecommendations,
      }}
    >
      {children}
    </HealthContext.Provider>
  );
};

export const useHealth = () => {
  const context = useContext(HealthContext);
  if (context === undefined) {
    throw new Error("useHealth must be used within a HealthProvider");
  }
  return context;
};
