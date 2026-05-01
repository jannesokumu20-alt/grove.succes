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

  const activeCount = members.filter(m => m.status === 'active').length;
  const inactiveCount = members.filter(m => m.status !== 'active').length;

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <Sidebar />
      <BottomNav />

      <main className="flex-1 md:ml-64 min-h-screen bg-slate-950 pt-[70px] md:pt-6 pb-24 md:pb-6">
        <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Members</h1>
                <p className="text-slate-400">Manage and track your chama members</p>
              </div>
              <Button
                onClick={() => setIsModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2"
              >
                <Plus size={20} />
                <span className="hidden md:inline">Add Member</span>
              </Button>
            </div>
          </div>

          {/* Member Count Badges */}
          <div className="grid grid-cols-3 md:grid-cols-3 gap-3 mb-8">
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Total Members</p>
              <p className="text-2xl font-bold text-white">{members.length}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Active</p>
              <p className="text-2xl font-bold text-emerald-400">{activeCount}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Inactive</p>
              <p className="text-2xl font-bold text-orange-400">{inactiveCount}</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mb-8 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-600"
              />
            </div>
            <div className="flex gap-2">
              {['all', 'active'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    statusFilter === status
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-emerald-600'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Members Grid */}
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-slate-400">Loading members...</p>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-12 text-center">
              <p className="text-slate-400 mb-4">No members found</p>
              <Button
                onClick={() => setIsModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-lg"
              >
                Add First Member
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMembers.map((member) => (
                <div
                  key={member.id}
                  className="bg-slate-900 border border-slate-800 rounded-lg p-6 hover:border-slate-700 transition"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center text-white font-bold text-lg">
                      {member.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <button className="text-slate-400 hover:text-white">
                      <MoreVertical size={20} />
                    </button>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">{member.name}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Phone size={16} />
                      <span>{member.phone || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Calendar size={16} />
                      <span>{formatDate(member.joined_at || member.created_at)}</span>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <Badge
                      variant={member.status === 'active' ? 'green' : 'yellow'}
                    >
                      {member.status || 'active'}
                    </Badge>
                    {member.credit_score !== undefined && (
                      <Badge
                        variant={member.credit_score >= 75 ? 'green' : member.credit_score >= 50 ? 'yellow' : 'red'}
                      >
                        {member.credit_score}/100
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
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
      </main>
    </div>
  );
}
