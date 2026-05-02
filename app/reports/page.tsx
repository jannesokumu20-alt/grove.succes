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
    <div className="min-h-screen bg-gradient-to-b from-[#0B1220] to-[#05070D]">
      <Navbar />
      <Sidebar />
      <BottomNav />

      <main className="flex-1 md:ml-64 min-h-screen bg-gradient-to-b from-[#0B1220] to-[#05070D] pt-[70px] md:pt-6 pb-24 md:pb-6 relative z-10">
        <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Reports</h1>
              <p className="text-[#AEB6C2]">Monthly summary and analytics</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={handleExportPDF}
                icon={<Download size={16} />}
              >
                Export PDF
              </Button>
              <Button
                variant="secondary"
                onClick={handleExportExcel}
                icon={<Download size={16} />}
              >
                Export Excel
              </Button>
            </div>
          </div>

          {/* Main Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Savings', value: stats.totalSavings, icon: '💰', color: '#00D084', bgColor: '#0C1A14', glowColor: '#00D084' },
              { label: 'Outstanding Loans', value: stats.activeLoanBalance, icon: '🏦', color: '#EF4444', bgColor: '#1F0F0F', glowColor: '#EF4444' },
              { label: 'Total Members', value: stats.memberCount, icon: '👥', color: '#3B82F6', bgColor: '#0C1620', glowColor: '#3B82F6' },
              { label: 'This Month', value: stats.thisMonthTotal, icon: '📊', color: '#A855F7', bgColor: '#140A1F', glowColor: '#A855F7' },
            ].map((stat, i) => (
              <div
                key={i}
                className="rounded-[14px] px-4 py-5 flex flex-col justify-between h-[110px] transition-all hover:scale-105"
                style={{
                  background: stat.bgColor,
                  border: `2px solid ${stat.color}`,
                  boxShadow: `0 0 50px ${stat.glowColor}70, 0 0 100px ${stat.glowColor}30, inset 0 1px 2px rgba(255,255,255,0.1)`,
                }}
              >
                <div>
                  <p className="text-[#AEB6C2] text-xs font-bold tracking-widest uppercase">{stat.label}</p>
                  <p className="text-2xl font-bold text-white mt-2" style={{
                    textShadow: `0 0 20px ${stat.glowColor}c0`
                  }}>
                    {typeof stat.value === 'number' && stat.value > 100 ? formatCurrency(stat.value) : stat.value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Report Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Contribution Report */}
            <div className="rounded-[16px] p-6" style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
            }}>
              <h2 className="text-lg font-semibold text-white mb-4">
                Contribution Summary
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-white/10">
                  <span className="text-[#6B7280]">Total Contributions</span>
                  <span className="text-white font-bold">
                    {reportData.contributions}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-white/10">
                  <span className="text-[#6B7280]">Total Saved</span>
                  <span className="text-[#00D084] font-bold">
                    {formatCurrency(stats.totalSavings)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#6B7280]">Members Not Contributed</span>
                  <span className="text-[#EF4444] font-bold">
                    {reportData.membersNotContributed}
                  </span>
                </div>
              </div>
            </div>

            {/* Loan Report */}
            <div className="rounded-[16px] p-6" style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
            }}>
              <h2 className="text-lg font-semibold text-white mb-4">Loan Summary</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-slate-700">
                  <span className="text-slate-400">Total Loans</span>
                  <span className="text-white font-semibold">
                    {reportData.loans}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-slate-700">
                  <span className="text-slate-400">Outstanding</span>
                  <span className="text-red-400 font-semibold">
                    {formatCurrency(stats.activeLoanBalance)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Repaid Loans</span>
                  <span className="text-blue-400 font-semibold">
                    {reportData.repayments}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Health Check */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Chama Health</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-slate-400 text-sm mb-2">Member Engagement</p>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{
                      width: stats.memberCount > 0 
                        ? `${((stats.memberCount - reportData.membersNotContributed) / stats.memberCount) * 100}%`
                        : '0%'
                    }}
                  ></div>
                </div>
                <p className="text-slate-400 text-xs mt-2">
                  {stats.memberCount > 0 
                    ? `${Math.round(((stats.memberCount - reportData.membersNotContributed) / stats.memberCount) * 100)}% contributing`
                    : 'No members'
                  }
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-2">Loan Health</p>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{
                      width: reportData.loans > 0 
                        ? `${(reportData.repayments / reportData.loans) * 100}%`
                        : '0%'
                    }}
                  ></div>
                </div>
                <p className="text-slate-400 text-xs mt-2">
                  {reportData.loans > 0 
                    ? `${Math.round((reportData.repayments / reportData.loans) * 100)}% repaid`
                    : 'No loans'
                  }
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-2">Savings Rate</p>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full"
                    style={{ width: '75%' }}
                  ></div>
                </div>
                <p className="text-slate-400 text-xs mt-2">Strong growth</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
