'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import BottomNav from '@/components/BottomNav';
import Button from '@/components/Button';
import SummaryCard from '@/components/SummaryCard';
import Table from '@/components/Table';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { useChamaStore } from '@/store/useChamaStore';
import { getChamaStats, getContributions, getLoans, getMembers } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import { Download } from 'lucide-react';

export default function ReportsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const chama = useChamaStore((state) => state.chama);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSavings: 0,
    activeLoanBalance: 0,
    activeLoanCount: 0,
    memberCount: 0,
    thisMonthTotal: 0,
  });
  const [reportData, setReportData] = useState({
    contributions: 0,
    loans: 0,
    repayments: 0,
    membersNotContributed: 0,
  });

  useEffect(() => {
    const loadReports = async () => {
      if (!chama || !user) {
        router.push('/dashboard');
        return;
      }

      try {
        const chamaStats = await getChamaStats(chama.id);
        setStats(chamaStats);

        const contributions = await getContributions(chama.id);
        const loans = await getLoans(chama.id);
        const members = await getMembers(chama.id);

        const now = new Date();
        const thisMonthContributions = contributions.filter(
          (c) => c.month === now.getMonth() + 1 && c.year === now.getFullYear()
        );
        const contributorsThisMonth = new Set(
          thisMonthContributions.map((c) => c.member_id)
        );
        const membersNotContributed = members.filter(
          (m) => !contributorsThisMonth.has(m.id)
        ).length;

        const loanRepayments = loans.filter((l) => l.status === 'paid').length;

        setReportData({
          contributions: contributions.length,
          loans: loans.length,
          repayments: loanRepayments,
          membersNotContributed,
        });
      } catch (error: any) {
        toast.error(error.message || 'Failed to load reports');
      } finally {
        setIsLoading(false);
      }
    };

    loadReports();
  }, [chama, user, router, toast]);

  const handleExportPDF = () => {
    toast.success('PDF export feature coming soon!');
  };

  const handleExportExcel = () => {
    toast.success('Excel export feature coming soon!');
  };

  return (
    <div className="min-h-screen bg-[#0B1120] pb-20">
      <div className="px-4 pt-4 pb-2">
        <div className="flex justify-between items-center">
          <h1 className="text-white text-xl font-bold">Reports</h1>
          <button className="text-gray-400">
            <Download size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 px-4 mt-4">
        <div className="bg-[#111827] rounded-xl p-4 border border-[#1f2937] flex flex-col items-center gap-2 text-center">
          <div className="w-12 h-12 rounded-xl bg-emerald-900 bg-opacity-20 flex items-center justify-center mb-1">
            <span className="text-2xl">💰</span>
          </div>
          <span className="text-white text-sm font-medium">Total Savings</span>
          <span className="text-gray-400 text-xs">{formatCurrency(stats.totalSavings)}</span>
        </div>

        <div className="bg-[#111827] rounded-xl p-4 border border-[#1f2937] flex flex-col items-center gap-2 text-center">
          <div className="w-12 h-12 rounded-xl bg-red-900 bg-opacity-20 flex items-center justify-center mb-1">
            <span className="text-2xl">🏦</span>
          </div>
          <span className="text-white text-sm font-medium">Outstanding Loans</span>
          <span className="text-gray-400 text-xs">{formatCurrency(stats.activeLoanBalance)}</span>
        </div>

        <div className="bg-[#111827] rounded-xl p-4 border border-[#1f2937] flex flex-col items-center gap-2 text-center">
          <div className="w-12 h-12 rounded-xl bg-blue-900 bg-opacity-20 flex items-center justify-center mb-1">
            <span className="text-2xl">👥</span>
          </div>
          <span className="text-white text-sm font-medium">Total Members</span>
          <span className="text-gray-400 text-xs">{stats.memberCount}</span>
        </div>

        <div className="bg-[#111827] rounded-xl p-4 border border-[#1f2937] flex flex-col items-center gap-2 text-center">
          <div className="w-12 h-12 rounded-xl bg-purple-900 bg-opacity-20 flex items-center justify-center mb-1">
            <span className="text-2xl">📊</span>
          </div>
          <span className="text-white text-sm font-medium">This Month</span>
          <span className="text-gray-400 text-xs">{formatCurrency(stats.thisMonthTotal)}</span>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
