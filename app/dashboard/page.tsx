'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import BottomNav from '@/components/BottomNav';
import StatCard from '@/components/StatCard';
import { useAuth } from '@/hooks/useAuth';
import { useRBAC } from '@/hooks/useRBAC';
import { useChamaStore } from '@/store/useChamaStore';
import { getMembers, getContributions, getLoans } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import { Plus, Users, DollarSign, Banknote, TrendingUp, Activity } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { role, isLoading: rbacLoading } = useRBAC();
  const chama = useChamaStore((state) => state.chama);

  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSavings: 0,
    activeLoans: 0,
    totalMembers: 0,
    thisMonthContributions: 0,
  });

  useEffect(() => {
    if (rbacLoading) return;

    const loadData = async () => {
      if (!chama || !user) {
        router.push('/login');
        return;
      }

      try {
        const [membersData, contributionsData, loansData] = await Promise.all([
          getMembers(chama.id).catch(() => []),
          getContributions(chama.id).catch(() => []),
          getLoans(chama.id).catch(() => []),
        ]);

        const activeMembers = membersData.filter((m: any) => m.status === 'active').length;
        const now = new Date();
        const thisMonthContribs = contributionsData.filter((c: any) => 
          c.month === now.getMonth() + 1 && c.year === now.getFullYear()
        );
        const allTimeTotal = contributionsData.reduce((sum: number, c: any) => sum + (c.amount || 0), 0);
        const activeLoanBalance = loansData
          .filter((l: any) => l.status === 'active')
          .reduce((sum: number, l: any) => sum + (l.balance || 0), 0);
        const thisMonthTotal = thisMonthContribs.reduce((sum: number, c: any) => sum + (c.amount || 0), 0);

        setStats({
          totalSavings: allTimeTotal,
          activeLoans: activeLoanBalance,
          totalMembers: activeMembers,
          thisMonthContributions: thisMonthTotal,
        });
      } catch (error: any) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [chama, user, router, rbacLoading]);

  if (rbacLoading || isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <Sidebar />
      <BottomNav />

      <main className="flex-1 md:ml-64 min-h-screen bg-slate-950 pt-[70px] md:pt-6 pb-24 md:pb-6">
        <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-6">
          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Welcome back, {user?.email?.split('@')[0]}! 👋
            </h1>
            <p className="text-slate-400">Here's what's happening in {chama?.name}</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              title="Total Savings"
              value={formatCurrency(stats.totalSavings)}
              icon={<DollarSign size={24} />}
              color="emerald"
            />
            <StatCard
              title="Active Loans"
              value={formatCurrency(stats.activeLoans)}
              icon={<Banknote size={24} />}
              color="blue"
            />
            <StatCard
              title="Total Members"
              value={stats.totalMembers}
              icon={<Users size={24} />}
              color="cyan"
            />
            <StatCard
              title="This Month"
              value={formatCurrency(stats.thisMonthContributions)}
              icon={<TrendingUp size={24} />}
              color="orange"
            />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <Link href="/contributions">
              <button className="w-full bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2">
                <Plus size={20} />
                <span className="hidden md:inline">Contribution</span>
              </button>
            </Link>
            <Link href="/members">
              <button className="w-full bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2">
                <Plus size={20} />
                <span className="hidden md:inline">Member</span>
              </button>
            </Link>
            <Link href="/loans">
              <button className="w-full bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2">
                <Plus size={20} />
                <span className="hidden md:inline">Loan</span>
              </button>
            </Link>
            <Link href="/meetings">
              <button className="w-full bg-gradient-to-br from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2">
                <Plus size={20} />
                <span className="hidden md:inline">Meeting</span>
              </button>
            </Link>
          </div>

          {/* Recent Activity */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Recent Activity</h2>
            <div className="text-center py-12">
              <Activity size={48} className="text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No recent activity yet</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
