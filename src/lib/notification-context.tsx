import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./auth-context";
import { scheduleLocalNotification } from "./push-notifications";
import { API_BASE_URL } from "./config";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  read: boolean;
  timestamp: string;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
}

interface NotificationContextType {
  notifications: AppNotification[];
  preferences: NotificationPreferences;
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>;
  sendTestNotification: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>({ email: true, push: true, inApp: true });

  const apiUrlBase = `${API_BASE_URL}/notifications/${user?.uid}`;

  const fetchNotifications = async () => {
    if (!user?.uid) return;
    try {
      const res = await fetch(apiUrlBase);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setNotifications(data.notifications || []);
          if (data.preferences) setPreferences(data.preferences);
        }
      }
    } catch (e) {
      console.error("Failed to fetch notifications", e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [user?.uid, apiUrlBase]);

  const markAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    if (!user?.uid) return;
    try {
      await fetch(`${apiUrlBase}/${id}/read`, { method: "PUT" });
    } catch (e) {
      console.error("Failed to mark as read", e);
    }
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    if (!user?.uid) return;
    try {
      await fetch(`${apiUrlBase}/read-all`, { method: "PUT" });
    } catch (e) {
      console.error("Failed to mark all as read", e);
    }
  };

  const deleteNotification = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (!user?.uid) return;
    try {
      await fetch(`${apiUrlBase}/${id}`, { method: "DELETE" });
    } catch (e) {
      console.error("Failed to delete notification", e);
    }
  };

  const updatePreferences = async (newPrefs: Partial<NotificationPreferences>) => {
    const updated = { ...preferences, ...newPrefs };
    setPreferences(updated);
    if (!user?.uid) return;
    try {
      await fetch(`${apiUrlBase}/preferences`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPrefs),
      });
    } catch (e) {
      console.error("Failed to update preferences", e);
    }
  };

  const sendTestNotification = async () => {
    if (!user?.uid) return;
    
    const payload = {
      title: "Test Notification",
      message: "This is a test notification generated from the UI.",
      type: "info",
    };

    try {
      await fetch(`${apiUrlBase}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      // Fetch immediately to show it
      fetchNotifications();
      
      if (preferences.push) {
        scheduleLocalNotification(payload.title, { body: payload.message });
      }
    } catch (e) {
      console.error("Failed to send test notification", e);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        preferences,
        unreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        updatePreferences,
        sendTestNotification
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};
