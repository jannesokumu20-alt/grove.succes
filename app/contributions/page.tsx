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
  const [menuOpen, setMenuOpen] = useState(false);
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
    <div style={{ background: 'linear-gradient(135deg, #0A0F1C 0%, #05070F 100%)', minHeight: '100vh', position: 'relative' }}>
      {/* Subtle radial glow */}
      <div style={{ position: 'fixed', top: '-50%', left: '50%', transform: 'translateX(-50%)', width: '100%', height: '100%', background: 'radial-gradient(circle at center, rgba(0,255,178,0.05) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <Navbar />
      <Sidebar />
      <BottomNav />

      <main className="flex-1 md:ml-64 min-h-screen pt-[90px] md:pt-6 pb-[140px] md:pb-6 relative z-10 overflow-x-hidden">
        <div className="min-h-screen overflow-x-hidden md:px-6 md:py-6" style={{ width: '100%', maxWidth: '1280px', marginLeft: 'auto', marginRight: 'auto', paddingLeft: '16px', paddingRight: '16px', paddingTop: '24px' }}>

          {/* ===== HEADER ===== */}
          <div className="sticky top-0 z-40 bg-[#0B1220]/90 backdrop-blur-lg border-b border-white/10">
            <div className="flex items-center justify-between px-4 py-4">
              <div>
                <h1 className="text-2xl font-bold">Contributions</h1>
                <p className="text-gray-400 text-sm">
                  Track and manage contributions
                </p>
              </div>

              {/* RECORD BUTTON */}
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl 
                           bg-gradient-to-r from-green-500 to-emerald-600 
                           text-black font-semibold shadow-lg shadow-green-500/30
                           active:scale-95 transition"
              >
                <span className="text-lg">+</span>
                <span>Record</span>
              </button>
            </div>
          </div>

          {/* ===== SUMMARY CARDS ===== */}
          <div className="grid grid-cols-2 gap-4 px-4 mt-5">

            {/* TOTAL */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500/10 to-green-700/10 border border-green-500/20">
              <p className="text-gray-400 text-sm">Total All Time</p>
              <h2 className="text-xl font-bold mt-2">{formatCur(allTimeTotal)}</h2>
            </div>

            {/* MONTH */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-700/10 border border-blue-500/20">
              <p className="text-gray-400 text-sm">This Month</p>
              <h2 className="text-xl font-bold mt-2">{formatCur(thisMonthTotal)}</h2>
            </div>

            {/* YEAR */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-700/10 border border-purple-500/20 col-span-2">
              <p className="text-gray-400 text-sm">This Year</p>
              <h2 className="text-xl font-bold mt-2">{formatCur(thisYearTotal)}</h2>
            </div>

          </div>

          {/* ===== FILTER TABS ===== */}
          <div className="flex gap-3 px-4 mt-5">
            {['all', 'this-month', 'this-year'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as typeof activeTab)}
                className={`px-5 py-2 rounded-full font-semibold shadow-lg transition ${
                  activeTab === tab
                    ? 'bg-green-500 text-black shadow-green-500/30'
                    : 'border border-white/20 text-white'
                }`}
              >
                {tab === 'all' && 'All Time'}
                {tab === 'this-month' && 'This Month'}
                {tab === 'this-year' && 'This Year'}
              </button>
            ))}
          </div>

          {/* ===== GRAPH (UI ONLY) ===== */}
          <div className="mx-4 mt-6 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <p className="text-gray-400 text-sm mb-3">Contribution Trend</p>

            <div className="h-40 flex items-end gap-2">
              {[20, 40, 30, 60, 50, 80, 40].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 bg-gradient-to-t from-green-500 to-emerald-400 rounded-lg"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>

          {/* ===== CONTRIBUTIONS LIST OR EMPTY STATE ===== */}
          {isLoading ? (
            <div className="mx-4 mt-6 p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
              <p className="text-gray-400">Loading contributions...</p>
            </div>
          ) : filteredContributions.length === 0 ? (
            <div className="mx-4 mt-6 p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
              <p className="text-gray-400 mb-4">No contributions found</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-6 py-3 rounded-xl bg-green-500 text-black font-semibold shadow-lg shadow-green-500/30"
              >
                Add First Contribution
              </button>
            </div>
          ) : (
            <div className="mx-4 mt-6 space-y-3">
              {filteredContributions.map((contrib) => (
                <div
                  key={contrib.id}
                  className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex justify-between items-center"
                >
                  <div>
                    <p className="text-white font-semibold">{contrib.members?.name || 'Unknown'}</p>
                    <p className="text-gray-400 text-sm">{formatDate(contrib.created_at)}</p>
                  </div>
                  <p className="text-green-400 font-bold">{formatCur(contrib.amount)}</p>
                </div>
              ))}
            </div>
          )}

          {/* ===== FLOATING ACTION BUTTON ===== */}
          <div className="fixed bottom-24 right-4 z-50 flex flex-col items-end gap-3">

            {menuOpen && (
              <>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-3 bg-green-500 text-black px-4 py-3 rounded-full shadow-lg shadow-green-500/40"
                >
                  ➕ <span>Record Contribution</span>
                </button>

                <button
                  onClick={() => toast.custom('Add member feature coming soon')}
                  className="flex items-center gap-3 bg-blue-500 text-white px-4 py-3 rounded-full shadow-lg"
                >
                  👥 <span>Add Member</span>
                </button>

                <button
                  onClick={() => toast.custom('Add loan feature coming soon')}
                  className="flex items-center gap-3 bg-purple-500 text-white px-4 py-3 rounded-full shadow-lg"
                >
                  💰 <span>Add Loan</span>
                </button>

                <button
                  onClick={() => toast.custom('Add fine feature coming soon')}
                  className="flex items-center gap-3 bg-red-500 text-white px-4 py-3 rounded-full shadow-lg"
                >
                  ⚠️ <span>Add Fine</span>
                </button>
              </>
            )}

            {/* MAIN + BUTTON */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-14 h-14 flex items-center justify-center rounded-full 
                         bg-gradient-to-r from-green-500 to-emerald-600 
                         text-black text-2xl shadow-lg shadow-green-500/40"
            >
              {menuOpen ? "×" : "+"}
            </button>
          </div>

          {/* ===== RECORD CONTRIBUTION MODAL ===== */}
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
                className="w-full bg-green-500 hover:bg-green-600 text-black font-semibold rounded-xl py-4"
                isLoading={isSubmitting}
              >
                Record Contribution
              </Button>
            </form>
          </Modal>

        </div>
      </main>
    </div>
  );
}
