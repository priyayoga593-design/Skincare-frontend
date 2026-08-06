import React, { createContext, useContext, useState, useEffect } from "react";
import { profile as defaultProfile } from "./mock-data";

// Firebase imports
import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, sendPasswordResetEmail, signOut, onAuthStateChanged } from "../firebase/firebase";
import { db } from "../firebase/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { API_BASE_URL } from "./config";

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

export type AuthErrorCode =
  | "EMPTY_EMAIL"
  | "EMPTY_PASSWORD"
  | "INVALID_EMAIL_FORMAT"
  | "WRONG_PASSWORD"
  | "USER_NOT_FOUND"
  | "INVALID_CREDENTIALS"
  | "SERVER_UNAVAILABLE"
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
  updateProfile: (profile: Partial<UserProfile>, profilePicture?: string) => Promise<void>;
  updateNotifications: (notifications: Partial<NotificationSettings>) => void;
  forgotPassword: (email: string) => Promise<boolean>;
  updateEmailAddress: (email: string) => Promise<boolean>;
  updatePassword: (password: string) => Promise<boolean>;
  logoutAllDevices: () => Promise<boolean>;
  deleteAccount: () => Promise<boolean>;
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

function getDeviceInfo(): DeviceInfo {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return {
      userAgent: "Server",
      platform: "Server",
      language: "en",
      screenResolution: "1920x1080",
      timezone: "UTC",
    };
  }
  return {
    userAgent: navigator.userAgent || "",
    platform: navigator.platform || "",
    language: navigator.language || "en",
    screenResolution: window.screen ? `${window.screen.width}x${window.screen.height}` : "1920x1080",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  };
}
// Validation helpers
export function validatePassword(password: string): { valid: boolean; message: string } {
  if (password.length < 8) return { valid: false, message: "Password must be at least 8 characters." };
  if (!/[A-Z]/.test(password)) return { valid: false, message: "Password must include at least one uppercase letter." };
  if (!/[a-z]/.test(password)) return { valid: false, message: "Password must include at least one lowercase letter." };
  if (!/[0-9]/.test(password)) return { valid: false, message: "Password must include at least one number." };
  if (!/[^A-Za-z0-9]/.test(password)) return { valid: false, message: "Password must include at least one special character." };
  return { valid: true, message: "" };
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function getPasswordStrength(password: string): number {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;
  if (strength === 0) return 0;
  if (strength <= 2) return 1; // weak
  if (strength === 3) return 2; // fair
  if (strength === 4) return 3; // good
  return 4; // strong
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Listen to Firebase auth state changes – prevents infinite React update loops
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken();
        const stored = localStorage.getItem("skincare360_user");
        const parsed: User = stored
          ? JSON.parse(stored)
          : {
              uid: firebaseUser.uid,
              email: firebaseUser.email ?? "",
              profile: defaultProfile,
              registrationDate: new Date().toLocaleDateString(),
              lastLogin: new Date().toLocaleString(),
              loginMethod: "email",
              notifications: DEFAULT_NOTIFICATIONS,
            };
        const updatedUser: User = {
          ...parsed,
          uid: firebaseUser.uid,
          email: firebaseUser.email ?? parsed.email,
          lastLogin: new Date().toLocaleString(),
          deviceInfo: getDeviceInfo(),
        };
        localStorage.setItem("skincare360_session_token", token);
        localStorage.setItem("skincare360_user", JSON.stringify(updatedUser));
        setUser(updatedUser);
      } else {
        setUser(null);
        localStorage.removeItem("skincare360_user");
        localStorage.removeItem("skincare360_session_token");
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const clearSession = () => {
    localStorage.removeItem("skincare360_user");
    localStorage.removeItem("skincare360_session_token");
  };


  // ---- LOGIN ----
  const login = async (email: string, password: string): Promise<boolean> => {
    if (!email.trim()) throw new AuthError("EMPTY_EMAIL", "Please enter your email.");
    if (!password) throw new AuthError("EMPTY_PASSWORD", "Please enter your password.");
    if (!validateEmail(email)) throw new AuthError("INVALID_EMAIL_FORMAT", "Please enter a valid email address.");
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const firebaseUser = userCredential.user;
      const token = await firebaseUser.getIdToken();
      const loggedUser: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email ?? email.trim(),
        profile: defaultProfile,
        registrationDate: new Date().toLocaleDateString(),
        lastLogin: new Date().toLocaleString(),
        loginMethod: "email",
        deviceInfo: getDeviceInfo(),
        notifications: DEFAULT_NOTIFICATIONS,
      };
      await setDoc(doc(db, "users", loggedUser.uid), loggedUser, { merge: true });
      localStorage.setItem("skincare360_session_token", token);
      localStorage.setItem("skincare360_user", JSON.stringify(loggedUser));
      setUser(loggedUser);
      return true;
    } catch (err: any) {
      // Try Backend API Login as fallback (supports demo accounts user@example.com / Password1!)
      try {
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), password }),
        });
        const data = await res.json();
        if (data.success && data.user) {
          const loggedUser: User = {
            uid: data.user.uid,
            email: data.user.email,
            profile: data.user.profile || defaultProfile,
            profilePicture: data.user.profilePicture,
            registrationDate: data.user.registrationDate || new Date().toLocaleDateString(),
            lastLogin: new Date().toLocaleString(),
            loginMethod: "email",
            deviceInfo: getDeviceInfo(),
            notifications: DEFAULT_NOTIFICATIONS,
          };
          localStorage.setItem("skincare360_session_token", data.token || "demo_token");
          localStorage.setItem("skincare360_user", JSON.stringify(loggedUser));
          setUser(loggedUser);
          return true;
        }
      } catch (backendErr) {
        console.error("Backend login fallback error:", backendErr);
      }

      const code = err.code;
      if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential") {
        throw new AuthError("INVALID_CREDENTIALS", "Invalid email or password");
      }
      throw new AuthError("SERVER_UNAVAILABLE", "Server unavailable. Please try again later.");
    }
  };

  // ---- SIGNUP ----
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
    if (!name.trim()) throw new AuthError("NAME_REQUIRED", "Please enter your name.");
    if (!email.trim()) throw new AuthError("EMPTY_EMAIL", "Please enter your email.");
    if (!validateEmail(email)) throw new AuthError("INVALID_EMAIL_FORMAT", "Please enter a valid email address.");
    if (!password) throw new AuthError("EMPTY_PASSWORD", "Please enter your password.");
    const pwdCheck = validatePassword(password);
    if (!pwdCheck.valid) throw new AuthError("WEAK_PASSWORD", pwdCheck.message);
    if (password !== confirmPassword) throw new AuthError("PASSWORDS_DONT_MATCH", "Passwords do not match.");
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const firebaseUser = userCredential.user;
      const token = await firebaseUser.getIdToken();
      const newUser: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email ?? email.trim(),
        profile: { name, age, gender, goals, allergies, lastScan: "Just now" },
        profilePicture: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`,
        registrationDate: new Date().toLocaleDateString(),
        lastLogin: new Date().toLocaleString(),
        loginMethod: "email",
        deviceInfo: getDeviceInfo(),
        notifications: DEFAULT_NOTIFICATIONS,
      };
      await setDoc(doc(db, "users", newUser.uid), newUser, { merge: true });
      localStorage.setItem("skincare360_session_token", token);
      localStorage.setItem("skincare360_user", JSON.stringify(newUser));
      setUser(newUser);
      return true;
    } catch (err: any) {
      const code = err.code;
      if (code === "auth/email-already-in-use") {
        throw new AuthError("ACCOUNT_EXISTS", "Account with this email already exists.");
      }
      throw new AuthError("SERVER_UNAVAILABLE", "Server unavailable. Please try again later.");
    }
  };

  // ---- GOOGLE LOGIN ----
  const googleLogin = async (email: string, name: string, pictureUrl: string): Promise<boolean> => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;
      const token = await firebaseUser.getIdToken();
      const loggedUser: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email ?? email,
        profile: { name, age: 26, gender: "Female", goals: ["Hydration"], allergies: [], lastScan: "No scans yet" },
        profilePicture: pictureUrl,
        registrationDate: new Date().toLocaleDateString(),
        lastLogin: new Date().toLocaleString(),
        loginMethod: "google",
        deviceInfo: getDeviceInfo(),
        notifications: DEFAULT_NOTIFICATIONS,
      };
      await setDoc(doc(db, "users", loggedUser.uid), loggedUser, { merge: true });
      localStorage.setItem("skincare360_session_token", token);
      localStorage.setItem("skincare360_user", JSON.stringify(loggedUser));
      setUser(loggedUser);
      return true;
    } catch (err) {
      throw new AuthError("SERVER_UNAVAILABLE", "Google sign‑in failed.");
    }
  };

  // ---- APPLE LOGIN (placeholder) ----
  const appleLogin = async (email: string, name: string): Promise<boolean> => {
    // Placeholder – use Google flow for demo purposes
    return googleLogin(email, name, `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`);
  };

  // ---- LOGOUT ----
  const logout = () => {
    signOut(auth)
      .then(() => {
        setUser(null);
        clearSession();
      })
      .catch(() => {
        setUser(null);
        clearSession();
      });
  };

  // ---- FORGOT PASSWORD ----
  const forgotPassword = async (email: string): Promise<boolean> => {
    if (!email.trim()) throw new AuthError("EMPTY_EMAIL", "Please enter your email.");
    if (!validateEmail(email)) throw new AuthError("INVALID_EMAIL_FORMAT", "Please enter a valid email address.");
    try {
      await sendPasswordResetEmail(auth, email.trim());
      return true;
    } catch (err) {
      throw new AuthError("SERVER_UNAVAILABLE", "Failed to send password reset email.");
    }
  };

  // ---- UPDATE PROFILE ----
  const updateProfile = async (updatedProfile: Partial<UserProfile>, profilePicture?: string) => {
    if (!user) return;
    
    // Optimistic UI Update
    const updatedUser = { 
      ...user, 
      profile: { ...user.profile, ...updatedProfile },
      ...(profilePicture && { profilePicture }) 
    };
    setUser(updatedUser);
    localStorage.setItem("skincare360_user", JSON.stringify(updatedUser));

    // Backend update
    const apiUrlBase = `${API_BASE_URL}/profile/${user.uid}`;
    
    try {
      await fetch(apiUrlBase, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: updatedProfile, profilePicture }),
      });
    } catch (e) {
      console.error("Failed to update profile to backend", e);
    }
  };

  // ---- UPDATE NOTIFICATIONS ----
  const updateNotifications = (updatedNotifications: Partial<NotificationSettings>) => {
    if (!user) return;
    const updatedUser = { ...user, notifications: { ...user.notifications, ...updatedNotifications } };
    setUser(updatedUser);
    localStorage.setItem("skincare360_user", JSON.stringify(updatedUser));
  };

  // ---- ACCOUNT SECURITY ----
  const getApiUrl = (path: string) => {
    return `${API_BASE_URL}/${path}`;
  };

  const updateEmailAddress = async (email: string): Promise<boolean> => {
    if (!user) return false;
    try {
      await fetch(getApiUrl(`account/${user.uid}/email`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setUser({ ...user, email });
      return true;
    } catch (e) {
      console.error("Failed to update email", e);
      return false;
    }
  };

  const updatePassword = async (password: string): Promise<boolean> => {
    if (!user) return false;
    try {
      await fetch(getApiUrl(`account/${user.uid}/password`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      return true;
    } catch (e) {
      console.error("Failed to update password", e);
      return false;
    }
  };

  const logoutAllDevices = async (): Promise<boolean> => {
    if (!user) return false;
    try {
      await fetch(getApiUrl(`account/${user.uid}/logout-all`), { method: "POST" });
      logout();
      return true;
    } catch (e) {
      console.error("Failed to logout all devices", e);
      return false;
    }
  };

  const deleteAccount = async (): Promise<boolean> => {
    if (!user) return false;
    try {
      await fetch(getApiUrl(`account/${user.uid}`), { method: "DELETE" });
      logout();
      return true;
    } catch (e) {
      console.error("Failed to delete account", e);
      return false;
    }
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
        updateEmailAddress,
        updatePassword,
        logoutAllDevices,
        deleteAccount,
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
