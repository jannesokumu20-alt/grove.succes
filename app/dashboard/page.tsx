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
    <div className="container">
      {/* HEADER */}
      <div className="header">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-green-400 text-lg">🌿</span>
            <span className="text-green-400 font-bold">Grove</span>
          </div>
          <div className="subtitle">Here's what's happening in {chama?.name}</div>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gray-400 text-xs">Logged in as</span>
          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-medium">
            {user?.email?.[0]?.toUpperCase()}
          </div>
        </div>
      </div>

      {/* STATS GRID */}
      <div className="grid">
        <div className="card stat">
          <div className="stat-top">
            <div className="stat-label">TOTAL SAVINGS</div>
            <div className="icon green">💰</div>
          </div>
          <div className="stat-value">{formatCurrency(stats.totalSavings)}</div>
        </div>

        <div className="card stat">
          <div className="stat-top">
            <div className="stat-label">ACTIVE LOANS</div>
            <div className="icon blue">💳</div>
          </div>
          <div className="stat-value">{formatCurrency(stats.activeLoans)}</div>
        </div>

        <div className="card stat">
          <div className="stat-top">
            <div className="stat-label">TOTAL MEMBERS</div>
            <div className="icon purple">👥</div>
          </div>
          <div className="stat-value">{stats.totalMembers}</div>
        </div>

        <div className="card stat">
          <div className="stat-top">
            <div className="stat-label">THIS MONTH</div>
            <div className="icon orange">📈</div>
          </div>
          <div className="stat-value">{formatCurrency(stats.thisMonthContributions)}</div>
        </div>
      </div>

      {/* BALANCE CARD */}
      <div className="balance">
        <div className="balance-title">TOTAL BALANCE</div>
        <div className="balance-amount">KES 250,000</div>
        <div className="balance-growth">+12.5% this month</div>

        <div className="divider"></div>

        <div className="balance-row">
          <div className="balance-col">
            <span>Deposits</span>
            <strong>KES 45,000</strong>
          </div>
          <div className="balance-col">
            <span>Withdrawals</span>
            <strong>KES 5,000</strong>
          </div>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="actions">
        <div className="section-header">
          <div style={{ fontSize: '14px', fontWeight: '600' }}>Quick Actions</div>
        </div>
        <div className="actions-grid">
          <div className="card action-card">
            <div className="action-icon green">💰</div>
            <div style={{ fontSize: '13px' }}>Contribution</div>
          </div>

          <div className="card action-card">
            <div className="action-icon purple">👥</div>
            <div style={{ fontSize: '13px' }}>Members</div>
          </div>

          <div className="card action-card">
            <div className="action-icon blue">💳</div>
            <div style={{ fontSize: '13px' }}>Loans</div>
          </div>

          <div className="card action-card">
            <div className="action-icon orange">➕</div>
            <div style={{ fontSize: '13px' }}>Meeting</div>
          </div>
        </div>
      </div>

      {/* UPCOMING */}
      <div className="section">
        <div className="section-header">
          <div style={{ fontSize: '14px', fontWeight: '600' }}>Upcoming</div>
          <Link href="#" className="view-all">View all</Link>
        </div>
        <div className="card empty">
          No upcoming meetings
        </div>
      </div>

      {/* BOTTOM NAV */}
      <BottomNav />
    </div>
  );
}
