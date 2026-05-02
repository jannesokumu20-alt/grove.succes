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

          {/* STATS CARDS - MEMBERS SUMMARY (ULTRA BOLD & VIBRANT) */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {[
              { label: 'Total Members', value: totalMembers, color: '#00D084', borderColor: '#00D084', icon: '👥', bgColor: '#0C1A14', glowColor: '#00D084' },
              { label: 'Active Members', value: activeCount, color: '#3B82F6', borderColor: '#3B82F6', icon: '✓', bgColor: '#0C1620', glowColor: '#3B82F6' },
              { label: 'Defaulters', value: defaulterCount, color: '#EF4444', borderColor: '#EF4444', icon: '⚠', bgColor: '#1A0C0C', glowColor: '#EF4444' },
              { label: 'New This Month', value: newThisMonth, color: '#A855F7', borderColor: '#A855F7', icon: '✨', bgColor: '#140A1F', glowColor: '#A855F7' },
            ].map((stat, i) => (
              <div 
                key={i} 
                className="rounded-[14px] px-4 py-5 flex flex-col items-start justify-between transition-all hover:scale-105 cursor-pointer group h-[120px]" 
                style={{
                  background: stat.bgColor,
                  border: `2.5px solid ${stat.borderColor}`,
                  boxShadow: `0 0 50px ${stat.glowColor}70, 0 0 100px ${stat.glowColor}30, inset 0 1px 2px rgba(255,255,255,0.1)`,
                }}
              >
                {/* Top: Title + Icon */}
                <div className="w-full flex items-start justify-between">
                  <p className="text-[#AEB6C2] text-xs font-bold tracking-widest uppercase leading-tight">{stat.label}</p>
                  
                  {/* Icon Circle - ULTRA BOLD */}
                  <div 
                    className="flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-120"
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      background: stat.color,
                      boxShadow: `0 0 40px ${stat.color}a0, 0 0 80px ${stat.color}60, inset 0 1px 3px rgba(255,255,255,0.2)`,
                      border: `2px solid ${stat.color}`,
                    }}
                  >
                    <span className="text-xl text-white" style={{
                      filter: `drop-shadow(0 0 8px ${stat.glowColor}ff)`,
                      textShadow: `0 0 8px ${stat.glowColor}ff`
                    }}>
                      {stat.icon}
                    </span>
                  </div>
                </div>

                {/* Bottom: Value */}
                <p className="text-[32px] font-bold text-white leading-none mt-1" style={{ 
                  textShadow: `0 0 20px ${stat.glowColor}c0, 0 0 40px ${stat.glowColor}60`
                }}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          {/* SEARCH & FILTER BAR */}
          <div className="mb-6">
            {/* Search Input */}
            <div className="flex gap-3 mb-4">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                <input
                  type="text"
                  placeholder="Search by name, phone or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-[14px] bg-white/5 border border-white/12 pl-12 pr-12 py-3 text-white placeholder-[#6B7280] text-sm focus:outline-none focus:border-[#00D084]/50 focus:bg-white/8 transition"
                  style={{
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  }}
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-[10px] bg-white/8 border border-white/12 hover:bg-white/12 transition text-[#9CA3AF] hover:text-white">
                  <Settings size={16} />
                </button>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-2 mb-4">
              {['all', 'active', 'inactive', 'suspended'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition ${
                    statusFilter === status
                      ? 'bg-gradient-to-r from-[#00D084] to-[#00B869] text-black shadow-lg'
                      : 'bg-transparent text-[#9CA3AF] border border-white/20 hover:border-white/40'
                  }`}
                >
                  {status === 'all' ? 'All Members' : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>

            {/* Sort Button */}
            <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/12 text-[#9CA3AF] text-xs font-bold hover:bg-white/8 hover:border-white/20 transition" style={{
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}>
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
                    className="rounded-[14px] p-4 flex items-center gap-3 hover:bg-white/8 transition group"
                    style={{
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1.5px solid rgba(255, 255, 255, 0.12)',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                    }}
                  >
                    {/* LEFT: Colored Line + Avatar */}
                    <div className="flex items-center gap-3">
                      {/* Vertical Color Line */}
                      <div className={`w-1 h-16 rounded-full flex-shrink-0 transition ${
                        member.status === 'suspended' || member.credit_score < 50 ? 'bg-[#EF4444]' : 'bg-[#00D084]'
                      }`} style={{
                        boxShadow: member.status === 'suspended' || member.credit_score < 50 
                          ? '0 0 16px rgba(239,68,68,0.6)' 
                          : '0 0 16px rgba(0,208,132,0.6)'
                      }}></div>

                      {/* Avatar */}
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#00FFB2] to-[#00D4AA] flex items-center justify-center text-black font-bold text-base flex-shrink-0 group-hover:scale-110 transition">
                        {initials}
                      </div>
                    </div>

                    {/* CENTER: Name, Role, Phone */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-bold text-sm leading-tight">{member.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs font-bold px-2 py-1 rounded-md truncate ${
                          member.role === 'admin' ? 'bg-[#00FFB2]/20 text-[#00FFB2]' :
                          member.role === 'treasurer' ? 'bg-[#3B82F6]/20 text-[#3B82F6]' :
                          'bg-[#9CA3AF]/20 text-[#9CA3AF]'
                        }`}>
                          {member.role ? member.role.charAt(0).toUpperCase() + member.role.slice(1) : 'Member'}
                        </span>
                        {(member.status === 'suspended' || member.credit_score < 50) && (
                          <span className="text-xs font-bold px-2 py-1 rounded-md bg-[#EF4444]/20 text-[#EF4444]">Defaulter</span>
                        )}
                      </div>
                      <p className="text-[#9CA3AF] text-xs mt-1">{member.phone || 'No phone'}</p>
                    </div>

                    {/* RIGHT: Financial Stats */}
                    <div className="text-right text-xs flex-shrink-0 mr-2">
                      <p className="text-[#9CA3AF] text-xs mb-1">Contributions</p>
                      <p className="text-[#00D084] font-bold text-sm">KES {(member.contributions_total || 0).toLocaleString()}</p>
                      <p className="text-[#9CA3AF] text-xs mt-3 mb-1">Loan</p>
                      <p className="text-[#3B82F6] font-bold text-sm">KES {(member.loan_balance || 0).toLocaleString()}</p>
                    </div>

                    {/* FAR RIGHT: Menu */}
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
