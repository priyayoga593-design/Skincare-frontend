import React, { createContext, useContext, useState, useEffect } from "react";

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

  // Load health data from localStorage on mount
  useEffect(() => {
    const storedWaterGoal = localStorage.getItem("skincare360_water_goal");
    const storedWaterLogs = localStorage.getItem("skincare360_water_logs");
    const storedSleepLogs = localStorage.getItem("skincare360_sleep_logs");
    const storedSleepSync = localStorage.getItem("skincare360_sleep_sync");
    const storedStepsGoal = localStorage.getItem("skincare360_steps_goal");
    const storedStepsLogs = localStorage.getItem("skincare360_steps_logs");
    const storedStepsSync = localStorage.getItem("skincare360_steps_sync");

    if (storedWaterGoal) setWaterGoalInternal(parseInt(storedWaterGoal));
    if (storedWaterLogs) setWaterLogs(JSON.parse(storedWaterLogs));
    
    // Seed initial mock data if empty
    if (storedSleepLogs) {
      setSleepLogs(JSON.parse(storedSleepLogs));
    } else {
      const initialSleep: SleepLog[] = [
        { id: "1", bedtime: "23:00", wakeup: "06:30", duration: 7.5, score: 82, method: "manual", date: getOffsetDateString(-2) },
        { id: "2", bedtime: "23:30", wakeup: "06:00", duration: 6.5, score: 71, method: "google", date: getOffsetDateString(-1) },
        { id: "3", bedtime: "00:15", wakeup: "06:40", duration: 6.4, score: 68, method: "manual", date: getTodayDateString() },
      ];
      setSleepLogs(initialSleep);
      localStorage.setItem("skincare360_sleep_logs", JSON.stringify(initialSleep));
    }

    if (storedSleepSync) setSleepSyncMethodInternal(storedSleepSync as any);
    if (storedStepsGoal) setStepsGoalInternal(parseInt(storedStepsGoal));

    if (storedStepsLogs) {
      setStepsLogs(JSON.parse(storedStepsLogs));
    } else {
      const initialSteps: StepsLog[] = [
        { date: getOffsetDateString(-2), steps: 7200, calories: 288, distance: 5.4, method: "sensor" },
        { date: getOffsetDateString(-1), steps: 9100, calories: 364, distance: 6.8, method: "google" },
        { date: getTodayDateString(), steps: 5400, calories: 216, distance: 4.05, method: "sensor" },
      ];
      setStepsLogs(initialSteps);
      localStorage.setItem("skincare360_steps_logs", JSON.stringify(initialSteps));
    }

    if (storedStepsSync) setStepSyncMethodInternal(storedStepsSync);
  }, []);

  // Helpers to get dates
  function getTodayDateString() {
    const today = new Date();
    return today.toISOString().split("T")[0];
  }

  function getOffsetDateString(offset: number) {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toISOString().split("T")[0];
  }

  // --- WATER ACTIONS ---
  const addWater = (amount: number) => {
    const newLog: WaterLog = {
      id: Math.random().toString(36).substring(7),
      amount,
      timestamp: new Date().toISOString(),
    };
    const updated = [...waterLogs, newLog];
    setWaterLogs(updated);
    localStorage.setItem("skincare360_water_logs", JSON.stringify(updated));
  };

  const setWaterGoal = (goal: number) => {
    setWaterGoalInternal(goal);
    localStorage.setItem("skincare360_water_goal", goal.toString());
  };

  const clearWaterLogs = () => {
    setWaterLogs([]);
    localStorage.setItem("skincare360_water_logs", JSON.stringify([]));
  };

  const todayWater = waterLogs
    .filter((log) => log.timestamp.startsWith(getTodayDateString()))
    .reduce((sum, log) => sum + log.amount, 0);

  // --- SLEEP ACTIONS ---
  const addSleep = (bedtime: string, wakeup: string, method: "manual" | "google" | "apple" = "manual") => {
    // Calculate duration
    const [bedH, bedM] = bedtime.split(":").map(Number);
    const [wakeH, wakeM] = wakeup.split(":").map(Number);

    let duration = 0;
    if (wakeH > bedH || (wakeH === bedH && wakeM >= bedM)) {
      duration = (wakeH * 60 + wakeM - (bedH * 60 + bedM)) / 60;
    } else {
      // Overnight
      duration = (24 * 60 - (bedH * 60 + bedM) + (wakeH * 60 + wakeM)) / 60;
    }
    duration = Math.round(duration * 10) / 10;

    // Calculate dynamic Sleep Score
    // Ideal: 7.5 - 8.5 hours. Deduct points for too short or too long.
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

    // Filter out existing log for today to replace it
    const updated = sleepLogs.filter((log) => log.date !== getTodayDateString()).concat(newLog);
    setSleepLogs(updated);
    localStorage.setItem("skincare360_sleep_logs", JSON.stringify(updated));
  };

  const setSleepSyncMethod = (method: "manual" | "google" | "apple") => {
    setSleepSyncMethodInternal(method);
    localStorage.setItem("skincare360_sleep_sync", method);

    if (method === "google" || method === "apple") {
      // Simulate sync retrieve
      setTimeout(() => {
        addSleep("22:45", "07:00", method);
      }, 1000);
    }
  };

  const todaySleep = sleepLogs.find((log) => log.date === getTodayDateString()) || null;

  // --- STEPS ACTIONS ---
  const addSteps = (steps: number, method: string = "sensor") => {
    const todayStr = getTodayDateString();
    const calories = Math.round(steps * 0.04); // ~0.04 kcal per step
    const distance = Math.round((steps * 0.00075) * 100) / 100; // ~0.75m per step

    const newLog: StepsLog = {
      date: todayStr,
      steps,
      calories,
      distance,
      method,
    };

    const updated = stepsLogs.filter((log) => log.date !== todayStr).concat(newLog);
    setStepsLogs(updated);
    localStorage.setItem("skincare360_steps_logs", JSON.stringify(updated));
  };

  const setStepsGoal = (goal: number) => {
    setStepsGoalInternal(goal);
    localStorage.setItem("skincare360_steps_goal", goal.toString());
  };

  const setStepSyncMethod = (method: string) => {
    setStepSyncMethodInternal(method);
    localStorage.setItem("skincare360_steps_sync", method);

    if (method !== "sensor" && method !== "manual") {
      // Simulate sync retrieve
      setTimeout(() => {
        addSteps(10420, method);
      }, 1000);
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
  const [aiRecommendations, setAiRecommendations] = useState<string[]>([]);

  useEffect(() => {
    const recs: string[] = [];
    const waterLitre = todayWater / 1000;
    const sleepHrs = todaySleep?.duration || 6.4; // fallback to default
    const stepsCount = todaySteps.steps;

    // 1. Water analysis
    if (waterLitre < 2) {
      recs.push(`You drank only ${waterLitre.toFixed(1)} litres of water. Hydration is crucial for skin barrier healing.`);
    }

    // 2. Sleep analysis
    if (sleepHrs < 7) {
      recs.push(`You slept only ${sleepHrs} hours. Lack of sleep triggers cortisol, leading to puffiness and breakouts.`);
    }

    // 3. Steps analysis
    if (stepsCount < 6000) {
      recs.push(`You walked only ${stepsCount.toLocaleString()} steps today. Movement boosts circulation, delivering oxygen to skin cells.`);
    }

    // 4. Synergistic recommendation
    if (waterLitre < 2 || sleepHrs < 7 || stepsCount < 6000) {
      const suggestions = [];
      if (waterLitre < 2) suggestions.push("drink at least 3 litres of water");
      if (sleepHrs < 7) suggestions.push("target 7–8 hours of sleep tonight");
      if (stepsCount < 6000) suggestions.push("walk at least 8,000–10,000 steps");

      recs.push(`Action plan: To balance your oily skin today, ${suggestions.join(", and ")}.`);
    } else {
      recs.push("Fantastic work! You met all your health targets today. Your skin renewal is optimal.");
    }

    // 5. Environmental/UV recommendations
    recs.push("UV index is high (8) today. Sunscreen application and reapplication every 3 hours is non-negotiable.");

    setAiRecommendations(recs);
  }, [todayWater, todaySleep, todaySteps]);

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
