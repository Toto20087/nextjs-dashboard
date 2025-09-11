import { useState } from 'react';
import {
  Settings,
  Bell,
  Monitor,
  Globe,
  Smartphone,
  Mail,
  MessageSquare,
  RefreshCw
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../ui/tabs';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Slider } from '../ui/slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface UserPreferencesProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PreferenceState {
  notifications: {
    pushEnabled: boolean;
    emailEnabled: boolean;
    smsEnabled: boolean;
    tradeAlerts: boolean;
    priceAlerts: boolean;
    systemAlerts: boolean;
    newsAlerts: boolean;
  };
  display: {
    timezone: string;
    currency: string;
    decimalPlaces: number;
    autoRefresh: boolean;
    refreshInterval: number;
  };
}

export const UserPreferences = ({ open, onOpenChange }: UserPreferencesProps) => {
  const [preferences, setPreferences] = useState<PreferenceState>({
    notifications: {
      pushEnabled: true,
      emailEnabled: true,
      smsEnabled: false,
      tradeAlerts: true,
      priceAlerts: true,
      systemAlerts: true,
      newsAlerts: false,
    },
    display: {
      timezone: 'America/New_York',
      currency: 'USD',
      decimalPlaces: 2,
      autoRefresh: true,
      refreshInterval: 5,
    },
  });

  const updatePreference = (section: keyof PreferenceState, key: string, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };

  const handleSave = () => {
    // Here you would save preferences to backend/localStorage
    console.log('Saving preferences:', preferences);
    onOpenChange(false);
  };

  const handleReset = () => {
    // Reset to default values
    setPreferences({
      notifications: {
        pushEnabled: true,
        emailEnabled: true,
        smsEnabled: false,
        tradeAlerts: true,
        priceAlerts: true,
        systemAlerts: true,
        newsAlerts: false,
      },
      display: {
        timezone: 'America/New_York',
        currency: 'USD',
        decimalPlaces: 2,
        autoRefresh: true,
        refreshInterval: 5,
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            User Preferences
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="notifications" className="w-full h-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="notifications" className="text-xs">
              <Bell className="w-4 h-4 mr-1" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="display" className="text-xs">
              <Monitor className="w-4 h-4 mr-1" />
              Display
            </TabsTrigger>
          </TabsList>

          <div className="mt-6 h-[500px] overflow-y-auto">
            <TabsContent value="notifications" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    Notification Channels
                  </CardTitle>
                  <CardDescription>Choose how you want to receive notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-muted-foreground" />
                      <Label htmlFor="push">Push Notifications</Label>
                    </div>
                    <Switch
                      id="push"
                      checked={preferences.notifications.pushEnabled}
                      onCheckedChange={(value) => updatePreference('notifications', 'pushEnabled', value)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <Label htmlFor="email">Email Notifications</Label>
                    </div>
                    <Switch
                      id="email"
                      checked={preferences.notifications.emailEnabled}
                      onCheckedChange={(value) => updatePreference('notifications', 'emailEnabled', value)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-muted-foreground" />
                      <Label htmlFor="sms">SMS Notifications</Label>
                    </div>
                    <Switch
                      id="sms"
                      checked={preferences.notifications.smsEnabled}
                      onCheckedChange={(value) => updatePreference('notifications', 'smsEnabled', value)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Notification Types</CardTitle>
                  <CardDescription>Select which events trigger notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="trade-alerts">Trade Execution Alerts</Label>
                    <Switch
                      id="trade-alerts"
                      checked={preferences.notifications.tradeAlerts}
                      onCheckedChange={(value) => updatePreference('notifications', 'tradeAlerts', value)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="price-alerts">Price Target Alerts</Label>
                    <Switch
                      id="price-alerts"
                      checked={preferences.notifications.priceAlerts}
                      onCheckedChange={(value) => updatePreference('notifications', 'priceAlerts', value)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="system-alerts">System Status Alerts</Label>
                    <Switch
                      id="system-alerts"
                      checked={preferences.notifications.systemAlerts}
                      onCheckedChange={(value) => updatePreference('notifications', 'systemAlerts', value)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="news-alerts">Market News Alerts</Label>
                    <Switch
                      id="news-alerts"
                      checked={preferences.notifications.newsAlerts}
                      onCheckedChange={(value) => updatePreference('notifications', 'newsAlerts', value)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="display" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Regional Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select
                      value={preferences.display.timezone}
                      onValueChange={(value) => updatePreference('display', 'timezone', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                        <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                        <SelectItem value="Europe/London">London (GMT)</SelectItem>
                        <SelectItem value="Europe/Frankfurt">Frankfurt (CET)</SelectItem>
                        <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                        <SelectItem value="Asia/Hong_Kong">Hong Kong (HKT)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="currency">Base Currency</Label>
                    <Select
                      value={preferences.display.currency}
                      onValueChange={(value) => updatePreference('display', 'currency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">US Dollar (USD)</SelectItem>
                        <SelectItem value="EUR">Euro (EUR)</SelectItem>
                        <SelectItem value="GBP">British Pound (GBP)</SelectItem>
                        <SelectItem value="JPY">Japanese Yen (JPY)</SelectItem>
                        <SelectItem value="CAD">Canadian Dollar (CAD)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Decimal Places: {preferences.display.decimalPlaces}</Label>
                    <Slider
                      value={[preferences.display.decimalPlaces]}
                      onValueChange={(value) => updatePreference('display', 'decimalPlaces', value[0])}
                      min={0}
                      max={6}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Auto-Refresh Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-refresh">Enable Auto-Refresh</Label>
                    <Switch
                      id="auto-refresh"
                      checked={preferences.display.autoRefresh}
                      onCheckedChange={(value) => updatePreference('display', 'autoRefresh', value)}
                    />
                  </div>
                  
                  {preferences.display.autoRefresh && (
                    <div className="space-y-2">
                      <Label>Refresh Interval: {preferences.display.refreshInterval} seconds</Label>
                      <Slider
                        value={[preferences.display.refreshInterval]}
                        onValueChange={(value) => updatePreference('display', 'refreshInterval', value[0])}
                        min={1}
                        max={60}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </div>

          <Separator />
          
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={handleReset}>
              Reset to Defaults
            </Button>
            <div className="space-x-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save Preferences
              </Button>
            </div>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};