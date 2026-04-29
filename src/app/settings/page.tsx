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
import { Save } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const chama = useChamaStore((state) => state.chama);
  const updateChamaStore = useChamaStore((state) => state.updateChama);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoalPlannerOpen, setIsGoalPlannerOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contributionAmount: '',
    meetingDay: 'Monday',
    savingsGoal: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (chama) {
      setFormData({
        name: chama?.name || '',
        contributionAmount: (chama?.contribution_amount || 0)?.toString() || '0',
        meetingDay: chama?.meeting_day || 'Monday',
        savingsGoal: (chama?.savings_goal || 0)?.toString() || '0',
      });
    }
  }, [chama]);

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
        contributionAmount: amount.toString(),
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

      <main className="md:ml-64 md:pt-20 pt-0 pb-20 md:pb-0 px-4 md:px-6 py-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
            <p className="text-slate-400">Manage your chama settings</p>
          </div>

          {/* Settings Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-8">
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
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-grove-accent"
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
                Save Settings
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

          {/* Chama Info */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 mt-8">
            <h2 className="text-lg font-semibold text-white mb-6">Chama Information</h2>
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
