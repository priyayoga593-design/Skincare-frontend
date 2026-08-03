import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef } from "react";
import {
  Sparkles,
  Mail,
  Lock,
  User,
  Calendar,
  CheckCircle2,
  RefreshCw,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import { useAuth, validateEmail, validatePassword, getPasswordStrength, AuthError } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign In — 360° Skincare" },
      { name: "description", content: "Log in or create your 360° Skincare account." },
    ],
  }),
  component: AuthPage,
});

type ViewMode = "login" | "signup" | "forgot";

const SKIN_GOALS_OPTIONS = [
  "Clear acne", "Even tone", "Hydration", "Anti-aging", "Reduce redness", "Refine pores",
];

// Only pre-authenticated Google accounts (no free-text input per spec)
const GOOGLE_ACCOUNTS = [
  {
    name: "Aanya Sharma",
    email: "aanya.sharma@gmail.com",
    picture:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200&h=200",
  },
  {
    name: "Priya Yoga",
    email: "priyayoga593@gmail.com",
    picture: "https://api.dicebear.com/7.x/adventurer/svg?seed=Priya",
  },
  {
    name: "Demo User",
    email: "demo.skincare360@gmail.com",
    picture: "https://api.dicebear.com/7.x/adventurer/svg?seed=DemoUser",
  },
];

// Inline error display component
function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1.5 text-xs text-destructive mt-1.5 animate-fadeIn">
      <AlertCircle className="size-3.5 shrink-0" />
      {message}
    </p>
  );
}

