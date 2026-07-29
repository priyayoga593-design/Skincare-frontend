import React, { createContext, useContext, useState, useEffect } from "react";
import { useScan } from "./scan-context";
import { toast } from "sonner";
import { registerServiceWorker, scheduleLocalNotification } from "./push-notifications";

export type ReminderType = 
  | "morning" 
  | "afternoon" 
  | "evening" 
  | "night" 
  | "weekly_mask" 
  | "weekly_exfoliation" 
  | "water" 
  | "refill" 
  | "scan";

export interface ReminderSchedule {
  id: string;
  label: string;
  time: string; // "HH:MM" 24h format
  enabled: boolean;
  type: ReminderType;
  frequency: "daily" | "weekly" | "monthly" | "custom";
  days?: number[]; // 0-6 for days of week
}

export interface ReminderHistoryItem {
  id: string;
  reminderId: string;
  type: ReminderType;
  label: string;
  completedAt: string; // ISO string
  status: "completed" | "snoozed" | "missed";
}

interface ReminderContextType {
  reminders: ReminderSchedule[];
  updateReminder: (id: string, updates: Partial<ReminderSchedule>) => void;
  masterEnabled: boolean;
  setMasterEnabled: (enabled: boolean) => void;
  requestPermission: () => Promise<boolean>;
  history: ReminderHistoryItem[];
  markCompleted: (reminderId: string) => void;
  snoozeReminder: (reminderId: string, minutes: number) => void;
}

const defaultReminders: ReminderSchedule[] = [
  { id: "morning", label: "Morning Routine", time: "08:00", enabled: true, type: "morning", frequency: "daily" },
  { id: "afternoon", label: "Afternoon SPF Reapplication", time: "14:00", enabled: true, type: "afternoon", frequency: "daily" },
  { id: "evening", label: "Evening Routine", time: "18:00", enabled: false, type: "evening", frequency: "daily" },
  { id: "night", label: "Night Routine", time: "22:00", enabled: true, type: "night", frequency: "daily" },
  { id: "weekly_mask", label: "Weekly Face Mask", time: "20:00", enabled: false, type: "weekly_mask", frequency: "weekly", days: [0] }, // Sunday
  { id: "weekly_exf", label: "Weekly Exfoliation", time: "20:00", enabled: false, type: "weekly_exfoliation", frequency: "weekly", days: [3] }, // Wednesday
  { id: "water", label: "Water Intake", time: "10:00", enabled: true, type: "water", frequency: "daily" },
  { id: "refill", label: "Product Refill", time: "09:00", enabled: false, type: "refill", frequency: "monthly" },
  { id: "scan", label: "Follow-up Scan", time: "09:00", enabled: true, type: "scan", frequency: "monthly" },
];

const ReminderContext = createContext<ReminderContextType | undefined>(undefined);

