'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import BottomNav from '@/components/BottomNav';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Modal from '@/components/Modal';
import Table from '@/components/Table';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { useChamaStore } from '@/store/useChamaStore';
import {
  getMembers,
  getContributions,
  recordContribution,
  getContributionsByMonthYear,
} from '@/lib/supabase';
import {
  getAllMemberWallets,
  getTopContributors,
  getDefaulters,
  getMonthlyStats,
  formatCurrency,
  getStatusColor,
} from '@/lib/walletFunctions';
import { formatCurrency as formatCur, formatDate, getMonthName } from '@/lib/utils';
import { Plus, TrendingUp, AlertCircle, Wallet } from 'lucide-react';

export default function ContributionsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const chama = useChamaStore((state) => state.chama);
  
  // Main data states
  const [contributions, setContributions] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [topContributors, setTopContributors] = useState<any[]>([]);
  const [defaulters, setDefaulters] = useState<any[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'insights'>('overview');
  
  const [formData, setFormData] = useState({
    memberId: '',
    amount: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    note: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadData = async () => {
      if (!chama || !user) {
        router.push('/dashboard');
        return;
      }

      try {
        // Load all data in parallel
        const [membersData, contributionsData, walletsData, topContribsData, defaultersData, monthlyStatsData] = await Promise.all([
          getMembers(chama.id),
          getContributions(chama.id),
          getAllMemberWallets(chama.id),
          getTopContributors(chama.id, 5),
          getDefaulters(chama.id),
          getMonthlyStats(chama.id, 12),
        ]);

        setMembers(membersData);
        setContributions(contributionsData);
        setWallets(walletsData || []);
        setTopContributors(topContribsData || []);
        setDefaulters(defaultersData || []);
        setMonthlyStats(monthlyStatsData || []);

        // Calculate monthly total
        const monthlyData = await getContributionsByMonthYear(
          chama.id,
          selectedMonth,
          selectedYear
        );
        const total = monthlyData.reduce((sum, c) => sum + (c.amount || 0), 0);
        setMonthlyTotal(total);
      } catch (error: any) {
        console.error('Error loading data:', error);
        toast.error(error.message || 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [chama, user, router, toast, selectedMonth, selectedYear]);

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
      const [contributionsData, walletsData, topContribsData, defaultersData] = await Promise.all([
        getContributions(chama.id),
        getAllMemberWallets(chama.id),
        getTopContributors(chama.id, 5),
        getDefaulters(chama.id),
      ]);

      setContributions(contributionsData);
      setWallets(walletsData || []);
      setTopContributors(topContribsData || []);
      setDefaulters(defaultersData || []);

      // Reload monthly total
      const monthlyData = await getContributionsByMonthYear(
        chama.id,
        selectedMonth,
        selectedYear
      );
      const total = monthlyData.reduce((sum, c) => sum + (c.amount || 0), 0);
      setMonthlyTotal(total);
    } catch (error: any) {
      toast.error(error.message || 'Failed to record contribution');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredContributions = contributions.filter(
    (c) => c.month === selectedMonth && c.year === selectedYear
  );

  const totalWalletBalance = wallets.reduce((sum, w: any) => sum + (w.balance || 0), 0);
  const totalContributed = wallets.reduce((sum, w: any) => sum + (w.total_contributed || 0), 0);
  const totalBorrowed = wallets.reduce((sum, w: any) => sum + (w.total_borrowed || 0), 0);

  return (
    <div className="min-h-screen bg-grove-dark">
      <Navbar />
      <Sidebar />
      <BottomNav />

      <main className="flex-1 md:ml-64 min-h-screen bg-slate-900 p-6 pt-[70px] md:pt-6 pb-20 md:pb-0">
        <div className="w-full max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Contributions</h1>
              <p className="text-slate-400">Track member contributions and wallet balances</p>
            </div>
            <Button
              variant="primary"
              onClick={() => setIsModalOpen(true)}
              icon={<Plus size={16} />}
            >
              Record Contribution
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <p className="text-slate-400 text-sm mb-1">Total Wallet Balance</p>
              <p className="text-xl font-bold text-green-400">{formatCurrency(totalWalletBalance)}</p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <p className="text-slate-400 text-sm mb-1">Total Contributed</p>
              <p className="text-xl font-bold text-blue-400">{formatCurrency(totalContributed)}</p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <p className="text-slate-400 text-sm mb-1">Total Borrowed</p>
              <p className="text-xl font-bold text-orange-400">{formatCurrency(totalBorrowed)}</p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <p className="text-slate-400 text-sm mb-1">Active Members</p>
              <p className="text-xl font-bold text-white">{members.length}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-8 border-b border-slate-700">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 font-medium transition ${
                activeTab === 'overview'
                  ? 'text-grove-accent border-b-2 border-grove-accent'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`px-4 py-2 font-medium transition ${
                activeTab === 'members'
                  ? 'text-grove-accent border-b-2 border-grove-accent'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Member Wallets
            </button>
            <button
              onClick={() => setActiveTab('insights')}
              className={`px-4 py-2 font-medium transition ${
                activeTab === 'insights'
                  ? 'text-grove-accent border-b-2 border-grove-accent'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Insights
            </button>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              {/* Month Selector */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Month</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-grove-accent"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                      <option key={month} value={month}>
                        {getMonthName(month)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Year</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-grove-accent"
                  >
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Monthly Summary */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-slate-400 text-sm">Selected Month</p>
                    <p className="text-white font-semibold text-lg">
                      {getMonthName(selectedMonth)} {selectedYear}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">This Month Total</p>
                    <p className="text-green-400 font-semibold text-lg">
                      {formatCur(monthlyTotal)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Total Records</p>
                    <p className="text-blue-400 font-semibold text-lg">
                      {filteredContributions.length}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contributions Table */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Contributions</h2>
                <Table
                  columns={[
                    { key: 'members', label: 'Member', render: (_, row) => row.members?.name },
                    { key: 'amount', label: 'Amount', render: (val) => formatCur(val) },
                    { key: 'month', label: 'Month', render: (val) => getMonthName(val) },
                    { key: 'year', label: 'Year' },
                    { key: 'created_at', label: 'Date', render: (val) => formatDate(val) },
                  ]}
                  data={filteredContributions}
                  isLoading={isLoading}
                  isEmpty={filteredContributions.length === 0}
                  emptyMessage="No contributions for this month"
                />
              </div>
            </>
          )}

          {/* Member Wallets Tab */}
          {activeTab === 'members' && (
            <>
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Wallet size={20} />
                  Member Wallets
                </h2>
                <Table
                  columns={[
                    { 
                      key: 'members', 
                      label: 'Member', 
                      render: (_, row) => row.members?.name 
                    },
                    { 
                      key: 'balance', 
                      label: 'Balance', 
                      render: (val) => (
                        <span className={val >= 0 ? 'text-green-400' : 'text-red-400'}>
                          {formatCurrency(val)}
                        </span>
                      )
                    },
                    { 
                      key: 'total_contributed', 
                      label: 'Contributed', 
                      render: (val) => formatCurrency(val) 
                    },
                    { 
                      key: 'total_borrowed', 
                      label: 'Borrowed', 
                      render: (val) => formatCurrency(val) 
                    },
                    { 
                      key: 'missed_contributions', 
                      label: 'Missed', 
                      render: (val) => (
                        <span className={val > 0 ? 'text-red-400' : 'text-green-400'}>
                          {val}
                        </span>
                      )
                    },
                    { 
                      key: 'last_contribution_date', 
                      label: 'Last Contribution', 
                      render: (val) => (val ? formatDate(val) : 'Never')
                    },
                  ]}
                  data={wallets}
                  isLoading={isLoading}
                  isEmpty={wallets.length === 0}
                  emptyMessage="No wallet records"
                />
              </div>
            </>
          )}

          {/* Insights Tab */}
          {activeTab === 'insights' && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Top Contributors */}
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <TrendingUp size={20} className="text-green-400" />
                    Top Contributors
                  </h2>
                  <div className="space-y-4">
                    {topContributors.length > 0 ? (
                      topContributors.map((contributor, idx) => (
                        <div key={contributor.member_id} className="flex items-center justify-between pb-4 border-b border-slate-700">
                          <div>
                            <p className="text-white font-medium">#{idx + 1} {contributor.member_name}</p>
                            <p className="text-sm text-slate-400">{contributor.contribution_count} contributions</p>
                          </div>
                          <p className="text-green-400 font-semibold text-lg">
                            {formatCurrency(contributor.total_amount)}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-400">No contributions yet</p>
                    )}
                  </div>
                </div>

                {/* Defaulters */}
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <AlertCircle size={20} className="text-red-400" />
                    Defaulters
                  </h2>
                  <div className="space-y-4">
                    {defaulters.length > 0 ? (
                      defaulters.map((defaulter) => (
                        <div key={defaulter.member_id} className="flex items-center justify-between pb-4 border-b border-slate-700">
                          <div>
                            <p className="text-white font-medium">{defaulter.member_name}</p>
                            <p className="text-sm text-red-400">{defaulter.missed_count} missed contributions</p>
                          </div>
                          <p className={`font-semibold text-lg ${defaulter.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {formatCurrency(defaulter.balance)}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-400 text-center py-4">No defaulters - Great! 🎉</p>
                    )}
                  </div>
                </div>

                {/* Monthly Trends */}
                <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-white mb-4">Monthly Trends</h2>
                  <Table
                    columns={[
                      { 
                        key: 'month', 
                        label: 'Month',
                        render: (val, row) => `${getMonthName(val)} ${row.year}`
                      },
                      { 
                        key: 'total_expected', 
                        label: 'Expected', 
                        render: (val) => formatCurrency(val) 
                      },
                      { 
                        key: 'total_collected', 
                        label: 'Collected', 
                        render: (val) => formatCurrency(val) 
                      },
                      { 
                        key: 'completion_rate', 
                        label: 'Rate',
                        render: (val) => (
                          <span className={val >= 80 ? 'text-green-400' : val >= 50 ? 'text-yellow-400' : 'text-red-400'}>
                            {val}%
                          </span>
                        )
                      },
                      { 
                        key: 'member_paid_count', 
                        label: 'Members Paid' 
                      },
                    ]}
                    data={monthlyStats}
                    isLoading={isLoading}
                    isEmpty={monthlyStats.length === 0}
                    emptyMessage="No monthly data"
                  />
                </div>
              </div>
            </>
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
              <label className="block text-sm font-medium text-slate-300 mb-2">Member</label>
              <select
                value={formData.memberId}
                onChange={(e) =>
                  setFormData({ ...formData, memberId: e.target.value })
                }
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-grove-accent"
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
                <label className="block text-sm font-medium text-slate-300 mb-2">Month</label>
                <select
                  value={formData.month}
                  onChange={(e) =>
                    setFormData({ ...formData, month: parseInt(e.target.value) })
                  }
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-grove-accent"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <option key={month} value={month}>
                      {getMonthName(month)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Year</label>
                <select
                  value={formData.year}
                  onChange={(e) =>
                    setFormData({ ...formData, year: parseInt(e.target.value) })
                  }
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-grove-accent"
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
              label="Note (Optional)"
              placeholder="Any notes..."
              value={formData.note}
              onChange={(e) =>
                setFormData({ ...formData, note: e.target.value })
              }
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
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
