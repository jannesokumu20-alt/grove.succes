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
import { isDevMode } from '@/lib/devMode';
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
      // In dev mode, skip auth check
      if (!isDevMode() && (!chama || !user)) {
        router.push('/login');
        return;
      }

      // If no chama (even in dev mode), use empty data
      if (!chama) {
        setIsLoading(false);
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
    <div className="min-h-screen bg-[#0B1120] text-white pb-20">
      <div className="px-4 pt-4 pb-2 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-slate-800 rounded-full p-2">
            <span className="text-green-400 text-lg">🌿</span>
          </div>
          <span className="text-green-400 font-bold">Grove</span>
        </div>
      </div>

      <div className="px-4 mt-2">
        <h1 className="text-white text-lg font-semibold">Welcome back, User!</h1>
        <p className="text-gray-400 text-sm mt-1">Here's what's happening in your Chama</p>
      </div>

      <div className="px-4 mt-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-xs mb-1">Total Savings</p>
                <p className="text-white text-xl font-bold">{formatCurrency(stats.totalSavings)}</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-300">
                <DollarSign size={16} />
              </div>
            </div>
          </div>

          <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-xs mb-1">Active Loans</p>
                <p className="text-white text-xl font-bold">{formatCurrency(stats.activeLoans)}</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-300">
                <Banknote size={16} />
              </div>
            </div>
          </div>

          <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-xs mb-1">Total Members</p>
                <p className="text-white text-xl font-bold">{stats.totalMembers}</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-300">
                <Users size={16} />
              </div>
            </div>
          </div>

          <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-xs mb-1">This Month</p>
                <p className="text-white text-xl font-bold">{formatCurrency(stats.thisMonthContributions)}</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-300">
                <TrendingUp size={16} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-4 mt-4">
        <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4">
          <div className="text-white text-2xl font-bold">Total Balance</div>
          <div className="text-green-400 text-sm">KES {formatCurrency(stats.totalSavings)}</div>
          <div className="text-green-400 text-sm mt-1">+0.0% this month</div>
          <div className="border-t border-slate-700 mt-3 flex justify-between">
            <div className="text-center flex-1">
              <div className="text-white text-sm font-semibold">Deposits</div>
              <div className="text-gray-400 text-xs">KES {formatCurrency(stats.thisMonthContributions)}</div>
            </div>
            <div className="text-center flex-1">
              <div className="text-white text-sm font-semibold">Withdrawals</div>
              <div className="text-gray-400 text-xs">KES 0</div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 mt-6">
        <h2 className="text-white font-semibold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-center">
            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-gray-300">
              <DollarSign size={20} />
            </div>
            <span className="text-white text-sm font-medium">Contribution</span>
          </div>

          <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-center">
            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-gray-300">
              <Users size={20} />
            </div>
            <span className="text-white text-sm font-medium">Members</span>
          </div>

          <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-center">
            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-gray-300">
              <Banknote size={20} />
            </div>
            <span className="text-white text-sm font-medium">Loans</span>
          </div>

          <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-center">
            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-gray-300">
              <Plus size={20} />
            </div>
            <span className="text-white text-sm font-medium">Meeting</span>
          </div>
        </div>
      </div>

      <div className="px-4 mt-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-white font-semibold">Upcoming</h2>
          <Link href="#" className="text-green-400 text-sm">View all</Link>
        </div>
        <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4 text-gray-400 text-sm text-center">
          No upcoming meetings
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
