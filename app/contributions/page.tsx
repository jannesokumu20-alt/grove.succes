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
import { formatCurrency, formatDate, getMonthName } from '@/lib/utils';
import { Plus } from 'lucide-react';

export default function ContributionsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const chama = useChamaStore((state) => state.chama);
  const [contributions, setContributions] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthlyTotal, setMonthlyTotal] = useState(0);
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
        const membersData = await getMembers(chama.id);
        setMembers(membersData);

        const contributionsData = await getContributions(chama.id);
        setContributions(contributionsData);

        // Calculate monthly total
        const monthlyData = await getContributionsByMonthYear(
          chama.id,
          selectedMonth,
          selectedYear
        );
        const total = monthlyData.reduce(
          (sum, c) => sum + (c.amount || 0),
          0
        );
        setMonthlyTotal(total);
      } catch (error: any) {
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
      const newContribution = await recordContribution(
        chama.id,
        formData.memberId,
        parseFloat(formData.amount),
        formData.month,
        formData.year,
        user.id,
        formData.note
      );

      setContributions([newContribution, ...contributions]);
      setFormData({
        memberId: '',
        amount: '',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        note: '',
      });
      setIsModalOpen(false);
      toast.success('Contribution recorded successfully!');

      // Reload monthly total
      const monthlyData = await getContributionsByMonthYear(
        chama.id,
        selectedMonth,
        selectedYear
      );
      const total = monthlyData.reduce(
        (sum, c) => sum + (c.amount || 0),
        0
      );
      setMonthlyTotal(total);
    } catch (error: any) {
      toast.error(error.message || 'Failed to record contribution');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredContributions = contributions.filter((c) =>
    c.month === selectedMonth && c.year === selectedYear
  );

  return (
    <div className="min-h-screen bg-grove-dark">
      <Navbar />
      <Sidebar />
      <BottomNav />

      <main className="md:ml-64 md:pt-20 pt-0 pb-20 md:pb-0 px-4 md:px-6 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Contributions</h1>
              <p className="text-slate-400">Track member contributions</p>
            </div>
            <Button
              variant="primary"
              onClick={() => setIsModalOpen(true)}
              icon={<Plus size={16} />}
            >
              Record Contribution
            </Button>
          </div>

          {/* Summary */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-slate-400 text-sm">Month</p>
                <p className="text-white font-semibold text-lg">
                  {getMonthName(selectedMonth)} {selectedYear}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">This Month Total</p>
                <p className="text-green-400 font-semibold text-lg">
                  {formatCurrency(monthlyTotal)}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Total Contributions</p>
                <p className="text-blue-400 font-semibold text-lg">
                  {contributions.length}
                </p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Month
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-grove-accent"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                  <option key={month} value={month}>
                    {getMonthName(month)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-grove-accent"
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Contributions Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <Table
              columns={[
                { key: 'members', label: 'Member', render: (_, row) => row.members?.name },
                { key: 'amount', label: 'Amount', render: (val) => formatCurrency(val) },
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
        </div>

        {/* Record Contribution Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Record Contribution"
        >
          <form onSubmit={handleRecordContribution} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Member
              </label>
              <select
                value={formData.memberId}
                onChange={(e) =>
                  setFormData({ ...formData, memberId: e.target.value })
                }
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-grove-accent"
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
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Month
                </label>
                <select
                  value={formData.month}
                  onChange={(e) =>
                    setFormData({ ...formData, month: parseInt(e.target.value) })
                  }
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-grove-accent"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <option key={month} value={month}>
                      {getMonthName(month)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Year
                </label>
                <select
                  value={formData.year}
                  onChange={(e) =>
                    setFormData({ ...formData, year: parseInt(e.target.value) })
                  }
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-grove-accent"
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
