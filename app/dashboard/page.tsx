'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/hooks/useAuth';
import { useRBAC } from '@/hooks/useRBAC';
import { useChamaStore } from '@/store/useChamaStore';
import { getMembers, getContributions, getLoans, getMemberByUserId, supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import { Bell, Eye, ArrowDown, ArrowUp, Banknote, Gift, Calendar, Users } from 'lucide-react';
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
    // Wait for user to be populated by useAuth hook
    if (!user) return;

    const loadData = async () => {

      const member = await getMemberByUserId(user.id);
      if (!member) {
        console.log('[Dashboard] No member record for user, redirecting to login');
        router.push('/login');
        return;
      }

      try {
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
      <div className="min-h-screen bg-gradient-to-b from-[#020617] via-[#071a2f] to-[#0a2540] flex items-center justify-center">
        <p className="text-[#94a3b8]">Loading...</p>
      </div>
    );
  }

  const userName = chama?.name || user?.email?.split('@')[0] || 'User';

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#020617] via-[#071a2f] to-[#0a2540]">
      <Navbar />
      <Sidebar />
      <BottomNav />

      <main className="flex-1 md:ml-64 min-h-screen bg-gradient-to-b from-[#020617] via-[#071a2f] to-[#0a2540] pt-[70px] md:pt-6 pb-24 md:pb-6">
        <div className="mx-auto px-4 md:max-w-md lg:max-w-4xl py-3 space-y-4">
          
          {/* Header Section */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-[#ffffff] text-[22px] font-bold">
                Hello, {userName} 👋
              </h1>
              <p className="text-[#94a3b8] text-sm mt-2 leading-relaxed">
                Welcome back! Here's what's happening<br />in your chama today.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative p-2 text-[#94a3b8] hover:text-[#ffffff] transition-all duration-200 hover:scale-105">
                <Bell size={24} />
                <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full"></div>
              </button>
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#22c55e] to-[#16a34a] relative">
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#22c55e] rounded-full border-2 border-[#020617]"></div>
              </div>
            </div>
          </div>

          {/* STAT CARDS - 2 COLUMN GRID ON MOBILE */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Total Members', value: stats.totalMembers, icon: '👥', color: '#00D084', bgColor: '#0C1A14', glowColor: '#00D084' },
              { label: 'Total Contributions', value: formatCurrency(stats.totalSavings), icon: '📊', color: '#3B82F6', bgColor: '#0C1620', glowColor: '#3B82F6' },
              { label: 'Active Loans', value: formatCurrency(stats.activeLoans), icon: '💰', color: '#F59E0B', bgColor: '#1A1109', glowColor: '#F59E0B' },
              { label: 'This Month', value: formatCurrency(stats.thisMonthContributions), icon: '📈', color: '#A855F7', bgColor: '#140A1F', glowColor: '#A855F7' },
            ].map((stat, i) => (
              <div
                key={i}
                className="rounded-[14px] p-3 flex flex-col justify-between h-auto transition-all hover:scale-105 cursor-pointer group"
                style={{
                  background: stat.bgColor,
                  border: `2px solid ${stat.color}`,
                  boxShadow: `0 0 50px ${stat.glowColor}70, 0 0 100px ${stat.glowColor}30, inset 0 1px 2px rgba(255,255,255,0.1)`,
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-[#AEB6C2] text-xs font-bold tracking-widest uppercase leading-tight">{stat.label}</p>
                    <p className="text-lg font-bold text-white mt-1 leading-none" style={{
                      textShadow: `0 0 20px ${stat.glowColor}c0`
                    }}>
                      {typeof stat.value === 'number' ? stat.value : stat.value}
                    </p>
                  </div>
                  <div
                    className="flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-120"
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: stat.color,
                      boxShadow: `0 0 40px ${stat.color}a0, 0 0 80px ${stat.color}60`,
                    }}
                  >
                    <span className="text-base" style={{
                      filter: `drop-shadow(0 0 8px ${stat.glowColor}ff)`
                    }}>
                      {stat.icon}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Glass Balance Card */}
          <div className="relative rounded-[20px] p-4 overflow-hidden" style={{
            background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(2,6,23,0.6))',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
          }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[#94a3b8] text-xs font-medium">Total Chama Balance</h3>
              <button 
                onClick={() => setShowBalance(!showBalance)}
                className="p-1 hover:bg-white/10 rounded-lg transition-all duration-200 hover:scale-105"
              >
                <Eye size={18} className="text-[#94a3b8]" />
              </button>
            </div>

            <div className="mb-2">
              <h2 className="font-bold text-2xl text-[#ffffff]">
                {showBalance ? formatCurrency(stats.totalSavings) : '••••••'}
              </h2>
            </div>

            <div className="flex items-center gap-1 text-[#22c55e] text-xs font-medium mb-3">
              <ArrowUp size={14} />
              <span>+12.5% from last month</span>
            </div>

            {/* Stats Row - Horizontal with dividers */}
            <div className="border-t border-[#94a3b8]/20 pt-4 mt-4">
              <div className="flex items-stretch">
                {/* Stat 1 */}
                <div className="flex-1 flex flex-col items-center py-2 px-2">
                  <div className="w-8 h-8 rounded-full mb-1 flex items-center justify-center"
                    style={{
                      background: 'rgba(34,197,94,0.2)',
                      boxShadow: '0 0 12px rgba(34,197,94,0.25)',
                    }}>
                    <ArrowDown size={16} className="text-[#22c55e]" />
                  </div>
                  <p className="text-[#ffffff] font-semibold text-xs mt-1 text-center">{formatCurrency(stats.totalSavings)}</p>
                  <p className="text-[#94a3b8] text-xs text-center mt-0.5">Contributions</p>
                </div>

                {/* Divider 1 */}
                <div className="w-px bg-[#94a3b8]/20"></div>

                {/* Stat 2 */}
                <div className="flex-1 flex flex-col items-center py-2 px-2">
                  <div className="w-8 h-8 rounded-full mb-1 flex items-center justify-center"
                    style={{
                      background: 'rgba(251,146,60,0.2)',
                      boxShadow: '0 0 12px rgba(251,146,60,0.25)',
                    }}>
                    <Banknote size={16} className="text-[#fb923c]" />
                  </div>
                  <p className="text-[#ffffff] font-semibold text-xs mt-1 text-center">{formatCurrency(stats.activeLoans)}</p>
                  <p className="text-[#94a3b8] text-xs text-center mt-0.5">Loans</p>
                </div>

                {/* Divider 2 */}
                <div className="w-px bg-[#94a3b8]/20"></div>

                {/* Stat 3 */}
                <div className="flex-1 flex flex-col items-center py-2 px-2">
                  <div className="w-8 h-8 rounded-full mb-1 flex items-center justify-center"
                    style={{
                      background: 'rgba(239,68,68,0.2)',
                      boxShadow: '0 0 12px rgba(239,68,68,0.25)',
                    }}>
                    <Gift size={16} className="text-[#ef4444]" />
                  </div>
                  <p className="text-[#ffffff] font-semibold text-xs mt-1 text-center">KES 0.00</p>
                  <p className="text-[#94a3b8] text-xs text-center mt-0.5">Fines</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-2">
            <h3 className="text-[#ffffff] font-semibold mb-3 text-xs">Quick Actions</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              <Link
                href="/contributions"
                className="rounded-[16px] text-center transition-all duration-200 hover:scale-[1.03] flex flex-col items-center justify-center gap-3"
                style={{
                  padding: '16px',
                  minHeight: '100px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  boxShadow: '0 4px 12px rgba(34,197,94,0.15)',
                }}
              >
                <div className="w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200"
                  style={{
                    background: 'rgba(34,197,94,0.2)',
                    boxShadow: '0 0 15px rgba(34,197,94,0.3)',
                  }}>
                  <ArrowDown className="text-[#22c55e]" size={24} />
                </div>
                <span className="text-[#ffffff] text-xs font-medium">Contribute</span>
              </Link>

              <Link
                href="/loans"
                className="rounded-[16px] text-center transition-all duration-200 hover:scale-[1.03] flex flex-col items-center justify-center gap-3"
                style={{
                  padding: '16px',
                  minHeight: '100px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  boxShadow: '0 4px 12px rgba(59,130,246,0.15)',
                }}
              >
                <div className="w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200"
                  style={{
                    background: 'rgba(59,130,246,0.2)',
                    boxShadow: '0 0 15px rgba(59,130,246,0.3)',
                  }}>
                  <Banknote className="text-[#3b82f6]" size={24} />
                </div>
                <span className="text-[#ffffff] text-xs font-medium">Request Loan</span>
              </Link>

              <Link
                href="/members"
                className="rounded-[16px] text-center transition-all duration-200 hover:scale-[1.03] flex flex-col items-center justify-center gap-3"
                style={{
                  padding: '16px',
                  minHeight: '100px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  boxShadow: '0 4px 12px rgba(168,85,247,0.15)',
                }}
              >
                <div className="w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200"
                  style={{
                    background: 'rgba(168,85,247,0.2)',
                    boxShadow: '0 0 15px rgba(168,85,247,0.3)',
                  }}>
                  <Users className="text-[#a855f7]" size={24} />
                </div>
                <span className="text-[#ffffff] text-xs font-medium">View Members</span>
              </Link>

              <Link
                href="/meetings"
                className="rounded-[16px] text-center transition-all duration-200 hover:scale-[1.03] flex flex-col items-center justify-center gap-3"
                style={{
                  padding: '16px',
                  minHeight: '100px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  boxShadow: '0 4px 12px rgba(251,146,60,0.15)',
                }}
              >
                <div className="w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200"
                  style={{
                    background: 'rgba(251,146,60,0.2)',
                    boxShadow: '0 0 15px rgba(251,146,60,0.3)',
                  }}>
                  <Calendar className="text-[#fb923c]" size={24} />
                </div>
                <span className="text-[#ffffff] text-xs font-medium">Schedule Meeting</span>
              </Link>
            </div>
          </div>

          {/* Upcoming Section */}
          <div className="mt-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[#ffffff] font-semibold text-xs">Upcoming</h3>
              <Link href="/meetings" className="text-[#22c55e] text-xs hover:text-[#16a34a] transition-colors">View all</Link>
            </div>
            <div className="rounded-[16px] p-4 text-center" style={{
              background: 'rgba(15, 23, 42, 0.6)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}>
              <p className="text-[#94a3b8] text-xs py-4">No upcoming meetings</p>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="mt-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[#ffffff] font-semibold text-xs">Recent Activity</h3>
              <Link href="/dashboard" className="text-[#22c55e] text-xs hover:text-[#16a34a] transition-colors">View all</Link>
            </div>
            <div className="rounded-[16px] p-4 text-center" style={{
              background: 'rgba(15, 23, 42, 0.6)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}>
              <p className="text-[#94a3b8] text-xs py-4">No activity yet</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
