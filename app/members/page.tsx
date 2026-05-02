'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import BottomNav from '@/components/BottomNav';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Modal from '@/components/Modal';
import { useAuth } from '@/hooks/useAuth';
import { useRBAC } from '@/hooks/useRBAC';
import { useToast } from '@/hooks/useToast';
import { useChamaStore } from '@/store/useChamaStore';
import { getMembers, addMember } from '@/lib/supabase';
import { isValidPhoneNumber } from '@/lib/utils';
import { Plus, Search, Bell, Settings, X, ArrowDown, AlertCircle, Zap, Send, Upload, MoreVertical } from 'lucide-react';

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
  const [formData, setFormData] = useState({ fullName: '', phone: '' });
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
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.phone) newErrors.phone = 'Phone number is required';
    else if (!isValidPhoneNumber(formData.phone)) newErrors.phone = 'Invalid Kenyan phone number';
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
    <div className="min-h-screen" style={{
      background: 'linear-gradient(180deg, #0A0F1C 0%, #05070F 100%)',
      position: 'relative',
    }}>
      <div style={{
        position: 'fixed',
        top: 0,
        left: '50%',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(0,255,178,0.05) 0%, transparent 70%)',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 0,
      }}></div>

      <Navbar />
      <Sidebar />
      <BottomNav />

      <main className="flex-1 md:ml-64 min-h-screen pt-[70px] md:pt-6 pb-32 md:pb-6 relative z-10">
        <div className="w-full px-4 md:max-w-6xl mx-auto py-6">

          {/* HEADER */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-[32px] font-bold text-white">Members</h1>
              <p className="text-[#9CA3AF] text-sm mt-1">Manage your chama members</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="relative p-2.5 rounded-lg hover:bg-white/5 transition">
                <Bell size={20} className="text-[#9CA3AF]" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#00FFB2] rounded-full"></span>
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-[#00FFB2] to-[#00D4AA] rounded-lg text-black text-sm font-semibold flex items-center gap-2 hover:shadow-lg transition"
                style={{ boxShadow: '0 0 20px rgba(0,255,178,0.3)' }}
              >
                <Plus size={18} />
                Add Member
              </button>
            </div>
          </div>

          {/* STATS CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Total Members', value: totalMembers, color: '#00FFB2', icon: '👥', bgColor: 'rgba(0,255,178,0.08)', borderColor: 'rgba(0,255,178,0.2)' },
              { label: 'Active Members', value: activeCount, color: '#3B82F6', icon: '✓', bgColor: 'rgba(59,130,246,0.08)', borderColor: 'rgba(59,130,246,0.2)' },
              { label: 'Defaulters', value: defaulterCount, color: '#EF4444', icon: '⚠', bgColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' },
              { label: 'New This Month', value: newThisMonth, color: '#A855F7', icon: '✨', bgColor: 'rgba(168,85,247,0.08)', borderColor: 'rgba(168,85,247,0.2)' },
            ].map((stat, i) => (
              <div key={i} className="rounded-[16px] p-4 flex items-start justify-between" style={{
                background: stat.bgColor,
                border: `1px solid ${stat.borderColor}`,
                boxShadow: `0 0 20px ${stat.color}15`,
              }}>
                <div>
                  <p className="text-[#9CA3AF] text-xs font-semibold tracking-wide mb-1">{stat.label}</p>
                  <p className="text-[28px] font-bold" style={{ color: stat.color }}>{stat.value}</p>
                </div>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{
                  background: `${stat.color}20`,
                  boxShadow: `0 0 15px ${stat.color}30`,
                }}>
                  <span className="text-lg">{stat.icon}</span>
                </div>
              </div>
            ))}
          </div>

          {/* SEARCH & FILTER */}
          <div className="mb-6">
            <div className="flex gap-2 mb-3">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                <input
                  type="text"
                  placeholder="Search by name, phone or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-[12px] bg-white/5 border border-white/10 pl-10 pr-4 py-2.5 text-white placeholder-[#9CA3AF] text-sm focus:outline-none focus:border-[#00FFB2] transition"
                />
              </div>
              <button className="p-2.5 rounded-[12px] bg-white/5 border border-white/10 hover:border-white/20 transition text-[#9CA3AF] hover:text-white">
                <Settings size={18} />
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {['all', 'active', 'inactive', 'suspended'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition ${
                    statusFilter === status
                      ? 'bg-gradient-to-r from-[#00FFB2] to-[#00D4AA] text-black'
                      : 'bg-white/5 text-[#9CA3AF] border border-white/10 hover:border-white/20'
                  }`}
                >
                  {status === 'all' ? 'All Members' : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>

            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[#9CA3AF] text-xs font-medium hover:border-white/20 transition">
              <Settings size={14} />
              Newest First
              <ArrowDown size={12} />
            </button>
          </div>

          {/* MEMBERS LIST */}
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-[#9CA3AF]">Loading members...</p>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="rounded-[16px] p-12 text-center" style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}>
              <p className="text-[#9CA3AF] mb-4">No members found</p>
              <Button
                onClick={() => setIsModalOpen(true)}
                className="bg-gradient-to-r from-[#00FFB2] to-[#00D4AA] text-black font-semibold py-2 px-4 rounded-lg"
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
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#00FFB2] to-[#00D4AA] flex items-center justify-center text-black font-bold text-lg flex-shrink-0">
                        {initials}
                      </div>
                      <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0A0F1C] ${
                        isDefaulter ? 'bg-[#EF4444]' : 'bg-[#00FFB2]'
                      }`}></div>
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-semibold text-sm">{member.name}</h3>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          member.role === 'admin' ? 'bg-[#00FFB2]/20 text-[#00FFB2]' :
                          member.role === 'treasurer' ? 'bg-[#3B82F6]/20 text-[#3B82F6]' :
                          'bg-[#9CA3AF]/20 text-[#9CA3AF]'
                        }`}>
                          {member.role || 'Member'}
                        </span>
                      </div>
                      <p className="text-[#9CA3AF] text-xs">{member.phone || 'N/A'}</p>
                      {isDefaulter && <p className="text-[#EF4444] text-xs font-semibold mt-0.5">Defaulter</p>}
                    </div>

                    {/* Financial */}
                    <div className="text-right text-xs">
                      <p className="text-[#9CA3AF] mb-1">Contributions</p>
                      <p className="text-white font-semibold">KES {(member.contributions_total || 0).toLocaleString()}</p>
                      <p className="text-[#9CA3AF] mt-2 mb-1">Loan</p>
                      <p className="text-white font-semibold">KES {(member.loan_balance || 0).toLocaleString()}</p>
                    </div>

                    {/* Menu */}
                    <button className="p-2 text-[#9CA3AF] hover:text-white hover:bg-white/10 rounded-lg transition flex-shrink-0">
                      <MoreVertical size={18} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* FAB */}
          <div className="fixed bottom-28 md:bottom-6 right-4 z-40">
            {isFabExpanded && (
              <div className="absolute bottom-16 right-0 space-y-3 flex flex-col items-center animate-in fade-in slide-in-from-bottom-2 duration-200">
                <button className="w-14 h-14 rounded-full bg-gradient-to-br from-[#00FFB2] to-[#00D4AA] flex items-center justify-center text-black shadow-lg hover:shadow-green-500/50 transition hover:scale-110" title="Add Contribution">
                  <Plus size={24} />
                </button>
                <button className="w-14 h-14 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#2563EB] flex items-center justify-center text-white shadow-lg hover:shadow-blue-500/50 transition hover:scale-110" title="Give Loan">
                  <Zap size={24} />
                </button>
                <button className="w-14 h-14 rounded-full bg-gradient-to-br from-[#EF4444] to-[#DC2626] flex items-center justify-center text-white shadow-lg hover:shadow-red-500/50 transition hover:scale-110" title="Add Fine">
                  <AlertCircle size={24} />
                </button>
                <button className="w-14 h-14 rounded-full bg-gradient-to-br from-[#A855F7] to-[#9333EA] flex items-center justify-center text-white shadow-lg hover:shadow-purple-500/50 transition hover:scale-110" title="Send Reminder">
                  <Send size={24} />
                </button>
                <button className="w-14 h-14 rounded-full bg-gradient-to-br from-[#FB923C] to-[#EA580C] flex items-center justify-center text-white shadow-lg hover:shadow-orange-500/50 transition hover:scale-110" title="Import Members">
                  <Upload size={24} />
                </button>
              </div>
            )}
            <button
              onClick={() => setIsFabExpanded(!isFabExpanded)}
              className="w-16 h-16 rounded-full bg-gradient-to-br from-[#00FFB2] to-[#00D4AA] flex items-center justify-center text-black shadow-lg hover:shadow-green-500/50 transition hover:scale-110 z-50"
              style={{ boxShadow: '0 10px 30px rgba(0, 255, 178, 0.4)' }}
            >
              {isFabExpanded ? <X size={28} /> : <Plus size={28} />}
            </button>
          </div>
        </div>

        {/* Modal */}
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
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              error={errors.fullName}
            />
            <Input
              label="Phone Number"
              placeholder="+254712345678 or 0712345678"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              error={errors.phone}
            />
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-[#00FFB2] to-[#00D4AA] text-black font-semibold py-2 rounded-lg"
              isLoading={isSubmitting}
            >
              Add Member
            </Button>
          </form>
        </Modal>
      </main>
    </div>
  );
}
