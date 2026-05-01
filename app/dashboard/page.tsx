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
import { getMembers, getContributions, getLoans, supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import { Plus, Users, DollarSign, Banknote, TrendingUp, Activity } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { role, isLoading: rbacLoading } = useRBAC();
  const chama = useChamaStore((state) => state.chama);
  const setChama = useChamaStore((state) => state.setChama);

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
      if (!user) {
        console.log('[Dashboard] No user, redirecting to login');
        router.push('/login');
        return;
      }

      try {
        // If chama is not in store, load it from database
        let activeCham = chama;
        if (!activeCham) {
          console.log('[Dashboard] Loading chama for user:', user.id);
          const { data: chamaData, error: chamaError } = await supabase
            .from('chamas')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (!chamaData || chamaError) {
            console.log('[Dashboard] No chama found, redirecting to member');
            router.push('/member');
            return;
          }

          console.log('[Dashboard] Chama loaded:', chamaData.id);
          activeCham = chamaData;
          setChama(activeCham);
        }

        if (!activeCham) {
          console.log('[Dashboard] No active chama, redirecting to member');
          router.push('/member');
          return;
        }

        console.log('[Dashboard] Loading stats for chama:', activeCham.id);
        const [membersData, contributionsData, loansData] = await Promise.all([
          getMembers(activeCham.id).catch(() => []),
          getContributions(activeCham.id).catch(() => []),
          getLoans(activeCham.id).catch(() => []),
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
        console.log('[Dashboard] Stats loaded successfully');
      } catch (error: any) {
        console.error('[Dashboard] Error loading dashboard data:', error);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user, router, rbacLoading, chama, setChama]);

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
            <Link
              href="/contributions"
              className="w-full bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2 block"
            >
              <Plus size={20} />
              <span className="hidden md:inline">Contribution</span>
            </Link>
            <Link
              href="/members"
              className="w-full bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2 block"
            >
              <Plus size={20} />
              <span className="hidden md:inline">Member</span>
            </Link>
            <Link
              href="/loans"
              className="w-full bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2 block"
            >
              <Plus size={20} />
              <span className="hidden md:inline">Loan</span>
            </Link>
            <Link
              href="/meetings"
              className="w-full bg-gradient-to-br from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2 block"
            >
              <Plus size={20} />
              <span className="hidden md:inline">Meeting</span>
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
