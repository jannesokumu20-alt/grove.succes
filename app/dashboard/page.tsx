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
    <div className="min-h-screen bg-[#0B1120] pb-20">
      <div className="flex justify-between items-center px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <div className="bg-slate-800 rounded-full p-2">
            <span className="text-green-400 text-lg">🌿</span>
          </div>
          <span className="text-green-400 font-bold">Grove</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="text-gray-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-medium">
            {user?.email?.[0]?.toUpperCase()}
          </div>
        </div>
      </div>

      <div className="px-4 mt-3">
        <h1 className="text-white text-lg font-semibold">Welcome back, {user?.email?.split('@')[0]}!</h1>
        <p className="text-gray-400 text-sm mt-0.5">Here's what's happening in {chama?.name}</p>
      </div>

      <div className="px-4 mt-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#111827] rounded-xl p-3 border border-[#1f2937]">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-xs mb-1">Total Savings</p>
                <p className="text-white font-bold text-xl">{formatCurrency(stats.totalSavings)}</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-emerald-900 bg-opacity-20 flex items-center justify-center">
                <DollarSign size={16} className="text-emerald-400" />
              </div>
            </div>
          </div>

          <div className="bg-[#111827] rounded-xl p-3 border border-[#1f2937]">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-xs mb-1">Active Loans</p>
                <p className="text-white font-bold text-xl">{formatCurrency(stats.activeLoans)}</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-blue-900 bg-opacity-20 flex items-center justify-center">
                <Banknote size={16} className="text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-[#111827] rounded-xl p-3 border border-[#1f2937]">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-xs mb-1">Total Members</p>
                <p className="text-white font-bold text-xl">{stats.totalMembers}</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-cyan-900 bg-opacity-20 flex items-center justify-center">
                <Users size={16} className="text-cyan-400" />
              </div>
            </div>
          </div>

          <div className="bg-[#111827] rounded-xl p-3 border border-[#1f2937]">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-xs mb-1">This Month</p>
                <p className="text-white font-bold text-xl">{formatCurrency(stats.thisMonthContributions)}</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-orange-900 bg-opacity-20 flex items-center justify-center">
                <TrendingUp size={16} className="text-orange-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 mt-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-white font-semibold">Recent Activity</h2>
          <Link href="#" className="text-green-400 text-sm">View all</Link>
        </div>
        <div className="text-center py-12">
          <Activity size={48} className="text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">No recent activity yet</p>
        </div>
      </div>

      <div className="px-4 mt-6">
        <h2 className="text-white font-semibold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/contributions"
            className="bg-[#111827] rounded-xl p-4 border border-[#1f2937] flex flex-col items-center gap-2 text-center"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-900 bg-opacity-20 flex items-center justify-center mb-1">
              <DollarSign size={20} className="text-emerald-400" />
            </div>
            <span className="text-white text-sm font-medium">Contribution</span>
          </Link>

          <Link
            href="/members"
            className="bg-[#111827] rounded-xl p-4 border border-[#1f2937] flex flex-col items-center gap-2 text-center"
          >
            <div className="w-10 h-10 rounded-lg bg-cyan-900 bg-opacity-20 flex items-center justify-center mb-1">
              <Users size={20} className="text-cyan-400" />
            </div>
            <span className="text-white text-sm font-medium">Members</span>
          </Link>

          <Link
            href="/loans"
            className="bg-[#111827] rounded-xl p-4 border border-[#1f2937] flex flex-col items-center gap-2 text-center"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-900 bg-opacity-20 flex items-center justify-center mb-1">
              <Banknote size={20} className="text-blue-400" />
            </div>
            <span className="text-white text-sm font-medium">Loans</span>
          </Link>

          <Link
            href="/meetings"
            className="bg-[#111827] rounded-xl p-4 border border-[#1f2937] flex flex-col items-center gap-2 text-center"
          >
            <div className="w-10 h-10 rounded-lg bg-orange-900 bg-opacity-20 flex items-center justify-center mb-1">
              <Plus size={20} className="text-orange-400" />
            </div>
            <span className="text-white text-sm font-medium">Meetings</span>
          </Link>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