// Password strength bar
function PasswordStrengthBar({ password }: { password: string }) {
  if (!password) return null;
  const strength = getPasswordStrength(password);
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = ["", "bg-destructive", "bg-warning", "bg-warning", "bg-success"];
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all ${
              strength >= i ? colors[strength] : "bg-muted"
            }`}
          />
        ))}
      </div>
      {strength > 0 && (
        <p className={`text-2xs font-medium ${strength === 4 ? "text-success" : "text-muted-foreground"}`}>
          {labels[strength]}
        </p>
      )}
    </div>
  );
}

function AuthPage() {
  const navigate = useNavigate();
  const { login, signup, googleLogin, appleLogin, forgotPassword } = useAuth();

  const [mode, setMode] = useState<ViewMode>("login");
  const [loading, setLoading] = useState(false);

  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPwd, setShowLoginPwd] = useState(false);
  const [loginErrors, setLoginErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  // Signup fields
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");
  const [showSignupPwd, setShowSignupPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [signupAge, setSignupAge] = useState(25);
  const [signupGender, setSignupGender] = useState("Female");
  const [signupGoals, setSignupGoals] = useState<string[]>(["Hydration"]);
  const [signupAllergies, setSignupAllergies] = useState("");
  const [signupErrors, setSignupErrors] = useState<Record<string, string>>({});

  // Forgot password
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [resetSent, setResetSent] = useState(false);

  // Google chooser
  const [showGoogleChooser, setShowGoogleChooser] = useState(false);
  const [oauthStep, setOauthStep] = useState<"chooser" | "verifying" | "done">("chooser");
  const [selectedAcc, setSelectedAcc] = useState<typeof GOOGLE_ACCOUNTS[0] | null>(null);

  // ── GOAL TOGGLE ───────────────────────────────────────────────────────────
  const toggleGoal = (g: string) =>
    setSignupGoals((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));

  // ── LOGIN SUBMIT ──────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErrors({});
    setLoading(true);
    try {
      await login(loginEmail, loginPassword);
      toast.success("Welcome back to 360° Skincare!");
      navigate({ to: "/" });
    } catch (err) {
      if (err instanceof AuthError) {
        if (err.code === "EMPTY_EMAIL") setLoginErrors({ email: err.message });
        else if (err.code === "EMPTY_PASSWORD") setLoginErrors({ password: err.message });
        else if (err.code === "INVALID_CREDENTIALS" || err.code === "WRONG_PASSWORD" || err.code === "USER_NOT_FOUND") {
          setLoginErrors({ general: "Invalid email or password" });
        } else if (err.code === "SERVER_UNAVAILABLE") {
          setLoginErrors({ general: "Server unavailable. Please try again later." });
        } else if (err.code === "INVALID_EMAIL_FORMAT") {
          setLoginErrors({ email: err.message });
        } else {
          setLoginErrors({ general: err.message });
        }
      } else {
        setLoginErrors({ general: "Server unavailable. Please try again later." });
      }
    } finally {
      setLoading(false);
    }
  };

  // ── SIGNUP SUBMIT ─────────────────────────────────────────────────────────
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupErrors({});
    setLoading(true);
    try {
      const allergyList = signupAllergies
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
      await signup(
        signupEmail,
        signupPassword,
        signupConfirm,
        signupName,
        signupAge,
        signupGender,
        signupGoals,
        allergyList
      );
      toast.success("Account created! Welcome to 360° Skincare.");
      navigate({ to: "/" });
    } catch (err) {
      if (err instanceof AuthError) {
        const map: Record<string, string> = {
          NAME_REQUIRED: "name",
          EMPTY_EMAIL: "email",
          INVALID_EMAIL_FORMAT: "email",
          EMPTY_PASSWORD: "password",
          WEAK_PASSWORD: "password",
          PASSWORDS_DONT_MATCH: "confirm",
          ACCOUNT_EXISTS: "email",
        };
        const field = map[err.code] || "general";
        setSignupErrors({ [field]: err.message });
      } else {
        setSignupErrors({ general: "Sign up failed. Please try again." });
      }
    } finally {
      setLoading(false);
    }
  };

  // ── FORGOT PASSWORD SUBMIT ────────────────────────────────────────────────
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");
    setLoading(true);
    try {
      await forgotPassword(forgotEmail);
      setResetSent(true);
      toast.success("Password reset link has been sent to your email.");
    } catch (err) {
      if (err instanceof AuthError) setForgotError(err.message);
      else setForgotError("Failed to send reset link.");
    } finally {
      setLoading(false);
    }
  };

  // ── GOOGLE OAUTH FLOW ─────────────────────────────────────────────────────
  const handleGoogleClick = () => {
    setOauthStep("chooser");
    setSelectedAcc(null);
    setShowGoogleChooser(true);
  };

  const executeGoogleLogin = async (acc: typeof GOOGLE_ACCOUNTS[0]) => {
    setSelectedAcc(acc);
    setOauthStep("verifying");
    await new Promise((r) => setTimeout(r, 1400));
    try {
      await googleLogin(acc.email, acc.name, acc.picture);
      setOauthStep("done");
      await new Promise((r) => setTimeout(r, 600));
      setShowGoogleChooser(false);
      toast.success(`Signed in as ${acc.email}`);
      navigate({ to: "/" });
    } catch {
      toast.error("Google authentication failed.");
      setShowGoogleChooser(false);
    }
  };

  const handleApple = async () => {
    setLoading(true);
    try {
      await appleLogin("apple.user@icloud.com", "Apple User");
      toast.success("Signed in with Apple.");
      navigate({ to: "/" });
    } catch {
      toast.error("Apple login failed.");
    } finally {
      setLoading(false);
    }
  };

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen items-stretch bg-background">
      {/* ── LEFT PANEL (desktop only) ──────────────────────── */}
      <div className="glow-veil relative hidden w-1/2 flex-col justify-between border-r border-border/50 p-12 lg:flex select-none">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="size-4.5" />
          </span>
          <span className="font-display text-xl leading-none">360° Skincare</span>
        </div>

        <div className="max-w-md space-y-6">
          <h2 className="font-display text-4xl leading-tight">
            A clinical, personal approach to skincare.
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            AI skin analysis, personalised routines, allergy-safe product matching, and health
            monitoring — all in one dashboard.
          </p>
          <div className="flex gap-4">
            {[
              { value: "74", label: "Skin Score" },
              { value: "96%", label: "Match Accuracy" },
              { value: "15", label: "Skin Markers" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-border/70 bg-card/60 p-4 backdrop-blur-md"
              >
                <p className="text-xl font-display leading-none">{s.value}</p>
                <p className="mt-1 text-2xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} 360° Skincare. All rights reserved.</p>
      </div>

      {/* ── RIGHT PANEL (form) ────────────────────────────── */}
      <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-16">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden mb-8">
            <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Sparkles className="size-4" />
            </span>
            <span className="font-display text-lg leading-none">360° Skincare</span>
          </div>

          {/* Heading */}
          <div className="mb-7">
            <h1 className="text-2xl font-display">
              {mode === "login" ? "Welcome back" : mode === "signup" ? "Create account" : "Reset password"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {mode === "login"
                ? "Sign in to access your skincare dashboard."
                : mode === "signup"
                  ? "Tell us about your skin to personalise everything."
                  : "Enter your email and we'll send a reset link."}
            </p>
          </div>

          {/* Mode switcher (not shown on forgot) */}
          {mode !== "forgot" && (
            <div className="mb-6 flex rounded-full bg-muted p-1">
              {(["login", "signup"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`flex-1 rounded-full py-2 text-center text-sm font-medium capitalize transition-all ${
                    mode === m
                      ? "bg-card text-foreground shadow-sm font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m === "login" ? "Sign In" : "Sign Up"}
                </button>
              ))}
            </div>
          )}

          {/* Demo credentials hint */}
          {mode === "login" && (
            <div className="mb-5 rounded-2xl border border-border/80 bg-accent/15 p-3.5 text-xs text-muted-foreground">
              <strong className="text-foreground">Demo:</strong>{" "}
              <code className="bg-muted px-1.5 py-0.5 rounded">user@example.com</code> /{" "}
              <code className="bg-muted px-1.5 py-0.5 rounded">Password1!</code>
            </div>
          )}

          {/* ── LOGIN FORM ────────────────────────────────── */}
          {mode === "login" && (
            <form onSubmit={handleLogin} className="space-y-4" noValidate>
              {loginErrors.general && (
                <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-3 text-xs text-destructive animate-fadeIn">
                  <AlertCircle className="size-4 shrink-0" />
                  {loginErrors.general}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="login-email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 size-4 text-muted-foreground" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="name@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className={`pl-9 ${loginErrors.email ? "border-destructive" : ""}`}
                  />
                </div>
                <FieldError message={loginErrors.email} />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="login-password">Password</Label>
                  <button
                    type="button"
                    onClick={() => setMode("forgot")}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 size-4 text-muted-foreground" />
                  <Input
                    id="login-password"
                    type={showLoginPwd ? "text" : "password"}
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className={`pl-9 pr-9 ${loginErrors.password ? "border-destructive" : ""}`}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowLoginPwd((v) => !v)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  >
                    {showLoginPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <FieldError message={loginErrors.password} />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <><RefreshCw className="mr-2 size-4 animate-spin" />Signing in...</> : "Sign In"}
              </Button>
            </form>
          )}

          {/* ── SIGNUP FORM ───────────────────────────────── */}
          {mode === "signup" && (
            <form onSubmit={handleSignup} className="space-y-4" noValidate>
              {signupErrors.general && (
                <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-3 text-xs text-destructive animate-fadeIn">
                  <AlertCircle className="size-4 shrink-0" />
                  {signupErrors.general}
                </div>
              )}

              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="su-name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 size-4 text-muted-foreground" />
                  <Input
                    id="su-name"
                    placeholder="Aanya Sharma"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    className={`pl-9 ${signupErrors.name ? "border-destructive" : ""}`}
                  />
                </div>
                <FieldError message={signupErrors.name} />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="su-email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 size-4 text-muted-foreground" />
                  <Input
                    id="su-email"
                    type="email"
                    placeholder="name@example.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    className={`pl-9 ${signupErrors.email ? "border-destructive" : ""}`}
                  />
                </div>
                <FieldError message={signupErrors.email} />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="su-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 size-4 text-muted-foreground" />
                  <Input
                    id="su-password"
                    type={showSignupPwd ? "text" : "password"}
                    placeholder="Min 8 chars, A-Z, 0-9, symbol"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    className={`pl-9 pr-9 ${signupErrors.password ? "border-destructive" : ""}`}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowSignupPwd((v) => !v)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  >
                    {showSignupPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <PasswordStrengthBar password={signupPassword} />
                <FieldError message={signupErrors.password} />
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <Label htmlFor="su-confirm">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 size-4 text-muted-foreground" />
                  <Input
                    id="su-confirm"
                    type={showConfirmPwd ? "text" : "password"}
                    placeholder="Repeat your password"
                    value={signupConfirm}
                    onChange={(e) => setSignupConfirm(e.target.value)}
                    className={`pl-9 pr-9 ${signupErrors.confirm ? "border-destructive" : ""}`}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowConfirmPwd((v) => !v)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <FieldError message={signupErrors.confirm} />
              </div>

              {/* Age & Gender */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="su-age">Age</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 size-4 text-muted-foreground" />
                    <Input
                      id="su-age"
                      type="number"
                      min="1"
                      max="120"
                      value={signupAge}
                      onChange={(e) => setSignupAge(parseInt(e.target.value) || 25)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="su-gender">Gender</Label>
                  <select
                    id="su-gender"
                    value={signupGender}
                    onChange={(e) => setSignupGender(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Non-binary">Non-binary</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              {/* Skin Goals */}
              <div className="space-y-2">
                <Label>Skin Goals</Label>
                <div className="flex flex-wrap gap-2">
                  {SKIN_GOALS_OPTIONS.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => toggleGoal(g)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-all ${
                        signupGoals.includes(g)
                          ? "bg-primary border-primary text-primary-foreground shadow-sm"
                          : "bg-background border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Allergies */}
              <div className="space-y-1.5">
                <Label htmlFor="su-allergies">Skin Allergies <span className="text-muted-foreground">(Optional)</span></Label>
                <Input
                  id="su-allergies"
                  placeholder="e.g. Fragrance, Sulfates"
                  value={signupAllergies}
                  onChange={(e) => setSignupAllergies(e.target.value)}
                />
                <p className="text-2xs text-muted-foreground">Separate with commas.</p>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <><RefreshCw className="mr-2 size-4 animate-spin" />Creating account...</> : "Create Account"}
              </Button>
            </form>
          )}

          {/* ── FORGOT PASSWORD FORM ──────────────────────── */}
          {mode === "forgot" && (
            <div className="space-y-6">
              {!resetSent ? (
                <form onSubmit={handleForgotPassword} className="space-y-4" noValidate>
                  <div className="space-y-1.5">
                    <Label htmlFor="forgot-email">Registered Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 size-4 text-muted-foreground" />
                      <Input
                        id="forgot-email"
                        type="email"
                        placeholder="name@example.com"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className={`pl-9 ${forgotError ? "border-destructive" : ""}`}
                      />
                    </div>
                    <FieldError message={forgotError} />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <><RefreshCw className="mr-2 size-4 animate-spin" />Sending...</> : "Send Reset Link"}
                  </Button>
                </form>
              ) : (
                <div className="rounded-2xl border border-success/30 bg-success/10 p-5 text-center animate-fadeIn">
                  <CheckCircle2 className="mx-auto size-10 text-success mb-3" />
                  <p className="font-semibold text-foreground">Check your inbox</p>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                    Password reset link has been sent to{" "}
                    <strong className="text-foreground">{forgotEmail}</strong>.
                  </p>
                </div>
              )}
              <button
                type="button"
                onClick={() => { setMode("login"); setResetSent(false); setForgotError(""); }}
                className="flex items-center justify-center w-full text-sm text-muted-foreground hover:text-foreground"
              >
                ← Back to Sign In
              </button>
            </div>
          )}

          {/* ── SOCIAL LOGIN ──────────────────────────────── */}
          {mode !== "forgot" && (
            <>
              <div className="relative my-7">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleClick}
                  disabled={loading}
                  className="rounded-xl gap-2 border-border/70 hover:bg-accent/30"
                >
                  <GoogleIcon />
                  Google
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleApple}
                  disabled={loading}
                  className="rounded-xl gap-2 border-border/70 hover:bg-accent/30"
                >
                  <AppleIcon />
                  Apple
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── GOOGLE OAUTH CHOOSER DIALOG ───────────────────── */}
      <Dialog open={showGoogleChooser} onOpenChange={setShowGoogleChooser}>
        <DialogContent className="max-w-sm rounded-3xl bg-card shadow-lift border border-border/80 p-6">
          {oauthStep === "chooser" && (
            <div className="space-y-5">
              <div className="text-center space-y-1">
                <GoogleIcon className="mx-auto size-7" />
                <DialogTitle className="font-display text-lg mt-2">Sign in with Google</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  to continue to <span className="font-medium text-foreground">360° Skincare</span>
                </DialogDescription>
              </div>

              {/* Pre-authenticated accounts ONLY — no free-text per spec */}
              <div className="space-y-2">
                {GOOGLE_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    onClick={() => executeGoogleLogin(acc)}
                    className="flex w-full items-center gap-3 rounded-2xl border border-border/80 bg-muted/20 p-3.5 text-left text-sm transition-all hover:bg-muted/60 active:scale-[0.98]"
                  >
                    <img
                      src={acc.picture}
                      alt=""
                      className="size-9 rounded-full border border-border bg-background object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{acc.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{acc.email}</p>
                    </div>
                  </button>
                ))}
              </div>

              <p className="text-center text-2xs text-muted-foreground">
                Only signed-in Google accounts can be used.{" "}
                <button
                  type="button"
                  className="underline hover:text-foreground"
                  onClick={() => setShowGoogleChooser(false)}
                >
                  Cancel
                </button>
              </p>
            </div>
          )}

          {oauthStep === "verifying" && selectedAcc && (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
              <div className="relative">
                <img
                  src={selectedAcc.picture}
                  alt=""
                  className="size-14 rounded-full border-2 border-primary object-cover"
                />
                <div className="absolute -inset-1 rounded-full border-2 border-primary/30 animate-ping" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Verifying with Google…</p>
                <p className="text-xs text-muted-foreground mt-1">{selectedAcc.email}</p>
              </div>
              <div className="w-48 bg-muted rounded-full h-1 overflow-hidden">
                <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: "80%" }} />
              </div>
              <p className="text-2xs text-muted-foreground max-w-[13rem] leading-relaxed">
                Validating OAuth 2.0 tokens and syncing profile data…
              </p>
            </div>
          )}

          {oauthStep === "done" && (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
              <CheckCircle2 className="size-12 text-success" />
              <p className="font-semibold text-foreground">Authentication successful</p>
              <p className="text-xs text-muted-foreground">Redirecting to your dashboard…</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function GoogleIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
    </svg>
  );
}

function AppleIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.22.67-2.94 1.5-.64.74-1.2 1.88-1.05 2.99 1.12.09 2.27-.58 3-1.43z" />
    </svg>
  );
}
