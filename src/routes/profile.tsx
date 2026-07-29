import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { User, Calendar, ShieldAlert, ArrowLeft, RefreshCw, Mail, Bell, Clock, CalendarDays } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Edit Profile & Notifications — 360° Skincare" },
      {
        name: "description",
        content: "Manage your 360° Skincare goals, email alert settings, and allergies.",
      },
    ],
  }),
  component: ProfilePage,
});

const SKIN_GOALS_OPTIONS = [
  "Clear acne",
  "Even tone",
  "Hydration",
  "Anti-aging",
  "Reduce redness",
  "Refine pores",
];

type ProfileTab = "details" | "notifications";

function ProfilePage() {
  const navigate = useNavigate();
  const { user, updateProfile, updateNotifications } = useAuth();
  
  const [activeTab, setActiveTab] = useState<ProfileTab>("details");

  // Profile Details State
  const [name, setName] = useState("");
  const [age, setAge] = useState<number>(25);
  const [gender, setGender] = useState("Female");
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [allergies, setAllergies] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);

  // Notification Preferences State
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(true);
  const [inAppAlerts, setInAppAlerts] = useState(true);
  
  const [morningTime, setMorningTime] = useState("08:00");
  const [nightTime, setNightTime] = useState("22:00");
  const [scanTime, setScanTime] = useState("21:00");
  const [waterTime, setWaterTime] = useState("12:00");
  const [sleepTime, setSleepTime] = useState("23:00");

  const [routineFreq, setRoutineFreq] = useState<"daily" | "weekly">("daily");
  const [waterFreq, setWaterFreq] = useState<"hourly" | "daily">("daily");
  const [reportFreq, setReportFreq] = useState<"weekly" | "monthly">("weekly");
  const [notifLoading, setNotifLoading] = useState(false);

  // Sync state when user context is loaded
  useEffect(() => {
    if (user) {
      // Load details
      setName(user.profile.name);
      setAge(user.profile.age);
      setGender(user.profile.gender);
      setSelectedGoals(user.profile.goals || []);
      setAllergies(user.profile.allergies?.join(", ") || "");

      // Load notifications
      const notifs = user.notifications;
      if (notifs) {
        setEmailAlerts(notifs.email);
        setPushAlerts(notifs.push);
        setInAppAlerts(notifs.inApp);
        setMorningTime(notifs.reminderTimes.morningRoutine);
        setNightTime(notifs.reminderTimes.nightRoutine);
        setScanTime(notifs.reminderTimes.faceScan);
        setWaterTime(notifs.reminderTimes.water);
        setSleepTime(notifs.reminderTimes.sleep);
        setRoutineFreq(notifs.frequencies.routine);
        setWaterFreq(notifs.frequencies.water);
        setReportFreq(notifs.frequencies.report);
      }
    }
  }, [user]);

  const handleGoalToggle = (goal: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  };

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast.error("Name is required.");
      return;
    }
    setProfileLoading(true);

    const allergyList = allergies
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);

    try {
      updateProfile({
        name,
        age,
        gender,
        goals: selectedGoals,
        allergies: allergyList,
      });
      toast.success("Profile details updated successfully!");
    } catch {
      toast.error("Failed to update profile details.");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleNotificationsSave = (e: React.FormEvent) => {
    e.preventDefault();
    setNotifLoading(true);

    try {
      updateNotifications({
        email: emailAlerts,
        push: pushAlerts,
        inApp: inAppAlerts,
        reminderTimes: {
          morningRoutine: morningTime,
          nightRoutine: nightTime,
          faceScan: scanTime,
          water: waterTime,
          sleep: sleepTime,
        },
        frequencies: {
          routine: routineFreq,
          scan: "daily",
          water: waterFreq,
          sleep: "daily",
          report: reportFreq,
        },
      });
      toast.success("Notification preferences saved successfully!");
    } catch {
      toast.error("Failed to save notification preferences.");
    } finally {
      setNotifLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate({ to: "/" })} className="gap-1.5 -ml-3 hover:bg-accent/40">
          <ArrowLeft className="size-4" /> Back to Dashboard
        </Button>
      </div>

      <PageHeader
        eyebrow="Account Settings"
        title="Settings &amp; Preferences"
        description="Update your skin goals, allergies, email reminders, and alerts configuration."
      />

      {/* Tabs */}
      <div className="mb-6 flex rounded-full bg-muted p-1 max-w-md select-none">
        <button
          type="button"
          onClick={() => setActiveTab("details")}
          className={`flex-1 rounded-full py-2 text-center text-sm font-medium transition-all ${
            activeTab === "details"
              ? "bg-card text-foreground shadow-sm font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Profile Details
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("notifications")}
          className={`flex-1 rounded-full py-2 text-center text-sm font-medium transition-all ${
            activeTab === "notifications"
              ? "bg-card text-foreground shadow-sm font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Notifications
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="surface p-6 sm:p-8 animate-fadeIn">
          {activeTab === "details" ? (
            <form onSubmit={handleProfileSave} className="space-y-6">
              <h2 className="text-xl border-b border-border/60 pb-3 flex items-center gap-2">
                <User className="size-5 text-primary" /> Personal Details
              </h2>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="profile-name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 size-4 text-muted-foreground" />
                    <Input
                      id="profile-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-9"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="profile-email">Email Address</Label>
                  <Input
                    id="profile-email"
                    type="email"
                    value={user?.email || ""}
                    className="bg-muted text-muted-foreground cursor-not-allowed"
                    disabled
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="profile-age">Age</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 size-4 text-muted-foreground" />
                    <Input
                      id="profile-age"
                      type="number"
                      min="1"
                      max="120"
                      value={age}
                      onChange={(e) => setAge(parseInt(e.target.value) || 25)}
                      className="pl-9"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="profile-gender">Gender</Label>
                  <select
                    id="profile-gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Non-binary">Non-binary</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              <h2 className="text-xl border-b border-border/60 pb-3 pt-2">Skincare Focus</h2>

              <div className="space-y-3">
                <Label>Select Skin Goals</Label>
                <div className="flex flex-wrap gap-2">
                  {SKIN_GOALS_OPTIONS.map((g) => {
                    const isSelected = selectedGoals.includes(g);
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => handleGoalToggle(g)}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
                          isSelected
                            ? "bg-primary border-primary text-primary-foreground shadow-sm"
                            : "bg-background border-border text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {g}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="profile-allergies">Allergies &amp; Exclusions</Label>
                <Input
                  id="profile-allergies"
                  placeholder="e.g. Fragrance, Sulfates, Chemicals"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                />
                <p className="text-xs text-muted-foreground leading-normal">
                  Let us know what ingredients to flag as warning tags on products (separated by commas).
                </p>
              </div>

              <div className="flex justify-end border-t border-border/60 pt-4">
                <Button type="submit" disabled={profileLoading}>
                  {profileLoading ? (
                    <>
                      <RefreshCw className="mr-2 size-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    "Save Details"
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleNotificationsSave} className="space-y-6">
              <h2 className="text-xl border-b border-border/60 pb-3 flex items-center gap-2">
                <Bell className="size-5 text-primary" /> Delivery Channels
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <Mail className="size-4 text-muted-foreground" /> Email Notifications
                    </Label>
                    <p className="text-xs text-muted-foreground max-w-sm">
                      Receive automated alerts sent directly to your Google account email: <strong className="text-foreground">{user?.email}</strong>.
                    </p>
                  </div>
                  <Switch checked={emailAlerts} onCheckedChange={setEmailAlerts} />
                </div>

                <div className="flex items-center justify-between border-t border-border/40 pt-4">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <Bell className="size-4 text-muted-foreground" /> Push Notifications
                    </Label>
                    <p className="text-xs text-muted-foreground max-w-sm">
                      Deliver instant desktop pop-ups for water reminders and scans.
                    </p>
                  </div>
                  <Switch checked={pushAlerts} onCheckedChange={setPushAlerts} />
                </div>

                <div className="flex items-center justify-between border-t border-border/40 pt-4">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <Sparkles className="size-4 text-muted-foreground" /> In-App Notifications
                    </Label>
                    <p className="text-xs text-muted-foreground max-w-sm">
                      Show smart indicators and tips directly inside your 360° Skincare dashboard header.
                    </p>
                  </div>
                  <Switch checked={inAppAlerts} onCheckedChange={setInAppAlerts} />
                </div>
              </div>

              <h2 className="text-xl border-b border-border/60 pb-3 pt-2 flex items-center gap-2">
                <Clock className="size-5 text-primary" /> Scheduled Alert Times
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="time-morning">Morning Routine Reminder</Label>
                  <Input id="time-morning" type="time" value={morningTime} onChange={(e) => setMorningTime(e.target.value)} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="time-night">Night Routine Reminder</Label>
                  <Input id="time-night" type="time" value={nightTime} onChange={(e) => setNightTime(e.target.value)} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="time-scan">Daily Face Scan Alert</Label>
                  <Input id="time-scan" type="time" value={scanTime} onChange={(e) => setScanTime(e.target.value)} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="time-water">Water Intake Alert</Label>
                  <Input id="time-water" type="time" value={waterTime} onChange={(e) => setWaterTime(e.target.value)} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="time-sleep">Bedtime Wind-down Alert</Label>
                  <Input id="time-sleep" type="time" value={sleepTime} onChange={(e) => setSleepTime(e.target.value)} />
                </div>
              </div>

              <h2 className="text-xl border-b border-border/60 pb-3 pt-2 flex items-center gap-2">
                <CalendarDays className="size-5 text-primary" /> Alert Frequencies
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="freq-routine">Skincare Routine Alert</Label>
                  <select
                    id="freq-routine"
                    value={routineFreq}
                    onChange={(e) => setRoutineFreq(e.target.value as any)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="daily">Daily Alerts</option>
                    <option value="weekly">Weekly Summaries</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="freq-water">Water Smart Reminders</Label>
                  <select
                    id="freq-water"
                    value={waterFreq}
                    onChange={(e) => setWaterFreq(e.target.value as any)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="hourly">Every 3 Hours (Smart)</option>
                    <option value="daily">Daily Target Alerts</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="freq-report">Progress Reports &amp; Analytics</Label>
                  <select
                    id="freq-report"
                    value={reportFreq}
                    onChange={(e) => setReportFreq(e.target.value as any)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="weekly">Weekly Skin Reports</option>
                    <option value="monthly">Monthly Skin Health Report</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end border-t border-border/60 pt-4">
                <Button type="submit" disabled={notifLoading}>
                  {notifLoading ? (
                    <>
                      <RefreshCw className="mr-2 size-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    "Save Notification Preferences"
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Sidebar Summary */}
        <div className="space-y-6">
          <div className="surface p-6">
            <h3 className="eyebrow mb-4">Profile Summary</h3>
            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-3">
                {user?.profilePicture ? (
                  <img src={user.profilePicture} alt="" className="size-11 rounded-full border border-border object-cover" />
                ) : (
                  <span className="flex size-11 items-center justify-center rounded-xl bg-accent text-accent-foreground font-display text-lg">
                    {name.charAt(0) || "U"}
                  </span>
                )}
                <div>
                  <p className="font-semibold text-foreground leading-none">{name || "User"}</p>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-none truncate max-w-[10rem]">{user?.email}</p>
                </div>
              </div>

              <div className="border-t border-border/60 pt-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">User UID</span>
                  <span className="font-mono text-2xs truncate max-w-[8rem]" title={user?.uid}>{user?.uid}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Joined 360° Skincare</span>
                  <span className="font-medium">{user?.registrationDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Age</span>
                  <span className="font-medium">{age}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gender</span>
                  <span className="font-medium">{gender}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 space-y-3">
            <div className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="size-5" />
              <h4 className="font-semibold">Allergy Safety Checks</h4>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              When scanning or comparing ingredients, 360° Skincare will automatically highlight matches that contain
              your listed allergies and exclude them from top-matched recommendations.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
