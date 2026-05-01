'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import BottomNav from '@/components/BottomNav';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Modal from '@/components/Modal';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { useChamaStore } from '@/store/useChamaStore';
import { updateChama } from '@/lib/supabase';
import { 
  getAutomationSettings, 
  updateAutomationSettings, 
  triggerAutoReminders,
  triggerAutoFines 
} from '@/lib/automationFunctions';
import { Save, Zap, Settings as SettingsIcon, AlertCircle } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const chama = useChamaStore((state) => state.chama);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingAuto, setIsSavingAuto] = useState(false);
  const [isTestingAuto, setIsTestingAuto] = useState(false);
  const [chamaSettings, setChamaSettings] = useState({
    name: '',
    contributionAmount: '',
    meetingDay: 'Monday',
  });
  const [autoSettings, setAutoSettings] = useState({
    auto_reminders_enabled: true,
    auto_fines_enabled: true,
    reminder_before_days: 3,
    reminder_on_due: true,
    reminder_after_days: 1,
    fine_type: 'fixed',
    fine_amount: 500,
    fine_percentage: 5,
    max_reminders_per_contribution: 3,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user || !chama) {
      router.push('/dashboard');
      return;
    }

    loadSettings();
  }, [chama, user, router]);

  const loadSettings = async () => {
    try {
      setChamaSettings({
        name: chama?.name || '',
        contributionAmount: String(chama?.contribution_amount || 0),
        meetingDay: chama?.meeting_day || 'Monday',
      });

      const automationSettings = await getAutomationSettings(chama!.id);
      setAutoSettings(automationSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load settings');
    }
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      await updateChama(chama!.id, {
        name: chamaSettings.name,
        contribution_amount: parseFloat(chamaSettings.contributionAmount),
        meeting_day: chamaSettings.meetingDay,
      });
      toast.success('Settings saved successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAutomationSettings = async () => {
    setIsSavingAuto(true);
    try {
      await updateAutomationSettings(chama!.id, autoSettings);
      toast.success('Automation settings updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save automation settings');
    } finally {
      setIsSavingAuto(false);
    }
  };

  const handleTestAutoReminders = async () => {
    setIsTestingAuto(true);
    try {
      const result = await triggerAutoReminders(chama!.id);
      toast.success(`Auto reminders test: ${result.created} reminders created`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to test auto reminders');
    } finally {
      setIsTestingAuto(false);
    }
  };

  const handleTestAutoFines = async () => {
    setIsTestingAuto(true);
    try {
      const result = await triggerAutoFines(chama!.id);
      toast.success(`Auto fines test: ${result.created} fines created`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to test auto fines');
    } finally {
      setIsTestingAuto(false);
    }
  };

  return (
    <div className="min-h-screen bg-grove-dark">
      <Navbar />
      <Sidebar />
      <BottomNav />

      <main className="flex-1 lg:ml-64 min-h-screen bg-slate-900 p-6 pt-[70px] lg:pt-6 pb-20 lg:pb-0">
        <div className="w-full max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
              <SettingsIcon size={32} className="text-grove-accent" />
              Settings
            </h1>
            <p className="text-slate-400">Configure chama settings and automation</p>
          </div>

          {/* Chama Settings Section */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-6">Chama Settings</h2>

            <div className="space-y-4">
              <Input
                label="Chama Name"
                value={chamaSettings.name}
                onChange={(e) =>
                  setChamaSettings({ ...chamaSettings, name: e.target.value })
                }
                error={errors.name}
              />

              <Input
                label="Monthly Contribution Amount"
                type="number"
                value={chamaSettings.contributionAmount}
                onChange={(e) =>
                  setChamaSettings({
                    ...chamaSettings,
                    contributionAmount: e.target.value,
                  })
                }
                error={errors.contributionAmount}
              />

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Meeting Day
                </label>
                <select
                  value={chamaSettings.meetingDay}
                  onChange={(e) =>
                    setChamaSettings({
                      ...chamaSettings,
                      meetingDay: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-grove-accent"
                >
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(
                    (day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    )
                  )}
                </select>
              </div>

              <Button
                variant="primary"
                icon={<Save size={16} />}
                isLoading={isLoading}
                onClick={handleSaveSettings}
              >
                Save Settings
              </Button>
            </div>
          </div>

          {/* Automation Settings Section */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Zap size={20} className="text-yellow-400" />
              Intelligent Automation
            </h2>

            <div className="space-y-6">
              {/* Smart Reminders Section */}
              <div className="bg-slate-700 rounded-lg p-4 border border-slate-600">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Smart Reminders</h3>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={autoSettings.auto_reminders_enabled}
                      onChange={(e) =>
                        setAutoSettings({
                          ...autoSettings,
                          auto_reminders_enabled: e.target.checked,
                        })
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-slate-300">Enable</span>
                  </label>
                </div>

                {autoSettings.auto_reminders_enabled && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Days before due date to send reminder
                      </label>
                      <Input
                        type="number"
                        min="0"
                        max="30"
                        value={autoSettings.reminder_before_days}
                        onChange={(e) =>
                          setAutoSettings({
                            ...autoSettings,
                            reminder_before_days: parseInt(e.target.value),
                          })
                        }
                      />
                    </div>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={autoSettings.reminder_on_due}
                        onChange={(e) =>
                          setAutoSettings({
                            ...autoSettings,
                            reminder_on_due: e.target.checked,
                          })
                        }
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-slate-300">Send reminder on due date</span>
                    </label>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Days after due date to send overdue reminder
                      </label>
                      <Input
                        type="number"
                        min="0"
                        max="30"
                        value={autoSettings.reminder_after_days}
                        onChange={(e) =>
                          setAutoSettings({
                            ...autoSettings,
                            reminder_after_days: parseInt(e.target.value),
                          })
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Max reminders per contribution
                      </label>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={autoSettings.max_reminders_per_contribution}
                        onChange={(e) =>
                          setAutoSettings({
                            ...autoSettings,
                            max_reminders_per_contribution: parseInt(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Auto Fines Section */}
              <div className="bg-slate-700 rounded-lg p-4 border border-slate-600">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Auto Fines</h3>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={autoSettings.auto_fines_enabled}
                      onChange={(e) =>
                        setAutoSettings({
                          ...autoSettings,
                          auto_fines_enabled: e.target.checked,
                        })
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-slate-300">Enable</span>
                  </label>
                </div>

                {autoSettings.auto_fines_enabled && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Fine Type
                      </label>
                      <select
                        value={autoSettings.fine_type}
                        onChange={(e) =>
                          setAutoSettings({
                            ...autoSettings,
                            fine_type: e.target.value as 'fixed' | 'percentage',
                          })
                        }
                        className="w-full px-4 py-2 bg-slate-600 border border-slate-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-grove-accent"
                      >
                        <option value="fixed">Fixed Amount</option>
                        <option value="percentage">Percentage</option>
                      </select>
                    </div>

                    {autoSettings.fine_type === 'fixed' ? (
                      <Input
                        label="Fine Amount (KES)"
                        type="number"
                        min="0"
                        step="50"
                        value={autoSettings.fine_amount}
                        onChange={(e) =>
                          setAutoSettings({
                            ...autoSettings,
                            fine_amount: parseFloat(e.target.value),
                          })
                        }
                      />
                    ) : (
                      <Input
                        label="Fine Percentage (%)"
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={autoSettings.fine_percentage}
                        onChange={(e) =>
                          setAutoSettings({
                            ...autoSettings,
                            fine_percentage: parseFloat(e.target.value),
                          })
                        }
                      />
                    )}

                    <div className="bg-slate-800 border border-slate-600 rounded p-3 flex gap-2">
                      <AlertCircle size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-300">
                        Fines are automatically applied when a contribution becomes overdue.
                        Admin can override or remove fines manually.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button
                  variant="primary"
                  icon={<Save size={16} />}
                  isLoading={isSavingAuto}
                  onClick={handleSaveAutomationSettings}
                >
                  Save Automation Settings
                </Button>

                <Button
                  variant="secondary"
                  isLoading={isTestingAuto}
                  onClick={handleTestAutoReminders}
                >
                  Test Auto Reminders
                </Button>

                <Button
                  variant="secondary"
                  isLoading={isTestingAuto}
                  onClick={handleTestAutoFines}
                >
                  Test Auto Fines
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
