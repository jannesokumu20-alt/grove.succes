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
import { Plus, Search, Phone, Calendar, MoreVertical } from 'lucide-react';

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
  const defaulterCount = members.filter(m => m.status === 'suspended' || m.status === 'inactive').length;
  const newThisMonth = members.filter(m => {
    const joinDate = new Date(m.joined_at || m.created_at);
    const now = new Date();
    return joinDate.getMonth() === now.getMonth() && joinDate.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div style={{ background: 'linear-gradient(135deg, #0A0F1C 0%, #05070F 100%)', minHeight: '100vh', position: 'relative' }}>
      {/* Subtle radial glow */}
      <div style={{ position: 'fixed', top: '-50%', left: '50%', transform: 'translateX(-50%)', width: '100%', height: '100%', background: 'radial-gradient(circle at center, rgba(0,255,178,0.05) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <Navbar />
      <Sidebar />
      <BottomNav />

      <main className="flex-1 md:ml-64 min-h-screen pt-[90px] md:pt-6 pb-[140px] md:pb-6 relative z-10 overflow-x-hidden">
        <div className="min-h-screen overflow-x-hidden md:px-6 md:py-6" style={{ width: '100%', maxWidth: '1280px', marginLeft: 'auto', marginRight: 'auto', paddingLeft: '16px', paddingRight: '16px', paddingTop: '24px' }}>
          
          {/* ===== MEMBERS HEADER + ACTIONS (FIXED & RESTORED) ===== */}
          <div className="sticky top-0 z-40 bg-[#0B1220]/95 backdrop-blur-lg border-b border-white/10">

            {/* TOP BAR */}
            <div className="flex items-center justify-between px-4 py-3">
              
              <div>
                <h1 className="text-2xl font-bold text-white">Members</h1>
                <p className="text-gray-400 text-sm">Manage your chama members</p>
              </div>

              {/* ADD MEMBER BUTTON (RESTORED) */}
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl 
                           bg-gradient-to-r from-green-500 to-emerald-600 
                           text-black font-semibold shadow-lg shadow-green-500/30
                           active:scale-95 transition"
              >
                <span className="text-lg">+</span>
                <span className="hidden sm:inline">Add Member</span>
              </button>

            </div>

            {/* ACTION BUTTONS ROW */}
            <div className="flex gap-3 px-4 pb-4 overflow-x-auto">

              {/* BULK IMPORT */}
              <button
                onClick={() => toast.custom('Bulk import coming soon')}
                className="flex items-center gap-2 px-4 py-2 rounded-full 
                           border border-white/10 text-white 
                           bg-white/5 backdrop-blur-md
                           hover:bg-white/10 transition whitespace-nowrap"
              >
                📤 <span>Bulk Import</span>
              </button>

              {/* SEND REMINDER */}
              <button
                onClick={() => toast.custom('Send reminder coming soon')}
                className="flex items-center gap-2 px-4 py-2 rounded-full 
                           border border-white/10 text-white 
                           bg-white/5 backdrop-blur-md
                           hover:bg-white/10 transition whitespace-nowrap"
              >
                ✉️ <span>Send Reminder</span>
              </button>

            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              {
                title: 'Total Members',
                value: totalMembers,
                subtitle: 'All members',
                change: totalMembers > 0 ? '+' + totalMembers : '0',
                color: '#00D084',
                bg: 'rgba(0,208,132,0.08)',
                iconBg: 'rgba(0,208,132,0.15)',
                icon: '👥'
              },
              {
                title: 'Active Members',
                value: activeCount,
                subtitle: totalMembers > 0 ? Math.round((activeCount/totalMembers)*100) + '% active' : '0%',
                change: activeCount > 0 ? '+' + activeCount : '0',
                color: '#3B82F6',
                bg: 'rgba(59,130,246,0.08)',
                iconBg: 'rgba(59,130,246,0.15)',
                icon: '✓'
              },
              {
                title: 'Defaulters',
                value: defaulterCount,
                subtitle: totalMembers > 0 ? Math.round((defaulterCount/totalMembers)*100) + '% defaulters' : '0%',
                change: defaulterCount > 0 ? '+' + defaulterCount : '0',
                color: '#F97316',
                bg: 'rgba(249,115,22,0.08)',
                iconBg: 'rgba(249,115,22,0.15)',
                icon: '⚠'
              },
              {
                title: 'New This Month',
                value: newThisMonth,
                subtitle: 'New joiners',
                change: newThisMonth > 0 ? '+' + newThisMonth : '0',
                color: '#A855F7',
                bg: 'rgba(168,85,247,0.08)',
                iconBg: 'rgba(168,85,247,0.15)',
                icon: '✨'
              },
            ].map((card, i) => (
              <div
                key={i}
                className="rounded-[16px] p-4 flex flex-col justify-between h-[130px] transition hover:scale-[1.02]"
                style={{
                  background: card.bg,
                  border: '1px solid rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: `0 0 0px ${card.color}00, inset 0 1px 1px rgba(255,255,255,0.05)`
                }}
              >
                {/* TOP */}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] text-[#9CA3AF] font-medium">
                      {card.title}
                    </p>
                  </div>
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{
                      background: card.iconBg,
                      boxShadow: `0 0 20px ${card.color}40`
                    }}
                  >
                    <span style={{ color: card.color }}>
                      {card.icon}
                    </span>
                  </div>
                </div>

                {/* VALUE */}
                <div>
                  <p
                    className="text-[22px] font-bold text-white leading-tight"
                    style={{
                      textShadow: `0 0 12px ${card.color}60`
                    }}
                  >
                    {card.value}
                  </p>
                  <p className="text-[11px] text-[#9CA3AF]">
                    {card.subtitle}
                  </p>
                </div>

                {/* CHANGE */}
                <div>
                  <p
                    className="text-[11px] font-medium flex items-center gap-1"
                    style={{
                      color: card.change.includes('-') ? '#EF4444' : card.color
                    }}
                  >
                    {card.change.includes('-') ? '↓' : '↑'} {card.change}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Search Bar */}
          <div style={{ marginBottom: '24px' }}>
            <div
              style={{
                width: '100%',
                height: '48px',
                borderRadius: '14px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                paddingLeft: '12px',
                paddingRight: '12px',
              }}
            >
              <Search size={20} style={{ color: '#9CA3AF', marginRight: '12px' }} />
              <input
                type="text"
                placeholder="Search by name, phone or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  flex: 1,
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  marginLeft: '8px',
                  transition: 'all 0.2s ease',
                }}
              >
                <svg width="16" height="16" fill="#9CA3AF" viewBox="0 0 24 24">
                  <path d="M3 6h18M3 12h18M3 18h18" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
            {['all', 'active', 'inactive', 'suspended'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                style={{
                  height: '40px',
                  padding: '0 16px',
                  borderRadius: '20px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: statusFilter === status ? 'linear-gradient(135deg, #00FFB2 0%, #06D67D 100%)' : 'transparent',
                  color: statusFilter === status ? '#000' : '#9CA3AF',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                  boxShadow: statusFilter === status ? '0 0 15px rgba(0,255,178,0.3)' : 'none',
                }}
              >
                {status === 'all' ? 'All Members' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          {/* Sort Button */}
          <div style={{ marginBottom: '24px' }}>
            <button
              style={{
                height: '40px',
                paddingLeft: '16px',
                paddingRight: '16px',
                borderRadius: '20px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.05)',
                color: '#9CA3AF',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
              }}
            >
              <svg width="16" height="16" fill="#9CA3AF" viewBox="0 0 24 24">
                <path d="M10 3a1 1 0 0 1 .894.553l7 14a1 1 0 1 1-1.788.894l-1.447-2.894H6.341l-1.447 2.894a1 1 0 1 1-1.788-.894l7-14A1 1 0 0 1 10 3z" />
              </svg>
              Newest First
              <svg width="12" height="12" fill="#9CA3AF" viewBox="0 0 24 24">
                <path d="M7 10l5 5 5-5z" />
              </svg>
            </button>
          </div>

          {/* Members List */}
          {isLoading ? (
            <div style={{ textAlign: 'center', paddingTop: '48px' }}>
              <p style={{ color: '#9CA3AF' }}>Loading members...</p>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', backdropFilter: 'blur(12px)', padding: '48px 24px', textAlign: 'center' }}>
              <p style={{ color: '#9CA3AF', marginBottom: '16px' }}>No members found</p>
              <Button
                onClick={() => setIsModalOpen(true)}
                className="bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-black font-semibold"
                style={{ padding: '8px 16px', borderRadius: '12px', cursor: 'pointer', border: 'none', boxShadow: '0 0 20px rgba(34,197,94,0.5)' }}
              >
                Add First Member
              </Button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }} className="md:grid-cols-2 lg:grid-cols-3">
              {filteredMembers.map((member) => (
                <div
                  key={member.id}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '16px',
                    backdropFilter: 'blur(12px)',
                    padding: '14px',
                    height: '85px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.boxShadow = 'inset 0 0 20px rgba(0,255,178,0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                >
                  {/* Left colored line */}
                  <div
                    style={{
                      width: '3px',
                      height: '100%',
                      borderRadius: '2px',
                      background: member.status === 'active' ? '#00FFB2' : '#EF4444',
                      opacity: 0.6,
                    }}
                  />

                  {/* Avatar */}
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      minWidth: '44px',
                      borderRadius: '50%',
                      background: member.status === 'active' ? 'linear-gradient(135deg, #00FFB2 0%, #06D67D 100%)' : 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#000',
                      fontWeight: 'bold',
                      fontSize: '16px',
                      position: 'relative',
                    }}
                  >
                    {member.name?.charAt(0).toUpperCase() || '?'}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '0px',
                        right: '0px',
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: member.status === 'active' ? '#00FFB2' : '#EF4444',
                        border: '2px solid rgba(255,255,255,0.05)',
                      }}
                    />
                  </div>

                  {/* Center info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '14px', marginBottom: '2px' }}>
                      {member.name}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', background: member.role === 'admin' ? 'rgba(0,255,178,0.2)' : 'rgba(148,163,184,0.2)', color: member.role === 'admin' ? '#00FFB2' : '#CBD5E1', padding: '2px 8px', borderRadius: '4px' }}>
                        {member.role || 'Member'}
                      </span>
                      <span style={{ fontSize: '12px', color: '#9CA3AF' }} title={member.phone}>
                        {member.phone || 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Right financial info */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <div style={{ fontSize: '12px' }}>
                      <span style={{ color: '#9CA3AF' }}>Contrib: </span>
                      <span style={{ color: '#00FFB2', fontWeight: 'bold' }}>KSh 0</span>
                    </div>
                    <div style={{ fontSize: '12px' }}>
                      <span style={{ color: '#9CA3AF' }}>Loan: </span>
                      <span style={{ color: '#3B82F6', fontWeight: 'bold' }}>KSh 0</span>
                    </div>
                  </div>

                  {/* Menu icon */}
                  <button
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      background: 'rgba(255,255,255,0.05)',
                      border: 'none',
                      color: '#9CA3AF',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  >
                    <MoreVertical size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FLOATING ACTION MENU - CLEAN LABELED VERSION */}
        <div className="fixed bottom-24 right-4 flex flex-col items-end gap-3 z-50">

          {/* ADD MEMBER */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-3 bg-green-500 text-black 
                       px-4 py-3 rounded-full shadow-lg shadow-green-500/40"
          >
            ➕ <span className="text-sm font-medium">Add Member</span>
          </button>

          {/* BULK IMPORT */}
          <button
            onClick={() => toast.custom('Bulk import coming soon')}
            className="flex items-center gap-3 bg-blue-500 text-white 
                       px-4 py-3 rounded-full shadow-lg"
          >
            📤 <span className="text-sm">Bulk Import</span>
          </button>

          {/* SEND REMINDER */}
          <button
            onClick={() => toast.custom('Send reminder coming soon')}
            className="flex items-center gap-3 bg-purple-500 text-white 
                       px-4 py-3 rounded-full shadow-lg"
          >
            ✉️ <span className="text-sm">Reminders</span>
          </button>

        </div>

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
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 rounded-lg"
              isLoading={isSubmitting}
            >
              Add Member
            </Button>
          </form>
        </Modal>

        <style>{`
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </main>
    </div>
  );
}
