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
    <div className="min-h-screen bg-[#0B1120] pb-20">
      <div className="px-4 pt-4 pb-2">
        <div className="flex justify-between items-center">
          <h1 className="text-white text-xl font-bold">Contributions</h1>
          {role !== 'member' && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-green-500 text-white rounded-xl px-4 py-2 text-sm flex items-center gap-1"
            >
              <Plus size={16} />
              Record
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 px-4 mt-4">
        <div className="bg-[#111827] rounded-xl p-3 border border-[#1f2937]">
          <p className="text-gray-400 text-xs">Total All Time</p>
          <p className="text-white font-bold text-lg">{formatCur(allTimeTotal)}</p>
        </div>
        <div className="bg-[#111827] rounded-xl p-3 border border-[#1f2937]">
          <p className="text-gray-400 text-xs">This Month</p>
          <p className="text-white font-bold text-lg">{formatCur(thisMonthTotal)}</p>
        </div>
        <div className="bg-[#111827] rounded-xl p-3 border border-[#1f2937]">
          <p className="text-gray-400 text-xs">This Year</p>
          <p className="text-white font-bold text-lg">{formatCur(thisYearTotal)}</p>
        </div>
      </div>

      <div className="flex gap-2 px-4 mt-3 overflow-x-auto">
        {['all', 'this-month', 'this-year'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as typeof activeTab)}
            className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap ${
              activeTab === tab
                ? 'bg-green-500 text-white'
                : 'border border-slate-600 text-gray-400'
            }`}
          >
            {tab === 'all' && 'All Time'}
            {tab === 'this-month' && 'This Month'}
            {tab === 'this-year' && 'This Year'}
          </button>
        ))}
      </div>

      <div className="px-4 mt-4 space-y-2">
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Loading contributions...</p>
          </div>
        ) : filteredContributions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No contributions found</p>
          </div>
        ) : (
          filteredContributions.map((contrib) => (
            <div
              key={contrib.id}
              className="bg-[#111827] rounded-xl p-4 border border-[#1f2937] flex justify-between items-center"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-white text-sm font-medium">
                  {contrib.members?.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{contrib.members?.name || 'Unknown'}</p>
                  <p className="text-gray-400 text-xs">{formatDate(contrib.created_at)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-green-400 font-bold">{formatCur(contrib.amount)}</p>
                <span className={`rounded-full px-2 py-0.5 text-xs ${
                  contrib.payment_method === 'mpesa' 
                    ? 'bg-blue-900 text-blue-300' 
                    : 'bg-orange-900 text-orange-300'
                }`}>
                  {contrib.payment_method || 'Cash'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <BottomNav />

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
              className="w-full bg-[#1a2535] text-white border border-slate-700 rounded-xl py-3 px-4 focus:outline-none focus:border-green-500"
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
                className="w-full bg-[#1a2535] text-white border border-slate-700 rounded-xl py-3 px-4 focus:outline-none focus:border-green-500"
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
                className="w-full bg-[#1a2535] text-white border border-slate-700 rounded-xl py-3 px-4 focus:outline-none focus:border-green-500"
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
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl py-4"
            isLoading={isSubmitting}
          >
            Record Contribution
          </Button>
        </form>
      </Modal>
    </div>
  );
}

