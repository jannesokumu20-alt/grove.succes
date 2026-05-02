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
import { getMembers, getContributions, getLoans, getMemberByUserId, supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import { Plus, Users, DollarSign, Banknote, TrendingUp, Activity, Bell, Eye, ArrowDown, ArrowUp, Gift, Calendar } from 'lucide-react';
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
  const [showBalance, setShowBalance] = useState(true);

  useEffect(() => {
    if (rbacLoading) return;

    const loadData = async () => {
      if (!user) {
        console.log('[Dashboard] No user, redirecting to login');
        router.push('/login');
        return;
      }

      // Check if member exists
      const member = await getMemberByUserId(user.id);
      if (!member) {
        console.log('[Dashboard] No member record for user, redirecting to login');
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
      <div className="min-h-screen bg-gradient-to-b from-[#0B1D2A] to-[#07111A] flex items-center justify-center">
        <p className="text-slate-400">Loading...</p>
      </div>
    );
  }

  const userName = user?.email?.split('@')[0] || 'User';

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B1D2A] to-[#07111A]">
      <Navbar />
      <Sidebar />
      <BottomNav />

      <main className="flex-1 md:ml-64 min-h-screen bg-gradient-to-b from-[#0B1D2A] to-[#07111A] pt-[70px] md:pt-6 pb-24 md:pb-6">
        <div className="w-full max-w-4xl mx-auto px-4 py-4 space-y-6">
          
          {/* Header Section */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-white text-lg font-semibold">
                Hello, {userName} 👋
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Welcome back! Here's what's happening in your chama today.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="relative p-2 text-gray-300 hover:text-white">
                <Bell size={20} />
                <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></div>
              </button>
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 border-2 border-emerald-300"></div>
            </div>
          </div>

          {/* Main Balance Card */}
          <div className="bg-gradient-to-br from-emerald-900/40 to-teal-900/40 border border-emerald-700/30 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-400 text-sm">Total Chama Balance</h3>
              <button 
                onClick={() => setShowBalance(!showBalance)}
                className="p-2 hover:bg-white/10 rounded-lg transition"
              >
                <Eye size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="mb-4">
              <h2 className="font-bold text-2xl text-white">
                {showBalance ? formatCurrency(stats.totalSavings) : '••••••'}
              </h2>
            </div>

            <div className="flex items-center gap-1 text-emerald-400 text-sm">
              <ArrowUp size={16} />
              <span>+12.5% from last month</span>
            </div>

            {/* Mini Stats Row */}
            <div className="mt-6 pt-6 border-t border-emerald-700/20 grid grid-cols-3 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <ArrowDown size={16} className="text-emerald-400" />
                  </div>
                </div>
                <p className="text-gray-400 text-xs">Total Contributions</p>
                <p className="font-bold text-white text-sm">{formatCurrency(stats.totalSavings)}</p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                    <Banknote size={16} className="text-orange-400" />
                  </div>
                </div>
                <p className="text-gray-400 text-xs">Total Loans</p>
                <p className="font-bold text-white text-sm">{formatCurrency(stats.activeLoans)}</p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                    <Gift size={16} className="text-red-400" />
                  </div>
                </div>
                <p className="text-gray-400 text-xs">Total Fines</p>
                <p className="font-bold text-white text-sm">KSh 2,550.00</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h3 className="text-white font-semibold mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Link
                href="/contributions"
                className="bg-[#111827] hover:bg-[#1a2332] rounded-xl p-4 text-center transition flex flex-col items-center justify-center gap-3 border border-slate-700/50"
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <ArrowDown className="text-emerald-400" size={20} />
                </div>
                <span className="text-white text-sm font-medium">Contribute</span>
              </Link>

              <Link
                href="/loans"
                className="bg-[#111827] hover:bg-[#1a2332] rounded-xl p-4 text-center transition flex flex-col items-center justify-center gap-3 border border-slate-700/50"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Banknote className="text-blue-400" size={20} />
                </div>
                <span className="text-white text-sm font-medium">Request Loan</span>
              </Link>

              <Link
                href="/members"
                className="bg-[#111827] hover:bg-[#1a2332] rounded-xl p-4 text-center transition flex flex-col items-center justify-center gap-3 border border-slate-700/50"
              >
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Users className="text-purple-400" size={20} />
                </div>
                <span className="text-white text-sm font-medium">View Members</span>
              </Link>

              <Link
                href="/meetings"
                className="bg-[#111827] hover:bg-[#1a2332] rounded-xl p-4 text-center transition flex flex-col items-center justify-center gap-3 border border-slate-700/50"
              >
                <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                  <Calendar className="text-orange-400" size={20} />
                </div>
                <span className="text-white text-sm font-medium">Schedule Meeting</span>
              </Link>
            </div>
          </div>

          {/* Upcoming Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold">Upcoming</h3>
              <Link href="/meetings" className="text-emerald-400 text-sm hover:text-emerald-300">View all</Link>
            </div>
            <div className="bg-[#111827] border border-slate-700/50 rounded-xl p-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <Calendar className="text-emerald-400" size={24} />
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-medium">Next Meeting</h4>
                  <p className="text-gray-400 text-sm">Sunday, 25 May 2025 • 10:00 AM</p>
                  <p className="text-gray-400 text-sm">At Chama Office</p>
                </div>
                <div className="bg-emerald-500/20 px-3 py-1 rounded-full flex-shrink-0">
                  <p className="text-emerald-400 text-xs font-medium">In 3 days</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold">Recent Activity</h3>
              <Link href="/dashboard" className="text-emerald-400 text-sm hover:text-emerald-300">View all</Link>
            </div>
            <div className="bg-[#111827] border border-slate-700/50 rounded-xl p-4 space-y-4">
              {/* Activity Item 1 */}
              <div className="flex items-start gap-3 pb-4 border-b border-slate-700/50">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <ArrowDown className="text-emerald-400" size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">Jane Wanjiku contributed</p>
                  <p className="text-gray-400 text-sm">KSh 2,500.00</p>
                </div>
                <p className="text-gray-400 text-xs flex-shrink-0">Today, 8:45 AM</p>
              </div>

              {/* Activity Item 2 */}
              <div className="flex items-start gap-3 pb-4 border-b border-slate-700/50">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <Banknote className="text-blue-400" size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">Peter Mwangi requested a loan</p>
                  <p className="text-gray-400 text-sm">KSh 10,000.00</p>
                </div>
                <p className="text-gray-400 text-xs flex-shrink-0">Yesterday, 4:30 PM</p>
              </div>

              {/* Activity Item 3 */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <Calendar className="text-purple-400" size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">May meeting scheduled</p>
                  <p className="text-gray-400 text-sm">Sunday, 25 May 2025</p>
                </div>
                <p className="text-gray-400 text-xs flex-shrink-0">20 May 2025</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
