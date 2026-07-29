import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useReminders } from "@/lib/reminder-context";
import { Bell, BellOff, Clock, Droplets, FlaskConical, ScanFace, Sparkles, Moon, Sun, Calendar, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

const ICON_MAP: Record<string, React.ReactNode> = {
  morning: <Sun className="size-4" />,
  afternoon: <Sun className="size-4" />,
  evening: <Moon className="size-4" />,
  night: <Moon className="size-4" />,
  weekly_mask: <Sparkles className="size-4" />,
  weekly_exfoliation: <Sparkles className="size-4" />,
  water: <Droplets className="size-4" />,
  refill: <FlaskConical className="size-4" />,
  scan: <ScanFace className="size-4" />,
};

function SettingsPage() {
  const { reminders, updateReminder, masterEnabled, setMasterEnabled, history } = useReminders();

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto py-6 space-y-8">
        <div>
          <h1 className="text-3xl font-display font-medium">Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your reminders, notifications, and app preferences.</p>
        </div>

        {/* Master Toggle */}
        <div className="surface p-6 flex items-start gap-4 transition-all">
          <div className={`p-3 rounded-2xl ${masterEnabled ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
            {masterEnabled ? <Bell className="size-6" /> : <BellOff className="size-6" />}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">Smart Reminders</h3>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              Enable push notifications to receive personalized reminders for your skincare routine, water intake, and weekly treatments.
            </p>
          </div>
          <div className="pt-1">
            <Switch 
              checked={masterEnabled} 
              onCheckedChange={setMasterEnabled} 
            />
          </div>
        </div>

        <Tabs defaultValue="reminders" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="reminders">Schedules</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="reminders">
            {/* Individual Reminders */}
            <div className={`space-y-6 mt-6 transition-opacity duration-300 ${masterEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <Clock className="size-5 text-primary" />
                <h2 className="text-xl font-display font-medium">Daily Routines</h2>
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2">
                {reminders.filter(r => ['morning', 'afternoon', 'evening', 'night'].includes(r.type)).map((reminder) => (
                  <div key={reminder.id} className="surface p-4 flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <div className="text-primary">{ICON_MAP[reminder.type]}</div>
                        <Label htmlFor={`enable-${reminder.id}`} className="font-semibold cursor-pointer">
                          {reminder.label}
                        </Label>
                      </div>
                      <Switch 
                        id={`enable-${reminder.id}`}
                        checked={reminder.enabled}
                        onCheckedChange={(c) => updateReminder(reminder.id, { enabled: c })}
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Input 
                        type="time" 
                        value={reminder.time}
                        onChange={(e) => updateReminder(reminder.id, { time: e.target.value })}
                        className="w-32 bg-background/50"
                      />
                      <select 
                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={reminder.frequency}
                        onChange={(e) => updateReminder(reminder.id, { frequency: e.target.value as any })}
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 pb-2 border-b border-border mt-8">
                <Calendar className="size-5 text-primary" />
                <h2 className="text-xl font-display font-medium">Weekly & Specialty</h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {reminders.filter(r => !['morning', 'afternoon', 'evening', 'night'].includes(r.type)).map((reminder) => (
                  <div key={reminder.id} className="surface p-4 flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <div className="text-primary">{ICON_MAP[reminder.type]}</div>
                        <Label htmlFor={`enable-${reminder.id}`} className="font-semibold cursor-pointer">
                          {reminder.label}
                        </Label>
                      </div>
                      <Switch 
                        id={`enable-${reminder.id}`}
                        checked={reminder.enabled}
                        onCheckedChange={(c) => updateReminder(reminder.id, { enabled: c })}
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Input 
                        type="time" 
                        value={reminder.time}
                        onChange={(e) => updateReminder(reminder.id, { time: e.target.value })}
                        className="w-32 bg-background/50"
                      />
                      <select 
                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={reminder.frequency}
                        onChange={(e) => updateReminder(reminder.id, { frequency: e.target.value as any })}
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          <TabsContent value="history">
            <div className="space-y-4 mt-6">
              {history.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="size-12 mx-auto mb-4 opacity-20" />
                  <p>No reminders completed yet.</p>
                  <p className="text-sm mt-1">Enable reminders and mark them as done to see them here.</p>
                </div>
              ) : (
                history.map((item) => (
                  <div key={item.id} className="surface p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                        <CheckCircle2 className="size-5" />
                      </div>
                      <div>
                        <p className="font-medium">{item.label}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(item.completedAt).toLocaleString(undefined, {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                      {item.status}
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