export const ReminderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [reminders, setReminders] = useState<ReminderSchedule[]>(defaultReminders);
  const [masterEnabled, setMasterEnabled] = useState(false);
  const [lastFired, setLastFired] = useState<Record<string, string>>({}); // id -> "YYYY-MM-DDTHH:mm"
  const [history, setHistory] = useState<ReminderHistoryItem[]>([]);
  const { currentScan } = useScan();

  useEffect(() => {
    // Register SW on load
    registerServiceWorker();

    const saved = localStorage.getItem("skincare360_reminders");
    const master = localStorage.getItem("skincare360_reminders_master");
    const fired = localStorage.getItem("skincare360_reminders_fired");
    const hist = localStorage.getItem("skincare360_reminders_history");
    
    if (saved) {
      try { setReminders(JSON.parse(saved)); } catch (e) {}
    }
    if (master) setMasterEnabled(master === "true");
    if (fired) {
      try { setLastFired(JSON.parse(fired)); } catch (e) {}
    }
    if (hist) {
      try { setHistory(JSON.parse(hist)); } catch (e) {}
    }
  }, []);

  const updateReminder = (id: string, updates: Partial<ReminderSchedule>) => {
    setReminders((prev) => {
      const updated = prev.map((r) => (r.id === id ? { ...r, ...updates } : r));
      localStorage.setItem("skincare360_reminders", JSON.stringify(updated));
      return updated;
    });
  };

  const setMasterEnabledWrapped = async (enabled: boolean) => {
    setMasterEnabled(enabled);
    localStorage.setItem("skincare360_reminders_master", enabled ? "true" : "false");
    if (enabled) {
      await requestPermission();
    }
  };

  const requestPermission = async () => {
    if (!("Notification" in window)) {
      toast.error("This browser does not support desktop notifications.");
      return false;
    }
    if (Notification.permission === "granted") return true;
    
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      toast.success("Notifications enabled!");
      return true;
    } else {
      toast.error("Notification permission denied.");
      return false;
    }
  };

  const getPersonalizedMessage = (type: ReminderType, skinType?: string): string => {
    switch (type) {
      case "morning":
        if (skinType === "Dry") return "💧 Good Morning! Time for your hydrating skincare routine.";
        if (skinType === "Oily") return "✨ Good Morning! Cleanse excess oil and start your day fresh.";
        if (skinType === "Sensitive") return "🌸 Good Morning! Time for your gentle, calming routine.";
        return "☀️ Good Morning! Time for your skincare routine.";
      case "afternoon":
        return "☀️ SPF Reminder: Reapply your sunscreen to stay protected.";
      case "evening":
        return "🌇 Time to refresh your skin and wash away the day.";
      case "night":
        if (skinType === "Acne-Prone") return "🌿 Time for your night routine. Apply your spot treatments!";
        if (skinType === "Dry") return "💧 Your skin needs nighttime hydration. Don't forget your rich moisturizer!";
        return "🌙 Time for your night skincare routine.";
      case "weekly_mask":
        return "🎭 Your skin deserves extra care—apply your face mask today.";
      case "weekly_exfoliation":
        return "✨ Weekly reminder: Today is your exfoliation day.";
      case "water":
        return "💧 Stay hydrated! Drink a glass of water for healthier skin.";
      case "refill":
        return "🧴 You might be running low on some products. Check your cabinet!";
      case "scan":
        return "📸 It's time for your AI skin scan to track your progress.";
      default:
        return "Reminder!";
    }
  };

  const markCompleted = (reminderId: string) => {
    const reminder = reminders.find((r) => r.id === reminderId);
    if (!reminder) return;
    
    const newItem: ReminderHistoryItem = {
      id: Math.random().toString(36).substring(7),
      reminderId,
      type: reminder.type,
      label: reminder.label,
      completedAt: new Date().toISOString(),
      status: "completed"
    };

    setHistory((prev) => {
      const updated = [newItem, ...prev].slice(0, 50); // keep last 50
      localStorage.setItem("skincare360_reminders_history", JSON.stringify(updated));
      return updated;
    });
    toast.success(`${reminder.label} marked as completed!`);
  };

  const snoozeReminder = (reminderId: string, minutes: number) => {
    const reminder = reminders.find((r) => r.id === reminderId);
    if (!reminder) return;

    // We implement snooze by adjusting the lastFired state to a past date 
    // so it doesn't refire immediately, and setting a timeout to fire again.
    // A robust backend would just reschedule the job.
    toast.info(`${reminder.label} snoozed for ${minutes} minutes.`);
    
    setTimeout(() => {
      triggerNotification(reminder);
    }, minutes * 60 * 1000);
  };

  const triggerNotification = (reminder: ReminderSchedule) => {
    const message = getPersonalizedMessage(reminder.type, currentScan?.skinType);
    
    // Attempt SW notification first for action buttons
    if ("Notification" in window && Notification.permission === "granted") {
      scheduleLocalNotification("360° Skincare", {
        body: message,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        data: { reminderId: reminder.id },
        actions: [
          { action: "snooze_10", title: "Snooze 10m" },
          { action: "snooze_30", title: "Snooze 30m" },
          { action: "complete", title: "Completed" }
        ],
        tag: `skincare-${reminder.id}`,
      });
    } else {
      toast(message, { icon: "🔔", duration: 8000 });
    }
  };

  // Notification Engine & Message Listener
  useEffect(() => {
    if (!masterEnabled) return;

    const interval = setInterval(() => {
      const now = new Date();
      const currentHour = now.getHours().toString().padStart(2, "0");
      const currentMinute = now.getMinutes().toString().padStart(2, "0");
      const currentTime = `${currentHour}:${currentMinute}`;
      const currentDay = now.getDay();
      const dateString = now.toISOString().split("T")[0]; // YYYY-MM-DD

      reminders.forEach((reminder) => {
        if (!reminder.enabled) return;
        
        // Frequency checks
        if (reminder.frequency === "weekly" && reminder.days && !reminder.days.includes(currentDay)) return;
        if (reminder.frequency === "monthly" && now.getDate() !== 1) return; // Simple monthly mock (1st of month)

        if (reminder.time === currentTime) {
          // Check if already fired today
          if (!lastFired[reminder.id] || !lastFired[reminder.id].startsWith(dateString)) {
            triggerNotification(reminder);

            // Update fired state
            const newFired = { ...lastFired, [reminder.id]: now.toISOString() };
            setLastFired(newFired);
            localStorage.setItem("skincare360_reminders_fired", JSON.stringify(newFired));
          }
        }
      });
    }, 30000); // check every 30 seconds

    return () => clearInterval(interval);
  }, [masterEnabled, reminders, lastFired, currentScan]);

  // Listen to Service Worker messages (e.g. action button clicks)
  useEffect(() => {
    const handleSWMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "NOTIFICATION_ACTION") {
        const { action, reminderId } = event.data;
        if (!reminderId) return;

        if (action === "complete") {
          markCompleted(reminderId);
        } else if (action === "snooze_10") {
          snoozeReminder(reminderId, 10);
        } else if (action === "snooze_30") {
          snoozeReminder(reminderId, 30);
        }
      }
    };
    
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", handleSWMessage);
    }
    
    return () => {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener("message", handleSWMessage);
      }
    };
  }, [reminders]);

  return (
    <ReminderContext.Provider value={{ 
      reminders, 
      updateReminder, 
      masterEnabled, 
      setMasterEnabled: setMasterEnabledWrapped, 
      requestPermission,
      history,
      markCompleted,
      snoozeReminder
    }}>
      {children}
    </ReminderContext.Provider>
  );
};

export const useReminders = () => {
  const context = useContext(ReminderContext);
  if (!context) throw new Error("useReminders must be used within a ReminderProvider");
  return context;
};
