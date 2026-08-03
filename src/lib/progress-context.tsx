import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { db } from "@/firebase/firebase";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { useAuth } from "./auth-context";
import { useScan } from "./scan-context";
import { useHealth } from "./health-context";
import { useNutrition } from "./nutrition-context";
import { toast } from "sonner";
import { API_BASE_URL } from "./config";
import { useProducts } from "./products-context";

export interface ProgressReport {
  overallProgress: string;
  improvementRate: string;
  adherenceScore: number;
  keyInsights: string[];
  actionableSteps: string[];
  generatedAt: string;
  timeframe: string;
}

interface ProgressContextType {
  reports: Record<string, ProgressReport>;
  isLoading: boolean;
  isGenerating: boolean;
  generateReport: (timeframe: "daily" | "weekly" | "monthly") => Promise<void>;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);


export function ProgressProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { scanHistory } = useScan();
  const { waterLogs, sleepLogs, stepsLogs, todayWater, todaySleep, todaySteps } = useHealth();
  const { dailyLogs } = useNutrition();
  const { recommendedProducts } = useProducts();

  const [reports, setReports] = useState<Record<string, ProgressReport>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!user?.uid) {
      setReports({});
      setIsLoading(false);
      return;
    }

    const docRef = doc(db, "users", user.uid, "reports", "latest");
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        setReports(snapshot.data() as Record<string, ProgressReport>);
      } else {
        setReports({});
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const generateReport = async (timeframe: "daily" | "weekly" | "monthly") => {
    if (!user?.uid) return;
    setIsGenerating(true);
    toast.info(`Generating ${timeframe} report...`);

    try {
      const apiUrl = `${API_BASE_URL}/generate-report`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timeframe,
          profile: user.profile,
          scans: scanHistory.slice(0, 10), // Limit payload size
          nutrition: dailyLogs.slice(0, 7), // Limit payload size
          products: recommendedProducts,
          health: {
            waterLogs,
            sleepLogs,
            stepsLogs,
            today: { todayWater, todaySleep, todaySteps }
          },
        }),
      });

      const data = await response.json();
      
      if (data.success && data.report) {
        const docRef = doc(db, "users", user.uid, "reports", "latest");
        
        const newReport = {
          ...data.report,
          generatedAt: new Date().toISOString(),
          timeframe,
        };

        await setDoc(docRef, { [timeframe]: newReport }, { merge: true });
        toast.success(`AI generated new ${timeframe} report!`);
      } else {
        toast.error("Failed to generate report");
      }
    } catch (error) {
      console.error("[Progress] Error generating report:", error);
      toast.error("An error occurred while generating the report.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <ProgressContext.Provider
      value={{
        reports,
        isLoading,
        isGenerating,
        generateReport,
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const context = useContext(ProgressContext);
  if (context === undefined) {
    throw new Error("useProgress must be used within a ProgressProvider");
  }
  return context;
}
