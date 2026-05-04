'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useRBAC } from '@/hooks/useRBAC';
import { useToast } from '@/hooks/useToast';
import { useChamaStore } from '@/store/useChamaStore';
import { getMembers, addMember } from '@/lib/supabase';
import { isValidPhoneNumber } from '@/lib/utils';
import { Plus, Search, Bell, Upload, Send, Zap } from 'lucide-react';

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

    if (!chama) {
      setIsLoading(false);
      return;
    }

    const loadMembers = async () => {
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
  }, [chama, toast, rbacLoading]);

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

  const statCards = [
    { label: 'Total Members', value: totalMembers, color: '#22c55e', icon: '👥' },
    { label: 'Active Members', value: activeCount, color: '#3B82F6', icon: '✓' },
    { label: 'Defaulters', value: defaulterCount, color: '#EF4444', icon: '⚠' },
    { label: 'New This Month', value: newThisMonth, color: '#A855F7', icon: '✨' },
  ];

  return (
    <div className="members-page">
      {/* HEADER */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[36px] md:text-[40px] font-bold text-white tracking-tight">
            Members
          </h1>
          <p className="text-[#9CA3AF] text-sm mt-2">
            Manage your chama members
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Notifications */}
          <button className="relative p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
            <Bell size={20} className="text-[#9CA3AF]" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-[#00FFB2] rounded-full"></span>
          </button>

          {/* Profile */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00FFB2] to-[#00D4AA] flex items-center justify-center text-black font-bold">
            U
          </div>
        </div>
      </div>

      {/* ACTION BAR */}
      <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2">
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#00FFB2] to-[#00D4AA] text-black text-sm font-semibold whitespace-nowrap">
          <Plus size={16} />
          Add Member
        </button>

        <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white text-sm whitespace-nowrap hover:bg-white/10 transition">
          <Upload size={16} />
          Bulk Import
        </button>

        <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white text-sm whitespace-nowrap hover:bg-white/10 transition">
          <Send size={16} />
          Send Reminder
        </button>

        <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white text-sm whitespace-nowrap hover:bg-white/10 transition">
          <Zap size={16} />
          Assign Loan
        </button>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {statCards.map((stat, idx) => (
          <div key={idx} className="rounded-[16px] px-4 py-5 flex flex-col justify-between h-[130px] transition hover:scale-[1.03] bg-white/5 border border-white/10">
            <div>
              <p style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '4px' }}>{stat.label}</p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff' }}>{stat.value}</p>
            </div>
            <div style={{ fontSize: '24px' }}>{stat.icon}</div>
          </div>
        ))}
      </div>

      {/* SEARCH */}
      <div className="members-search">
        <div className="search-left">
          <Search size={18} style={{ color: '#9CA3AF', minWidth: '18px' }} />
          <input
            type="text"
            placeholder="Search members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#fff',
              flex: 1,
              outline: 'none',
              fontSize: '14px',
            }}
          />
        </div>
        <button className="filter-btn" />
      </div>

      {/* FILTER TABS */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '16px', marginBottom: '16px', overflowX: 'auto' }}>
        {['all', 'active', 'inactive', 'suspended'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: `1px solid ${statusFilter === status ? '#22c55e' : 'rgba(255,255,255,0.1)'}`,
              background: statusFilter === status ? 'rgba(34,197,94,0.1)' : 'transparent',
              color: statusFilter === status ? '#22c55e' : '#9CA3AF',
              fontWeight: '500',
              cursor: 'pointer',
              fontSize: '12px',
              transition: 'all 0.2s',
            }}
          >
            {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* MEMBERS LIST */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-[#9CA3AF]">Loading members...</p>
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="rounded-[16px] p-10 text-center bg-white/5 border border-white/10">
          <p className="text-[#9CA3AF] mb-3">No members yet</p>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2 rounded-lg bg-gradient-to-r from-[#00FFB2] to-[#00D4AA] text-black font-semibold"
          >
            Add Member
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMembers.map((member) => (
            <div key={member.id} className="rounded-[16px] p-4 flex items-center gap-4 bg-white/5 border border-white/10 hover:bg-white/10 transition">
              <div className="avatar green" style={{ fontSize: '18px', width: '44px', height: '44px', minWidth: '44px' }}>
                {member.name?.charAt(0).toUpperCase() || '?'}
              </div>
              <div className="flex-1">
                <p style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '14px', marginBottom: '2px' }}>
                  {member.name}
                </p>
                <p style={{ color: '#9CA3AF', fontSize: '12px' }}>
                  {member.phone || 'N/A'}
                </p>
              </div>
              <div className={`status ${member.status === 'active' ? 'active' : ''}`} style={{ width: '12px', height: '12px', borderRadius: '50%', background: member.status === 'active' ? '#00FFB2' : '#EF4444' }} />
            </div>
          ))}
        </div>
      )}

      {/* MODAL */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'flex-end',
          zIndex: 50,
        }}>
          <div style={{
            background: '#0a1a2f',
            width: '100%',
            borderRadius: '20px 20px 0 0',
            padding: '24px',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}>
            <h2 style={{ color: '#fff', marginBottom: '16px' }}>Add Member</h2>
            <form onSubmit={handleAddMember}>
              <input
                type="text"
                placeholder="Full Name"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  marginBottom: '12px',
                  outline: 'none',
                }}
              />
              {errors.fullName && <p style={{ color: '#EF4444', fontSize: '12px', marginBottom: '8px' }}>{errors.fullName}</p>}
              
              <input
                type="tel"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  marginBottom: '12px',
                  outline: 'none',
                }}
              />
              {errors.phone && <p style={{ color: '#EF4444', fontSize: '12px', marginBottom: '8px' }}>{errors.phone}</p>}
              
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#22c55e',
                  color: '#000',
                  borderRadius: '8px',
                  border: 'none',
                  fontWeight: '600',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.6 : 1,
                  marginBottom: '8px',
                }}
              >
                {isSubmitting ? 'Adding...' : 'Add Member'}
              </button>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'transparent',
                  color: '#9CA3AF',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}

      {/* BOTTOM NAV SPACING */}
      <div className="bottom-space" />
    </div>
  );
}
