import React, { createContext, useContext, useState, useEffect } from "react";
import { profile as defaultProfile } from "./mock-data";

export interface UserProfile {
  name: string;
  age: number;
  gender: string;
  goals: string[];
  allergies: string[];
  lastScan: string;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  inApp: boolean;
  reminderTimes: {
    morningRoutine: string;
    nightRoutine: string;
    faceScan: string;
    water: string;
    sleep: string;
  };
  frequencies: {
    routine: "daily" | "weekly";
    scan: "daily" | "weekly";
    water: "hourly" | "daily";
    sleep: "daily";
    report: "weekly" | "monthly";
  };
}

export interface DeviceInfo {
  userAgent: string;
  platform: string;
  language: string;
  screenResolution: string;
  timezone: string;
}

export interface User {
  uid: string;
  email: string;
  profile: UserProfile;
  profilePicture?: string;
  registrationDate: string;
  lastLogin: string;
  loginMethod: "email" | "google" | "apple";
  deviceInfo?: DeviceInfo;
  notifications: NotificationSettings;
}

// Error codes for type-safe error handling
export type AuthErrorCode =
  | "EMPTY_EMAIL"
  | "EMPTY_PASSWORD"
  | "INVALID_EMAIL_FORMAT"
  | "WRONG_PASSWORD"
  | "USER_NOT_FOUND"
  | "ACCOUNT_EXISTS"
  | "PASSWORDS_DONT_MATCH"
  | "WEAK_PASSWORD"
  | "NAME_REQUIRED"
  | "RESET_EMAIL_NOT_FOUND"
  | "UNKNOWN";

