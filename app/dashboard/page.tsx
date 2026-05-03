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
import './dashboard.css';

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
    <div className="dashboard-container min-h-screen bg-[#0B1120] text-white pb-20">
      <div className="header px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <div className="bg-slate-800 rounded-full p-2">
            <span className="text-green-400 text-lg">🌿</span>
          </div>
          <span className="text-green-400 font-bold">Grove</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gray-400 text-sm">Logged in as</span>
          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-medium">
            {user?.email?.[0]?.toUpperCase()}
          </div>
        </div>
      </div>

      <div className="px-4 mt-2">
        <h1 className="header-title text-white text-lg font-semibold">Welcome back, {user?.email?.split('@')[0]}!</h1>
        <p className="header-sub text-gray-400 text-sm mt-1">Here's what's happening in {chama?.name}</p>
      </div>

      <div className="px-4 mt-4">
        <div className="cards-grid">
          <div className="card green">
            <p className="card-title">Total Savings</p>
            <p className="card-value">{formatCurrency(stats.totalSavings)}</p>
            <div className="card-icon">
              <DollarSign size={16} className="text-gray-300" />
            </div>
          </div>

          <div className="card blue">
            <p className="card-title">Active Loans</p>
            <p className="card-value">{formatCurrency(stats.activeLoans)}</p>
            <div className="card-icon">
              <Banknote size={16} className="text-gray-300" />
            </div>
          </div>

          <div className="card purple">
            <p className="card-title">Total Members</p>
            <p className="card-value">{stats.totalMembers}</p>
            <div className="card-icon">
              <Users size={16} className="text-gray-300" />
            </div>
          </div>

          <div className="card orange">
            <p className="card-title">This Month</p>
            <p className="card-value">{formatCurrency(stats.thisMonthContributions)}</p>
            <div className="card-icon">
              <TrendingUp size={16} className="text-gray-300" />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-4">
        <div className="balance-card">
          <div className="balance-title">Total Balance</div>
          <div className="balance-amount">KES 250,000</div>
          <div className="balance-growth">+12.5% this month</div>
          <div className="balance-split">
            <div className="balance-box">
              <div className="text-gray-400 text-xs">Deposits</div>
              <div className="text-white text-sm font-semibold">KES 45,000</div>
            </div>
            <div className="balance-box">
              <div className="text-gray-400 text-xs">Withdrawals</div>
              <div className="text-white text-sm font-semibold">KES 5,000</div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4">
        <div className="quick-actions">
          <h2 className="quick-title">Quick Actions</h2>
          <div className="quick-grid">
            <div className="quick-btn">
              <div className="quick-icon">
                <DollarSign size={20} className="text-gray-300" />
              </div>
              <span className="text-white text-sm font-medium">Contribution</span>
            </div>

            <div className="quick-btn">
              <div className="quick-icon">
                <Users size={20} className="text-gray-300" />
              </div>
              <span className="text-white text-sm font-medium">Members</span>
            </div>

            <div className="quick-btn">
              <div className="quick-icon">
                <Banknote size={20} className="text-gray-300" />
              </div>
              <span className="text-white text-sm font-medium">Loans</span>
            </div>

            <div className="quick-btn">
              <div className="quick-icon">
                <Plus size={20} className="text-gray-300" />
              </div>
              <span className="text-white text-sm font-medium">Meeting</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="quick-title">Upcoming</h2>
          <Link href="#" className="text-green-400 text-sm">View all</Link>
        </div>
        <div className="card">
          <div className="text-gray-400 text-sm text-center">
            No upcoming meetings
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
