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
import { useAuthStore } from '@/store/useAuthStore';
import { useChamaStore } from '@/store/useChamaStore';
import { getUserChama, getChamaStats, getContributions, getLoans } from '@/lib/supabase';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, Users, DollarSign, Banknote } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { isLoading: authLoading } = useAuthStore();
  const toast = useToast();
  const { setChama } = useChamaStore();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSavings: 0,
    activeLoanBalance: 0,
    activeLoanCount: 0,
    totalLoansCount: 0,
    memberCount: 0,
    thisMonthTotal: 0,
  });
  const [recentContributions, setRecentContributions] = useState<any[]>([]);
  const [recentLoans, setRecentLoans] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If auth is still loading, don't do anything yet
    if (authLoading) {
      return;
    }

    // If auth has finished loading and no user, redirect to login
    if (!user) {
      router.push('/login');
      return;
    }

    const loadDashboard = async () => {
      try {
        const chama = await getUserChama(user.id);
        
        if (!chama) {
          setError('No chama found. Please create or join a chama to continue.');
          setIsLoading(false);
          return;
        }
        setChama(chama);

        // Load stats with error handling
        try {
          const chamaStats = await getChamaStats(chama.id);
          setStats(chamaStats);
        } catch (statsError) {
          // Stats loading error - continue with default stats
        }

        // Load recent contributions with error handling
        try {
          const contributions = await getContributions(chama.id);
          setRecentContributions(contributions.slice(0, 5));
        } catch (contribError) {
          // Contributions loading error - continue
        }

        // Load recent loans with error handling
        try {
          const loans = await getLoans(chama.id);
          setRecentLoans(loans.slice(0, 5));
        } catch (loanError) {
          // Loans loading error - continue
        }
      } catch (error: any) {
        setError(error.message || 'Failed to load dashboard. Please check your connection.');
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, [user, authLoading, router, setChama]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-grove-dark flex items-center justify-center">
        <p className="text-slate-400">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-grove-dark flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Dashboard</h1>
          <p className="text-red-400 mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <Link href="/signup">
              <Button variant="primary">Create Chama</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-grove-dark">
      <Navbar />
      <Sidebar />
      <BottomNav />

      <main className="flex-1 md:ml-64 min-h-screen bg-slate-900 p-6 pt-[70px] md:pt-6 pb-20 md:pb-0 relative z-10">
        <div className="w-full">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
            <p className="text-slate-400">Welcome back! Here's your chama overview.</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <SummaryCard
              title="Total Savings"
              value={formatCurrency(stats.totalSavings)}
              icon="💰"
              color="green"
            />
            <SummaryCard
              title="Active Loans"
              value={formatCurrency(stats.activeLoanBalance)}
              icon="🏦"
              color="red"
            />
            <SummaryCard
              title="Total Members"
              value={stats.memberCount}
              icon="👥"
              color="blue"
            />
            <SummaryCard
              title="Total Loans"
              value={stats.totalLoansCount}
              icon="📋"
              color="indigo"
            />
            <SummaryCard
              title="This Month"
              value={formatCurrency(stats.thisMonthTotal)}
              icon="📊"
              color="purple"
            />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Link href="/contributions">
              <Button variant="primary" className="w-full" icon={<Plus size={16} />}>
                Record Contribution
              </Button>
            </Link>
            <Link href="/members">
              <Button variant="secondary" className="w-full" icon={<Users size={16} />}>
                Add Member
              </Button>
            </Link>
            <Link href="/loans">
              <Button variant="secondary" className="w-full" icon={<Banknote size={16} />}>
                New Loan
              </Button>
            </Link>
          </div>

          {/* Recent Transactions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Contributions */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Recent Contributions</h2>
              <Table
                columns={[
                  { key: 'members', label: 'Member', render: (_, row) => row.members?.name },
                  { key: 'amount', label: 'Amount', render: (val) => formatCurrency(val) },
                  { key: 'created_at', label: 'Date', render: (val) => formatDate(val) },
                ]}
                data={recentContributions}
                isEmpty={recentContributions.length === 0}
                emptyMessage="No contributions yet"
              />
            </div>

            {/* Recent Loans */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Recent Loans</h2>
              <Table
                columns={[
                  { key: 'members', label: 'Member', render: (_, row) => row.members?.name },
                  { key: 'amount', label: 'Amount', render: (val) => formatCurrency(val) },
                  { key: 'status', label: 'Status', render: (val) => (
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      val === 'approved' ? 'bg-green-900 text-green-200' :
                      val === 'pending' ? 'bg-yellow-900 text-yellow-200' :
                      'bg-slate-700 text-slate-200'
                    }`}>
                      {val}
                    </span>
                  )},
                ]}
                data={recentLoans}
                isEmpty={recentLoans.length === 0}
                emptyMessage="No loans yet"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
