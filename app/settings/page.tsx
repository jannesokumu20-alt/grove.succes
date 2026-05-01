'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import BottomNav from '@/components/BottomNav';
import Button from '@/components/Button';
import Input from '@/components/Input';
import GoalPlannerModal from '@/components/GoalPlannerModal';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { useChamaStore } from '@/store/useChamaStore';
import { updateChama } from '@/lib/supabase';
import { 
  getAutomationSettings, 
  updateAutomationSettings
} from '@/lib/automationFunctions';
import { Save, Settings as SettingsIcon } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const chama = useChamaStore((state) => state.chama);
  const updateChamaStore = useChamaStore((state) => state.updateChama);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingAuto, setIsSavingAuto] = useState(false);
  const [isGoalPlannerOpen, setIsGoalPlannerOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contributionAmount: '',
    meetingDay: 'Monday',
    savingsGoal: '',
  });
  const [autoSettings, setAutoSettings] = useState({
    auto_reminders_enabled: true,
    auto_fines_enabled: true,
    fine_type: 'fixed',
    fine_amount: 500,
    fine_percentage: 5,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (chama) {
      setFormData({
        name: chama?.name || '',
        contributionAmount: String(chama?.contribution_amount || 0),
        meetingDay: chama?.meeting_day || 'Monday',
        savingsGoal: String(chama?.savings_goal || 0),
      });
      loadAutomationSettings();
    }
  }, [chama]);

  const loadAutomationSettings = async () => {
    if (!chama) return;
    try {
      const settings = await getAutomationSettings(chama.id);
      setAutoSettings(settings);
    } catch (error) {
      console.error('Error loading automation settings:', error);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Chama name is required';
    }

    if (!formData.contributionAmount) {
      newErrors.contributionAmount = 'Contribution amount is required';
    } else if (isNaN(parseFloat(formData.contributionAmount))) {
      newErrors.contributionAmount = 'Must be a valid number';
    }

    if (formData.savingsGoal && isNaN(parseFloat(formData.savingsGoal))) {
      newErrors.savingsGoal = 'Must be a valid number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !chama || !user) return;

    setIsLoading(true);

    try {
      const updatedChama = await updateChama(chama.id, {
        name: formData.name,
        contribution_amount: parseFloat(formData.contributionAmount),
        meeting_day: formData.meetingDay,
        savings_goal: formData.savingsGoal ? parseFloat(formData.savingsGoal) : 0,
      } as any);

      updateChamaStore({
        name: updatedChama.name,
        contribution_amount: updatedChama.contribution_amount,
        meeting_day: updatedChama.meeting_day,
        savings_goal: updatedChama.savings_goal,
      } as any);

      toast.success('Settings saved successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAutomationSettings = async () => {
    if (!chama) return;
    setIsSavingAuto(true);
    try {
      await updateAutomationSettings(chama.id, autoSettings);
      toast.success('Automation settings updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save automation settings');
    } finally {
      setIsSavingAuto(false);
    }
  };

  const handleGoalPlannerSelect = async (amount: number) => {
    if (!chama) return;

    try {
      const updatedChama = await updateChama(chama.id, {
        contribution_amount: amount,
      } as any);

      updateChamaStore({
        contribution_amount: updatedChama.contribution_amount,
      } as any);

      setFormData((prev) => ({
        ...prev,
        contributionAmount: String(amount),
      }));

      toast.success(`Contribution amount updated to KES ${amount.toLocaleString()}!`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update contribution amount');
      throw error;
    }
  };

  if (!chama) {
    return (
      <div className="min-h-screen bg-grove-dark flex items-center justify-center">
        <p className="text-slate-400">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-grove-dark">
      <Navbar />
      <Sidebar />
      <BottomNav />

      <main className="flex-1 md:ml-64 min-h-screen bg-slate-900 p-6 pt-[70px] md:pt-6 pb-20 md:pb-0">
        <div className="w-full max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
              <SettingsIcon size={32} className="text-grove-accent" />
              Settings
            </h1>
            <p className="text-slate-400">Manage your chama settings</p>
          </div>

          {/* Chama Information Section */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-6">Chama Information</h2>
            <form onSubmit={handleSaveSettings} className="space-y-6">
              {/* Chama Name */}
              <Input
                label="Chama Name"
                placeholder="e.g., Kazi United"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                error={errors.name}
              />

              {/* Contribution Amount */}
              <Input
                label="Monthly Contribution Amount (KES)"
                type="number"
                placeholder="5000"
                value={formData.contributionAmount}
                onChange={(e) =>
                  setFormData({ ...formData, contributionAmount: e.target.value })
                }
                error={errors.contributionAmount}
              />

              {/* Meeting Day */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Meeting Day
                </label>
                <select
                  value={formData.meetingDay}
                  onChange={(e) =>
                    setFormData({ ...formData, meetingDay: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-grove-accent"
                >
                  <option>Monday</option>
                  <option>Tuesday</option>
                  <option>Wednesday</option>
                  <option>Thursday</option>
                  <option>Friday</option>
                  <option>Saturday</option>
                  <option>Sunday</option>
                </select>
              </div>

              {/* Savings Goal */}
              <Input
                label="Annual Savings Goal (KES) - Optional"
                type="number"
                placeholder="500000"
                value={formData.savingsGoal}
                onChange={(e) =>
                  setFormData({ ...formData, savingsGoal: e.target.value })
                }
                error={errors.savingsGoal}
              />

              {/* Save Button */}
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                isLoading={isLoading}
                icon={<Save size={16} />}
              >
                Save Chama Settings
              </Button>

              {/* Goal Planner Button */}
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => setIsGoalPlannerOpen(true)}
              >
                💡 Calculate Contribution with Goal Planner
              </Button>
            </form>
          </div>

          {/* Automation Toggles Section */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-6">Automation Settings</h2>

            <div className="space-y-6">
              {/* Auto Reminders Toggle */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-700">
                <div>
                  <h3 className="text-lg font-semibold text-white">Auto Reminders</h3>
                  <p className="text-sm text-slate-400">Automatically send contribution reminders</p>
                </div>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={autoSettings.auto_reminders_enabled}
                    onChange={(e) =>
                      setAutoSettings({
                        ...autoSettings,
                        auto_reminders_enabled: e.target.checked,
                      })
                    }
                    className="w-5 h-5 rounded"
                  />
                  <span className="text-sm font-medium text-slate-300">
                    {autoSettings.auto_reminders_enabled ? 'ON' : 'OFF'}
                  </span>
                </label>
              </div>

              {/* Auto Fines Toggle + Config */}
              <div className="pb-4 border-b border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Auto Fines</h3>
                    <p className="text-sm text-slate-400">Automatically apply fines for overdue contributions</p>
                  </div>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={autoSettings.auto_fines_enabled}
                      onChange={(e) =>
                        setAutoSettings({
                          ...autoSettings,
                          auto_fines_enabled: e.target.checked,
                        })
                      }
                      className="w-5 h-5 rounded"
                    />
                    <span className="text-sm font-medium text-slate-300">
                      {autoSettings.auto_fines_enabled ? 'ON' : 'OFF'}
                    </span>
                  </label>
                </div>

                {autoSettings.auto_fines_enabled && (
                  <div className="space-y-4 mt-4">
                    {/* Fine Type */}
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
                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-grove-accent"
                      >
                        <option value="fixed">Fixed Amount (KES)</option>
                        <option value="percentage">Percentage of Contribution</option>
                      </select>
                    </div>

                    {/* Fine Amount */}
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
                  </div>
                )}
              </div>

              {/* Save Button */}
              <Button
                variant="primary"
                icon={<Save size={16} />}
                isLoading={isSavingAuto}
                onClick={handleSaveAutomationSettings}
              >
                Save Automation Settings
              </Button>
            </div>
          </div>

          {/* Chama Details Section */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-6">Chama Details</h2>
            <div className="space-y-4">
              <div className="pb-4 border-b border-slate-700">
                <p className="text-slate-400 text-sm">Chama ID</p>
                <p className="text-white font-mono text-sm">{chama.id}</p>
              </div>
              <div className="pb-4 border-b border-slate-700">
                <p className="text-slate-400 text-sm">Invite Code</p>
                <p className="text-white font-mono text-sm">{chama.invite_code}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Created</p>
                <p className="text-white text-sm">
                  {new Date(chama.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Goal Planner Modal */}
          <GoalPlannerModal
            isOpen={isGoalPlannerOpen}
            onClose={() => setIsGoalPlannerOpen(false)}
            onCalculate={handleGoalPlannerSelect}
            currentAmount={chama?.contribution_amount || 0}
          />
        </div>
      </main>
    </div>
  );
}
