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
import { useRBAC } from '@/hooks/useRBAC';
import { useToast } from '@/hooks/useToast';
import { useChamaStore } from '@/store/useChamaStore';
import {
  getMembers,
  getContributions,
  recordContribution,
  getContributionsByMonthYear,
} from '@/lib/supabase';
import { formatCurrency as formatCur, formatDate, getMonthName } from '@/lib/utils';
import { Plus, TrendingUp, AlertCircle, Wallet } from 'lucide-react';

export default function ContributionsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { role, isLoading: rbacLoading } = useRBAC();
  const toast = useToast();
  const chama = useChamaStore((state) => state.chama);

  const [contributions, setContributions] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState<'all' | 'this-month' | 'this-year'>('all');

  const [formData, setFormData] = useState({
    memberId: '',
    amount: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    note: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (rbacLoading) return;

    const loadData = async () => {
      if (!chama || !user) {
        router.push('/dashboard');
        return;
      }

      try {
        const membersData = await getMembers(chama.id);
        const contributionsData = await getContributions(chama.id);

        setMembers(membersData);
        setContributions(contributionsData);
      } catch (error: any) {
        console.error('Error loading data:', error);
        toast.error(error.message || 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [chama, user, router, toast, rbacLoading]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.memberId) {
      newErrors.memberId = 'Member is required';
    }

    if (!formData.amount) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(parseFloat(formData.amount))) {
      newErrors.amount = 'Must be a valid number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRecordContribution = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !chama || !user) return;

    setIsSubmitting(true);

    try {
      await recordContribution(
        chama.id,
        formData.memberId,
        parseFloat(formData.amount),
        formData.month,
        formData.year,
        user.id,
        formData.note
      );

      setFormData({
        memberId: '',
        amount: '',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        note: '',
      });
      setIsModalOpen(false);
      toast.success('Contribution recorded successfully!');

      // Reload data
      const contributionsData = await getContributions(chama.id);
      setContributions(contributionsData);
    } catch (error: any) {
      toast.error(error.message || 'Failed to record contribution');
    } finally {
      setIsSubmitting(false);
    }
  };

  const now = new Date();
  const filteredContributions = contributions.filter((c) => {
    if (activeTab === 'this-month') {
      return c.month === now.getMonth() + 1 && c.year === now.getFullYear();
    }
    if (activeTab === 'this-year') {
      return c.year === now.getFullYear();
    }
    return true;
  });

  const allTimeTotal = contributions.reduce((sum, c) => sum + (c.amount || 0), 0);
  const thisMonthContribs = contributions.filter(
    (c) => c.month === now.getMonth() + 1 && c.year === now.getFullYear()
  );
  const thisMonthTotal = thisMonthContribs.reduce((sum, c) => sum + (c.amount || 0), 0);
  const thisYearContribs = contributions.filter((c) => c.year === now.getFullYear());
  const thisYearTotal = thisYearContribs.reduce((sum, c) => sum + (c.amount || 0), 0);

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <Sidebar />
      <BottomNav />

      <main className="flex-1 md:ml-64 min-h-screen bg-slate-950 pt-[70px] md:pt-6 pb-24 md:pb-6">
        <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Contributions</h1>
                <p className="text-slate-400">Track and record member contributions</p>
              </div>
              {role !== 'member' && (
                <Button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2"
                >
                  <Plus size={20} />
                  <span className="hidden md:inline">Record</span>
                </Button>
              )}
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Total All Time</p>
              <p className="text-3xl font-bold text-emerald-400 mt-2">{formatCur(allTimeTotal)}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">This Month</p>
              <p className="text-3xl font-bold text-blue-400 mt-2">{formatCur(thisMonthTotal)}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">This Year</p>
              <p className="text-3xl font-bold text-orange-400 mt-2">{formatCur(thisYearTotal)}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-8 flex gap-2">
            {['all', 'this-month', 'this-year'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as typeof activeTab)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  activeTab === tab
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-emerald-600'
                }`}
              >
                {tab === 'all' && 'All Time'}
                {tab === 'this-month' && 'This Month'}
                {tab === 'this-year' && 'This Year'}
              </button>
            ))}
          </div>

          {/* Contributions List */}
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-slate-400">Loading contributions...</p>
            </div>
          ) : filteredContributions.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-12 text-center">
              <p className="text-slate-400 mb-4">No contributions found</p>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-800/50">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Member</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Month/Year</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredContributions.map((contrib) => (
                      <tr key={contrib.id} className="hover:bg-slate-800/50 transition">
                        <td className="px-6 py-4 text-white font-medium">{contrib.members?.name || 'Unknown'}</td>
                        <td className="px-6 py-4 text-emerald-400 font-semibold">{formatCur(contrib.amount)}</td>
                        <td className="px-6 py-4 text-slate-400">{getMonthName(contrib.month)} {contrib.year}</td>
                        <td className="px-6 py-4 text-slate-400 text-sm">{formatDate(contrib.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Record Contribution Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Record Contribution"
        >
          <form onSubmit={handleRecordContribution} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Member</label>
              <select
                value={formData.memberId}
                onChange={(e) =>
                  setFormData({ ...formData, memberId: e.target.value })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-600"
              >
                <option value="">Select a member</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
              {errors.memberId && (
                <p className="text-red-400 text-sm mt-1">{errors.memberId}</p>
              )}
            </div>

            <Input
              label="Amount (KES)"
              type="number"
              placeholder="5000"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              error={errors.amount}
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Month</label>
                <select
                  value={formData.month}
                  onChange={(e) =>
                    setFormData({ ...formData, month: parseInt(e.target.value) })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-600"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <option key={month} value={month}>
                      {getMonthName(month)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Year</label>
                <select
                  value={formData.year}
                  onChange={(e) =>
                    setFormData({ ...formData, year: parseInt(e.target.value) })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-600"
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Input
              label="Note (optional)"
              placeholder="Add a note..."
              value={formData.note}
              onChange={(e) =>
                setFormData({ ...formData, note: e.target.value })
              }
            />

            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 rounded-lg"
              isLoading={isSubmitting}
            >
              Record Contribution
            </Button>
          </form>
        </Modal>
      </main>
    </div>
  );
}

