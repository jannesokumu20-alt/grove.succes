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
    <div className="min-h-screen bg-[#0B1120] pb-20">
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-white text-xl font-bold">Settings</h1>
      </div>

      <div className="space-y-4 px-4 mt-4">
        {/* Chama Information Section */}
        <div>
          <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Chama Information</h2>
          <div className="bg-[#111827] rounded-xl border border-[#1f2937] overflow-hidden">
            <form onSubmit={handleSaveSettings} className="p-4 space-y-4">
              {/* Chama Name */}
              <div className="flex justify-between items-center p-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <SettingsIcon size={20} className="text-gray-400" />
                  <span className="text-white text-sm">Chama Name</span>
                </div>
                <input
                  type="text"
                  placeholder="e.g., Kazi United"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="bg-transparent text-white text-right focus:outline-none"
                />
              </div>

              {/* Contribution Amount */}
              <div className="flex justify-between items-center p-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="text-gray-400">💰</span>
                  <span className="text-white text-sm">Monthly Contribution</span>
                </div>
                <input
                  type="number"
                  placeholder="5000"
                  value={formData.contributionAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, contributionAmount: e.target.value })
                  }
                  className="bg-transparent text-white text-right focus:outline-none"
                />
              </div>

              {/* Meeting Day */}
              <div className="flex justify-between items-center p-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="text-gray-400">📅</span>
                  <span className="text-white text-sm">Meeting Day</span>
                </div>
                <select
                  value={formData.meetingDay}
                  onChange={(e) =>
                    setFormData({ ...formData, meetingDay: e.target.value })
                  }
                  className="bg-transparent text-white text-right focus:outline-none"
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
              <div className="flex justify-between items-center p-4">
                <div className="flex items-center gap-3">
                  <span className="text-gray-400">🎯</span>
                  <span className="text-white text-sm">Annual Savings Goal</span>
                </div>
                <input
                  type="number"
                  placeholder="500000"
                  value={formData.savingsGoal}
                  onChange={(e) =>
                    setFormData({ ...formData, savingsGoal: e.target.value })
                  }
                  className="bg-transparent text-white text-right focus:outline-none"
                />
              </div>
            </form>
          </div>
        </div>

        {/* Automation Settings Section */}
        <div>
          <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Automation</h2>
          <div className="bg-[#111827] rounded-xl border border-[#1f2937] overflow-hidden">
            <div className="p-4 space-y-4">
              {/* Auto Reminders Toggle */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-gray-400">🔔</span>
                  <span className="text-white text-sm">Auto Reminders</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoSettings.auto_reminders_enabled}
                    onChange={(e) =>
                      setAutoSettings({
                        ...autoSettings,
                        auto_reminders_enabled: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                </label>
              </div>

              {/* Auto Fines Toggle */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-gray-400">⚠️</span>
                  <span className="text-white text-sm">Auto Fines</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoSettings.auto_fines_enabled}
                    onChange={(e) =>
                      setAutoSettings({
                        ...autoSettings,
                        auto_fines_enabled: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Account Section */}
        <div>
          <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Account</h2>
          <div className="bg-[#111827] rounded-xl border border-[#1f2937] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span className="text-gray-400">👤</span>
                <span className="text-white text-sm">Profile</span>
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <div className="flex justify-between items-center p-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span className="text-gray-400">🔐</span>
                <span className="text-white text-sm">Security</span>
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <div className="flex justify-between items-center p-4">
              <div className="flex items-center gap-3">
                <span className="text-gray-400">📊</span>
                <span className="text-white text-sm">Export Data</span>
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button className="mx-4 mt-6 w-full bg-red-900 text-red-400 rounded-xl py-3 border border-red-800 text-center font-medium">
          Sign Out
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