export class AuthError extends Error {
  constructor(public code: AuthErrorCode, message: string) {
    super(message);
    this.name = "AuthError";
  }
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (
    email: string,
    password: string,
    confirmPassword: string,
    name: string,
    age: number,
    gender: string,
    goals: string[],
    allergies: string[]
  ) => Promise<boolean>;
  googleLogin: (email: string, name: string, pictureUrl: string) => Promise<boolean>;
  appleLogin: (email: string, name: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  updateNotifications: (notifications: Partial<NotificationSettings>) => void;
  forgotPassword: (email: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  email: true,
  push: true,
  inApp: true,
  reminderTimes: {
    morningRoutine: "08:00",
    nightRoutine: "22:00",
    faceScan: "21:00",
    water: "12:00",
    sleep: "23:00",
  },
  frequencies: {
    routine: "daily",
    scan: "daily",
    water: "daily",
    sleep: "daily",
    report: "weekly",
  },
};

// Password validation: ≥8 chars, uppercase, lowercase, number, special char
export function validatePassword(password: string): { valid: boolean; message: string } {
  if (password.length < 8) return { valid: false, message: "Password must be at least 8 characters." };
  if (!/[A-Z]/.test(password)) return { valid: false, message: "Password must include at least one uppercase letter." };
  if (!/[a-z]/.test(password)) return { valid: false, message: "Password must include at least one lowercase letter." };
  if (!/[0-9]/.test(password)) return { valid: false, message: "Password must include at least one number." };
  if (!/[^A-Za-z0-9]/.test(password)) return { valid: false, message: "Password must include at least one special character." };
  return { valid: true, message: "" };
}

// Email format validation
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Password strength score 0-4
export function getPasswordStrength(password: string): number {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

function getDeviceInfo(): DeviceInfo {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const sessionToken = localStorage.getItem("skincare360_session_token");
    const storedUser = localStorage.getItem("skincare360_user");

    if (sessionToken && storedUser) {
      try {
        const parsed: User = JSON.parse(storedUser);
        const expectedToken = btoa(parsed.uid + ":" + parsed.email);
        if (sessionToken === expectedToken) {
          // Update last login on session restore
          const updatedUser = { ...parsed, lastLogin: new Date().toLocaleString(), deviceInfo: getDeviceInfo() };
          setUser(updatedUser);
          localStorage.setItem("skincare360_user", JSON.stringify(updatedUser));
        } else {
          clearSession();
        }
      } catch {
        clearSession();
      }
    }
    setIsLoading(false);

    // Seed demo user if db is empty
    if (!localStorage.getItem("firestore_users")) {
      const demoUser = {
        uid: "demo-aanya-sharma",
        email: "user@example.com",
        passwordHash: btoa("Password1!"),
        profile: {
          name: defaultProfile.name,
          age: defaultProfile.age,
          gender: defaultProfile.gender,
          goals: defaultProfile.goals,
          allergies: defaultProfile.allergies,
          lastScan: defaultProfile.lastScan,
        },
        profilePicture:
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200&h=200",
        registrationDate: new Date().toLocaleDateString(),
        lastLogin: new Date().toLocaleString(),
        loginMethod: "email",
        notifications: DEFAULT_NOTIFICATIONS,
      };
      localStorage.setItem("firestore_users", JSON.stringify([demoUser]));
    }
  }, []);

  const getUsersFromDb = (): any[] => {
    const raw = localStorage.getItem("firestore_users");
    return raw ? JSON.parse(raw) : [];
  };

  const saveUsersToDb = (users: any[]) => {
    localStorage.setItem("firestore_users", JSON.stringify(users));
  };

  const clearSession = () => {
    localStorage.removeItem("skincare360_user");
    localStorage.removeItem("skincare360_session_token");
  };

  const persistSession = (u: User) => {
    const sessionToken = btoa(u.uid + ":" + u.email);
    localStorage.setItem("skincare360_session_token", sessionToken);
    localStorage.setItem("skincare360_user", JSON.stringify(u));
    setUser(u);
  };

  // ── LOGIN ────────────────────────────────────────────────────────────────
  const login = async (email: string, password: string): Promise<boolean> => {
    // Field-level validation (exact error messages per spec)
    if (!email.trim()) throw new AuthError("EMPTY_EMAIL", "Please enter your email.");
    if (!password) throw new AuthError("EMPTY_PASSWORD", "Please enter your password.");
    if (!validateEmail(email)) throw new AuthError("INVALID_EMAIL_FORMAT", "Please enter a valid email address.");

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const users = getUsersFromDb();
        const found = users.find((u: any) => u.email.toLowerCase() === email.trim().toLowerCase());

        if (!found) {
          reject(new AuthError("USER_NOT_FOUND", "Incorrect Credentials"));
          return;
        }

        if (found.passwordHash !== btoa(password)) {
          reject(new AuthError("WRONG_PASSWORD", "Incorrect Password"));
          return;
        }

        const loggedUser: User = {
          ...found,
          lastLogin: new Date().toLocaleString(),
          loginMethod: "email",
          deviceInfo: getDeviceInfo(),
        };

        // Update DB record
        const idx = users.findIndex((u: any) => u.uid === found.uid);
        users[idx] = { ...found, lastLogin: loggedUser.lastLogin };
        saveUsersToDb(users);

        persistSession(loggedUser);
        resolve(true);
      }, 500);
    });
  };

  // ── SIGNUP ───────────────────────────────────────────────────────────────
  const signup = async (
    email: string,
    password: string,
    confirmPassword: string,
    name: string,
    age: number,
    gender: string,
    goals: string[],
    allergies: string[]
  ): Promise<boolean> => {
    // Sequential field validations (per spec)
    if (!name.trim()) throw new AuthError("NAME_REQUIRED", "Please enter your name.");
    if (!email.trim()) throw new AuthError("EMPTY_EMAIL", "Please enter your email.");
    if (!validateEmail(email)) throw new AuthError("INVALID_EMAIL_FORMAT", "Please enter a valid email address.");
    if (!password) throw new AuthError("EMPTY_PASSWORD", "Please enter your password.");

    const pwdCheck = validatePassword(password);
    if (!pwdCheck.valid) throw new AuthError("WEAK_PASSWORD", pwdCheck.message);

    if (password !== confirmPassword) throw new AuthError("PASSWORDS_DONT_MATCH", "Passwords do not match.");

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const users = getUsersFromDb();
        const exists = users.some((u: any) => u.email.toLowerCase() === email.trim().toLowerCase());

        if (exists) {
          reject(new AuthError("ACCOUNT_EXISTS", "Account already exists."));
          return;
        }

        const newUser: User = {
          uid: "usr_" + Math.random().toString(36).substring(2, 11),
          email: email.trim().toLowerCase(),
          profile: {
            name: name.trim(),
            age,
            gender,
            goals,
            allergies,
            lastScan: "No scans yet",
          },
          profilePicture: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`,
          registrationDate: new Date().toLocaleDateString(),
          lastLogin: new Date().toLocaleString(),
          loginMethod: "email",
          deviceInfo: getDeviceInfo(),
          notifications: DEFAULT_NOTIFICATIONS,
        };

        const dbRecord = { ...newUser, passwordHash: btoa(password) };
        users.push(dbRecord);
        saveUsersToDb(users);
        persistSession(newUser);
        resolve(true);
      }, 500);
    });
  };

  // ── GOOGLE LOGIN ─────────────────────────────────────────────────────────
  const googleLogin = async (email: string, name: string, pictureUrl: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const users = getUsersFromDb();
        let found = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());

        if (!found) {
          const newUser: User = {
            uid: "google_" + Math.random().toString(36).substring(2, 11),
            email: email.toLowerCase(),
            profile: {
              name,
              age: 26,
              gender: "Female",
              goals: ["Hydration"],
              allergies: [],
              lastScan: "No scans yet",
            },
            profilePicture: pictureUrl,
            registrationDate: new Date().toLocaleDateString(),
            lastLogin: new Date().toLocaleString(),
            loginMethod: "google",
            deviceInfo: getDeviceInfo(),
            notifications: DEFAULT_NOTIFICATIONS,
          };
          found = { ...newUser, passwordHash: btoa("google-oauth") };
          users.push(found);
          saveUsersToDb(users);
          persistSession(newUser);
        } else {
          const loggedUser: User = {
            ...found,
            lastLogin: new Date().toLocaleString(),
            loginMethod: "google",
            deviceInfo: getDeviceInfo(),
          };
          const idx = users.findIndex((u: any) => u.uid === found.uid);
          users[idx] = { ...found, lastLogin: loggedUser.lastLogin };
          saveUsersToDb(users);
          persistSession(loggedUser);
        }
        resolve(true);
      }, 500);
    });
  };

  // ── APPLE LOGIN ──────────────────────────────────────────────────────────
  const appleLogin = async (email: string, name: string): Promise<boolean> => {
    return googleLogin(
      email,
      name,
      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`
    );
  };

  // ── LOGOUT ───────────────────────────────────────────────────────────────
  const logout = () => {
    setUser(null);
    clearSession();
  };

  // ── FORGOT PASSWORD ──────────────────────────────────────────────────────
  const forgotPassword = async (email: string): Promise<boolean> => {
    if (!email.trim()) throw new AuthError("EMPTY_EMAIL", "Please enter your email.");
    if (!validateEmail(email)) throw new AuthError("INVALID_EMAIL_FORMAT", "Please enter a valid email address.");

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const users = getUsersFromDb();
        const found = users.find((u: any) => u.email.toLowerCase() === email.trim().toLowerCase());

        if (!found) {
          reject(new AuthError("RESET_EMAIL_NOT_FOUND", "No account found with this email."));
          return;
        }
        resolve(true); // In production: trigger Firebase sendPasswordResetEmail
      }, 800);
    });
  };

  // ── UPDATE PROFILE ───────────────────────────────────────────────────────
  const updateProfile = (updatedProfile: Partial<UserProfile>) => {
    if (!user) return;
    const updatedUser = { ...user, profile: { ...user.profile, ...updatedProfile } };
    setUser(updatedUser);
    localStorage.setItem("skincare360_user", JSON.stringify(updatedUser));
    const users = getUsersFromDb();
    const idx = users.findIndex((u: any) => u.uid === user.uid);
    if (idx !== -1) { users[idx] = { ...users[idx], ...updatedUser }; saveUsersToDb(users); }
  };

  // ── UPDATE NOTIFICATIONS ─────────────────────────────────────────────────
  const updateNotifications = (updatedNotifications: Partial<NotificationSettings>) => {
    if (!user) return;
    const updatedUser = { ...user, notifications: { ...user.notifications, ...updatedNotifications } };
    setUser(updatedUser);
    localStorage.setItem("skincare360_user", JSON.stringify(updatedUser));
    const users = getUsersFromDb();
    const idx = users.findIndex((u: any) => u.uid === user.uid);
    if (idx !== -1) { users[idx] = { ...users[idx], ...updatedUser }; saveUsersToDb(users); }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        googleLogin,
        appleLogin,
        logout,
        updateProfile,
        updateNotifications,
        forgotPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
