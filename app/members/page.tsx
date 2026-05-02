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

  const [fabExpanded, setFabExpanded] = useState(false);

  const statCards = [
    { label: 'Total Members', value: totalMembers, color: '#00FFB2', icon: '👥' },
    { label: 'Active Members', value: activeCount, color: '#3B82F6', icon: '✓' },
    { label: 'Defaulters', value: defaulterCount, color: '#EF4444', icon: '⚠' },
    { label: 'New This Month', value: newThisMonth, color: '#A855F7', icon: '✨' },
  ];

  return (
    <div style={{ background: 'linear-gradient(135deg, #0A0F1C 0%, #05070F 100%)', minHeight: '100vh', position: 'relative' }}>
      {/* Subtle radial glow */}
      <div style={{ position: 'fixed', top: '-50%', left: '50%', transform: 'translateX(-50%)', width: '100%', height: '100%', background: 'radial-gradient(circle at center, rgba(0,255,178,0.05) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <Navbar />
      <Sidebar />
      <BottomNav />

      <main style={{ position: 'relative', zIndex: 1, flexGrow: 1, marginLeft: 'auto', marginRight: 'auto', minHeight: '100vh', paddingTop: '70px', paddingBottom: '96px', background: 'transparent' }} className="md:ml-64 md:pt-6 md:pb-6">
        <div style={{ width: '100%', maxWidth: '1280px', marginLeft: 'auto', marginRight: 'auto', paddingLeft: '16px', paddingRight: '16px', paddingTop: '24px' }} className="md:px-6 md:py-6">
          
          {/* Header */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffffff', marginBottom: '8px' }} className="md:text-4xl">Members</h1>
                <p style={{ color: '#9CA3AF' }}>Manage your chama members</p>
              </div>
              <Button
                onClick={() => setIsModalOpen(true)}
                style={{ background: 'linear-gradient(135deg, #00FFB2 0%, #06D67D 100%)', color: '#ffffff', padding: '8px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', border: 'none', fontWeight: '600', transition: 'all 0.2s ease' }}
              >
                <Plus size={20} />
                <span className="hidden md:inline">Add Member</span>
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '16px', marginBottom: '32px' }} className="md:grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat, idx) => (
              <div
                key={idx}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid rgba(255,255,255,0.08)`,
                  backdropFilter: 'blur(12px)',
                  borderRadius: '18px',
                  padding: '16px',
                  height: '90px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: `0 0 20px ${stat.color}20`,
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <div>
                  <p style={{ color: '#9CA3AF', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                    {stat.label}
                  </p>
                  <p style={{ color: '#ffffff', fontSize: '28px', fontWeight: 'bold' }}>
                    {stat.value}
                  </p>
                </div>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: `rgba(${stat.color === '#00FFB2' ? '0,255,178' : stat.color === '#3B82F6' ? '59,130,246' : stat.color === '#EF4444' ? '239,68,68' : '168,85,247'}, 0.1)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    boxShadow: `0 0 15px ${stat.color}30`,
                  }}
                >
                  {stat.icon}
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
                style={{ background: 'linear-gradient(135deg, #00FFB2 0%, #06D67D 100%)', color: '#000', padding: '8px 16px', borderRadius: '12px', cursor: 'pointer', border: 'none', fontWeight: '600' }}
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

        {/* Floating Action Button - EXPANDED */}
        <div
          style={{
            position: 'fixed',
            bottom: '80px',
            right: '20px',
            zIndex: 40,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          {fabExpanded && (
            <>
              <button
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #00FFB2 0%, #06D67D 100%)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 0 20px rgba(0,255,178,0.3)',
                  transition: 'all 0.2s ease',
                  animation: 'slideUp 0.3s ease',
                }}
                title="Add Contribution"
              >
                <svg width="24" height="24" fill="#000" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
                </svg>
              </button>

              <button
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 0 20px rgba(59,130,246,0.3)',
                  transition: 'all 0.2s ease',
                  animation: 'slideUp 0.3s ease',
                }}
                title="Give Loan"
              >
                <svg width="24" height="24" fill="#fff" viewBox="0 0 24 24">
                  <path d="M19 6h-5V3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 10h-6v-2h6v2z" />
                </svg>
              </button>

              <button
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 0 20px rgba(239,68,68,0.3)',
                  transition: 'all 0.2s ease',
                  animation: 'slideUp 0.3s ease',
                }}
                title="Add Fine"
              >
                <svg width="24" height="24" fill="#fff" viewBox="0 0 24 24">
                  <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                </svg>
              </button>

              <button
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #A855F7 0%, #9333EA 100%)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 0 20px rgba(168,85,247,0.3)',
                  transition: 'all 0.2s ease',
                  animation: 'slideUp 0.3s ease',
                }}
                title="Send Reminder"
              >
                <svg width="24" height="24" fill="#fff" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                </svg>
              </button>

              <button
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 0 20px rgba(249,115,22,0.3)',
                  transition: 'all 0.2s ease',
                  animation: 'slideUp 0.3s ease',
                }}
                title="Import Members"
              >
                <svg width="24" height="24" fill="#fff" viewBox="0 0 24 24">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                </svg>
              </button>
            </>
          )}

          {/* Main FAB Button */}
          <button
            onClick={() => setFabExpanded(!fabExpanded)}
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: fabExpanded ? 'linear-gradient(135deg, #64748B 0%, #475569 100%)' : 'linear-gradient(135deg, #00FFB2 0%, #06D67D 100%)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '28px',
              color: fabExpanded ? '#fff' : '#000',
              fontWeight: 'bold',
              boxShadow: `0 10px 25px ${fabExpanded ? 'rgba(100,116,139,0.3)' : 'rgba(0,255,178,0.3)'}`,
              transition: 'all 0.3s ease',
              transform: 'scale(1)',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            {fabExpanded ? '✕' : '+'}
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
