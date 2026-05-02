'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import BottomNav from '@/components/BottomNav';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Modal from '@/components/Modal';
import Badge from '@/components/Badge';
import { useAuth } from '@/hooks/useAuth';
import { useRBAC } from '@/hooks/useRBAC';
import { useToast } from '@/hooks/useToast';
import { useChamaStore } from '@/store/useChamaStore';
import { getMembers, addMember } from '@/lib/supabase';
import { formatDate, isValidPhoneNumber } from '@/lib/utils';
import { Plus, Search, Phone, Calendar, MoreVertical, Menu, Bell, Filter, Settings, X, ArrowDown, Zap, AlertCircle, Send, Upload } from 'lucide-react';

export default function MembersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { role, isLoading: rbacLoading } = useRBAC();
  const toast = useToast();
  const chama = useChamaStore((state) => state.chama);
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isFabExpanded, setIsFabExpanded] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (rbacLoading) return;

    const loadMembers = async () => {
      if (!chama) {
        router.push('/dashboard');
        return;
      }

      try {
        const data = await getMembers(chama.id);
        setMembers(data);
      } catch (error: any) {
        toast.error(error.message || 'Failed to load members');
      } finally {
        setIsLoading(false);
      }
    };

    loadMembers();
  }, [chama, router, toast, rbacLoading]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!isValidPhoneNumber(formData.phone)) {
      newErrors.phone = 'Invalid Kenyan phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !chama) return;

    setIsSubmitting(true);

    try {
      const newMember = await addMember(chama.id, formData.fullName, formData.phone);
      setMembers([newMember, ...members]);
      setFormData({ fullName: '', phone: '' });
      setIsModalOpen(false);
      toast.success('Member added successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMembers = members.filter((member) => {
    const matchesSearch = (member?.name || '').toLowerCase().includes((searchTerm || '').toLowerCase());
    const matchesStatus = statusFilter === 'all' || member?.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalMembers = members.length;
  const activeCount = members.filter(m => m.status === 'active').length;
  const defaulterCount = members.filter(m => m.status === 'suspended' || m.credit_score < 50).length;
  const newThisMonth = members.filter(m => {
    const joinDate = new Date(m.joined_at || m.created_at);
    const now = new Date();
    return joinDate.getMonth() === now.getMonth() && joinDate.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #020617 0%, #0f1623 50%, #1a1f35 100%)' }}>
      <Navbar />
      <Sidebar />
      <BottomNav />

      <main className="flex-1 md:ml-64 min-h-screen pt-[70px] md:pt-6 pb-32 md:pb-6">
        <div className="w-full px-4 md:max-w-6xl mx-auto py-4 md:py-6">
          
          {/* HEADER SECTION */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-[28px] font-bold text-white">Members</h1>
              <p className="text-[#94a3b8] text-sm mt-0.5">Manage your chama members</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="relative p-2 rounded-lg hover:bg-white/5 transition">
                <Bell size={20} className="text-[#94a3b8]" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#22c55e] rounded-full"></span>
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-[#22c55e] to-[#16a34a] rounded-lg text-white text-sm font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-green-500/30 transition"
              >
                <Plus size={18} />
                Add Member
              </button>
            </div>
          </div>

          {/* STATS GRID (2x2) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {/* Total Members */}
            <div className="rounded-[16px] p-4 flex items-start justify-between" style={{
              background: 'rgba(34, 197, 94, 0.08)',
              border: '1px solid rgba(34, 197, 94, 0.2)',
              boxShadow: '0 0 20px rgba(34, 197, 94, 0.1)',
            }}>
              <div>
                <p className="text-[#94a3b8] text-xs font-semibold tracking-wide mb-1">Total Members</p>
                <p className="text-[28px] font-bold text-[#22c55e]">{totalMembers}</p>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{
                background: 'rgba(34, 197, 94, 0.2)',
                boxShadow: '0 0 15px rgba(34, 197, 94, 0.3)',
              }}>
                <span className="text-[#22c55e] text-lg">👥</span>
              </div>
            </div>

            {/* Active Members */}
            <div className="rounded-[16px] p-4 flex items-start justify-between" style={{
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              boxShadow: '0 0 20px rgba(59, 130, 246, 0.1)',
            }}>
              <div>
                <p className="text-[#94a3b8] text-xs font-semibold tracking-wide mb-1">Active Members</p>
                <p className="text-[28px] font-bold text-[#3b82f6]">{activeCount}</p>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{
                background: 'rgba(59, 130, 246, 0.2)',
                boxShadow: '0 0 15px rgba(59, 130, 246, 0.3)',
              }}>
                <span className="text-[#3b82f6] text-lg">✓</span>
              </div>
            </div>

            {/* Defaulters */}
            <div className="rounded-[16px] p-4 flex items-start justify-between" style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              boxShadow: '0 0 20px rgba(239, 68, 68, 0.1)',
            }}>
              <div>
                <p className="text-[#94a3b8] text-xs font-semibold tracking-wide mb-1">Defaulters</p>
                <p className="text-[28px] font-bold text-[#ef4444]">{defaulterCount}</p>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{
                background: 'rgba(239, 68, 68, 0.2)',
                boxShadow: '0 0 15px rgba(239, 68, 68, 0.3)',
              }}>
                <AlertCircle size={20} className="text-[#ef4444]" />
              </div>
            </div>

            {/* New This Month */}
            <div className="rounded-[16px] p-4 flex items-start justify-between" style={{
              background: 'rgba(168, 85, 247, 0.08)',
              border: '1px solid rgba(168, 85, 247, 0.2)',
              boxShadow: '0 0 20px rgba(168, 85, 247, 0.1)',
            }}>
              <div>
                <p className="text-[#94a3b8] text-xs font-semibold tracking-wide mb-1">New This Month</p>
                <p className="text-[28px] font-bold text-[#a855f7]">{newThisMonth}</p>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{
                background: 'rgba(168, 85, 247, 0.2)',
                boxShadow: '0 0 15px rgba(168, 85, 247, 0.3)',
              }}>
                <span className="text-[#a855f7] text-lg">✨</span>
              </div>
            </div>
          </div>

          {/* SEARCH & FILTER SECTION */}
          <div className="mb-6">
            {/* Search Bar */}
            <div className="flex gap-2 mb-3">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                <input
                  type="text"
                  placeholder="Search by name, phone or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-[12px] bg-white/5 border border-white/10 pl-10 pr-4 py-2.5 text-white placeholder-[#94a3b8] text-sm focus:outline-none focus:border-[#22c55e] transition"
                />
              </div>
              <button className="p-2.5 rounded-[12px] bg-white/5 border border-white/10 hover:border-white/20 transition text-[#94a3b8] hover:text-white">
                <Settings size={18} />
              </button>
            </div>

            {/* Filter Chips */}
            <div className="flex flex-wrap gap-2 mb-3">
              {['all', 'active', 'inactive', 'suspended'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition ${
                    statusFilter === status
                      ? 'bg-[#22c55e] text-white'
                      : 'bg-white/5 text-[#94a3b8] border border-white/10 hover:border-white/20'
                  }`}
                >
                  {status === 'all' ? 'All Members' : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>

            {/* Sort Button */}
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[#94a3b8] text-xs font-medium hover:border-white/20 transition">
              <Settings size={14} />
              Newest First
              <ArrowDown size={12} />
            </button>
          </div>

          {/* MEMBERS LIST */}
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-[#94a3b8]">Loading members...</p>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="rounded-[16px] p-12 text-center" style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}>
              <p className="text-[#94a3b8] mb-4">No members found</p>
              <Button
                onClick={() => setIsModalOpen(true)}
                className="bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-white font-semibold py-2 px-4 rounded-lg"
              >
                Add First Member
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMembers.map((member) => {
                const initials = member.name?.split(' ').map((n: string) => n[0]).join('') || '?';
                const isDefaulter = member.status === 'suspended' || member.credit_score < 50;
                
                return (
                  <div
                    key={member.id}
                    className="rounded-[16px] p-4 flex items-center gap-4 hover:bg-white/5 transition"
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    {/* Avatar */}
                    <div className="relative">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#22c55e] to-[#16a34a] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        {initials}
                      </div>
                      <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#020617] ${
                        isDefaulter ? 'bg-[#ef4444]' : 'bg-[#22c55e]'
                      }`}></div>
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-semibold text-sm">{member.name}</h3>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          member.role === 'admin' ? 'bg-[#22c55e]/20 text-[#22c55e]' :
                          member.role === 'treasurer' ? 'bg-[#3b82f6]/20 text-[#3b82f6]' :
                          'bg-[#94a3b8]/20 text-[#94a3b8]'
                        }`}>
                          {member.role || 'Member'}
                        </span>
                      </div>
                      <p className="text-[#94a3b8] text-xs">{member.phone || 'N/A'}</p>
                      {isDefaulter && <p className="text-[#ef4444] text-xs font-semibold mt-0.5">Defaulter</p>}
                    </div>

                    {/* Financial Summary */}
                    <div className="text-right text-xs">
                      <p className="text-[#94a3b8] mb-1">Contributions</p>
                      <p className="text-white font-semibold">KES {(member.contributions_total || 0).toLocaleString()}</p>
                      <p className="text-[#94a3b8] mt-2 mb-1">Loan</p>
                      <p className="text-white font-semibold">KES {(member.loan_balance || 0).toLocaleString()}</p>
                    </div>

                    {/* Menu */}
                    <button className="p-2 text-[#94a3b8] hover:text-white hover:bg-white/10 rounded-lg transition flex-shrink-0">
                      <MoreVertical size={18} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* FAB - Floating Action Button with Expansion */}
        <div className="fixed bottom-28 md:bottom-6 right-4 z-40">
          {/* FAB Actions (Expanded) */}
          {isFabExpanded && (
            <div className="absolute bottom-16 right-0 space-y-3 flex flex-col items-center animate-in fade-in slide-in-from-bottom-2 duration-200">
              {/* Add Contribution */}
              <button className="w-14 h-14 rounded-full bg-gradient-to-br from-[#22c55e] to-[#16a34a] flex items-center justify-center text-white shadow-lg hover:shadow-green-500/50 transition hover:scale-110" title="Add Contribution">
                <ArrowDown size={24} />
              </button>

              {/* Give Loan */}
              <button className="w-14 h-14 rounded-full bg-gradient-to-br from-[#3b82f6] to-[#2563eb] flex items-center justify-center text-white shadow-lg hover:shadow-blue-500/50 transition hover:scale-110" title="Give Loan">
                <Zap size={24} />
              </button>

              {/* Add Fine */}
              <button className="w-14 h-14 rounded-full bg-gradient-to-br from-[#ef4444] to-[#dc2626] flex items-center justify-center text-white shadow-lg hover:shadow-red-500/50 transition hover:scale-110" title="Add Fine">
                <AlertCircle size={24} />
              </button>

              {/* Send Reminder */}
              <button className="w-14 h-14 rounded-full bg-gradient-to-br from-[#a855f7] to-[#9333ea] flex items-center justify-center text-white shadow-lg hover:shadow-purple-500/50 transition hover:scale-110" title="Send Reminder">
                <Send size={24} />
              </button>

              {/* Import Members */}
              <button className="w-14 h-14 rounded-full bg-gradient-to-br from-[#fb923c] to-[#ea580c] flex items-center justify-center text-white shadow-lg hover:shadow-orange-500/50 transition hover:scale-110" title="Import Members">
                <Upload size={24} />
              </button>
            </div>
          )}

          {/* Main FAB */}
          <button
            onClick={() => setIsFabExpanded(!isFabExpanded)}
            className="w-16 h-16 rounded-full bg-gradient-to-br from-[#22c55e] to-[#16a34a] flex items-center justify-center text-white shadow-lg hover:shadow-green-500/50 transition hover:scale-110 z-50"
            style={{
              boxShadow: '0 10px 30px rgba(34, 197, 94, 0.4)',
            }}
          >
            {isFabExpanded ? <X size={28} /> : <Plus size={28} />}
          </button>
        </div>
      </main>

      {/* Add Member Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Member"
      >
        <form onSubmit={handleAddMember} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="John Doe"
            value={formData.fullName}
            onChange={(e) =>
              setFormData({ ...formData, fullName: e.target.value })
            }
            error={errors.fullName}
          />

          <Input
            label="Phone Number"
            placeholder="+254712345678 or 0712345678"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            error={errors.phone}
          />

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-white font-semibold py-2 rounded-lg"
            isLoading={isSubmitting}
          >
            Add Member
          </Button>
        </form>
      </Modal>
    </div>
  );
}
