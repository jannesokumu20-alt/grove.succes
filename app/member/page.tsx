'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import BottomNav from '@/components/BottomNav';
import SummaryCard from '@/components/SummaryCard';
import { useAuth } from '@/hooks/useAuth';
import { useRBAC } from '@/hooks/useRBAC';
import { useToast } from '@/hooks/useToast';
import { getUserMemberId, getMember } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import { DollarSign, TrendingUp, AlertCircle, Banknote } from 'lucide-react';
import Link from 'next/link';

export default function MemberDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { role, isLoading: rbacLoading } = useRBAC();
  const toast = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [member, setMember] = useState<any>(null);
  const [stats, setStats] = useState({
    totalContributed: 0,
    loanBalance: 0,
    creditScore: 0,
    duesAmount: 0,
  });

  useEffect(() => {
    if (rbacLoading || !user || role !== 'member') {
      return;
    }

    const loadMemberData = async () => {
      try {
        // Get member ID
        const memberId = await getUserMemberId(user.id);
        if (!memberId) {
          toast.error('Member profile not found');
          router.push('/login');
          return;
        }

        // Get member details
        const memberData = await getMember(memberId);
        if (!memberData) {
          toast.error('Failed to load member data');
          return;
        }

        setMember(memberData);

        // TODO: Load member-specific stats
        setStats({
          totalContributed: 0, // Load from contributions table filtered by member_id
          loanBalance: 0, // Load from loans table filtered by member_id
          creditScore: memberData.credit_score || 0,
          duesAmount: 0, // Load from fines table filtered by member_id
        });
      } catch (error: any) {
        toast.error(error.message || 'Failed to load member data');
      } finally {
        setIsLoading(false);
      }
    };

    loadMemberData();
  }, [user, role, rbacLoading, router, toast]);

  if (rbacLoading || isLoading) {
    return (
      <div className="min-h-screen bg-grove-dark flex items-center justify-center">
        <p className="text-slate-400">Loading...</p>
      </div>
    );
  }

  if (role !== 'member') {
    router.push('/dashboard');
    return null;
  }

  if (!member) {
    return (
      <div className="min-h-screen bg-grove-dark flex items-center justify-center">
        <p className="text-slate-400">Member data not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-grove-dark">
      <Navbar />
      <Sidebar />
      <BottomNav />

      <main className="flex-1 md:ml-64 min-h-screen bg-slate-900 p-6 pt-[70px] md:pt-6 pb-20 md:pb-0">
        <div className="w-full max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome, {member.name}!
            </h1>
            <p className="text-slate-400">
              Credit Score: <span className="text-grove-accent font-semibold">{stats.creditScore}</span>
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <SummaryCard
              title="Total Contributed"
              value={formatCurrency(stats.totalContributed)}
              icon={<DollarSign size={32} />}
              color="green"
            />
            <SummaryCard
              title="Loan Balance"
              value={formatCurrency(stats.loanBalance)}
              icon={<Banknote size={32} />}
              color="blue"
            />
            <SummaryCard
              title="Dues & Fines"
              value={formatCurrency(stats.duesAmount)}
              icon={<AlertCircle size={32} />}
              color="red"
            />
            <SummaryCard
              title="Credit Score"
              value={`${stats.creditScore}/100`}
              icon={<TrendingUp size={32} />}
              color="indigo"
            />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/contributions">
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-grove-accent transition cursor-pointer">
                <h3 className="text-white font-semibold mb-2">View My Contributions</h3>
                <p className="text-slate-400 text-sm">See your contribution history and trends</p>
              </div>
            </Link>

            <Link href="/loans">
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-grove-accent transition cursor-pointer">
                <h3 className="text-white font-semibold mb-2">View My Loans</h3>
                <p className="text-slate-400 text-sm">Check loan status and repayment schedule</p>
              </div>
            </Link>

            <Link href="/announcements">
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-grove-accent transition cursor-pointer">
                <h3 className="text-white font-semibold mb-2">Latest Announcements</h3>
                <p className="text-slate-400 text-sm">Stay updated with chama news and events</p>
              </div>
            </Link>

            <Link href="/settings">
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-grove-accent transition cursor-pointer">
                <h3 className="text-white font-semibold mb-2">Account Settings</h3>
                <p className="text-slate-400 text-sm">Update your profile and preferences</p>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
