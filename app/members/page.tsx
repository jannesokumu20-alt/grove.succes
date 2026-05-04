'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useRBAC } from '@/hooks/useRBAC';
import { useToast } from '@/hooks/useToast';
import { useChamaStore } from '@/store/useChamaStore';
import { getMembers, addMember } from '@/lib/supabase';
import { isValidPhoneNumber } from '@/lib/utils';
import { Plus, Search } from 'lucide-react';

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
      <div className="members-header">
        <div className="header-left">
          <button onClick={() => router.back()} className="back-btn" />
          <div>
            <h1>Members</h1>
            <p>Manage your chama members</p>
          </div>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="add-btn" />
      </div>

      {/* STATS CARDS */}
      <div className="members-stats">
        {statCards.map((stat, idx) => (
          <div key={idx} className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div>
                <p style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '4px' }}>{stat.label}</p>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff' }}>{stat.value}</p>
              </div>
              <div style={{ fontSize: '24px' }}>{stat.icon}</div>
            </div>
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
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <p style={{ color: '#9CA3AF', marginBottom: '16px' }}>No members found</p>
          <button onClick={() => setIsModalOpen(true)} className="add-btn" style={{ margin: '0 auto' }}>
            Add Member
          </button>
        </div>
      ) : (
        <div className="members-list">
          {filteredMembers.map((member) => (
            <div key={member.id} className="member-item">
              <div className="member-left">
                <div className="avatar green" style={{ fontSize: '18px' }}>
                  {member.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <div className="name-line" style={{ width: '120px' }} />
                  <div className="role-line" style={{ width: '80px', marginTop: '6px' }} />
                </div>
              </div>
              <div className="member-right">
                <div className={`status ${member.status === 'active' ? 'active' : ''}`} />
                <div className="arrow" />
              </div>
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
