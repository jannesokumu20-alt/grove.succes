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
import { formatDate, isValidPhoneNumber, formatCurrency } from '@/lib/utils';
import { isDevMode } from '@/lib/devMode';
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
      // In dev mode, skip chama check
      if (!isDevMode() && !chama) {
        router.push('/dashboard');
        return;
      }

      // If no chama even in dev mode, exit early
      if (!chama) {
        setIsLoading(false);
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
    <div className="min-h-screen bg-[#0B1120] pb-20">
      <div className="px-4 pt-4 pb-2">
        <div className="flex justify-between items-center">
          <h1 className="text-white text-xl font-bold">Members</h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-green-500 text-white rounded-xl px-4 py-2 text-sm flex items-center gap-1"
          >
            <Plus size={16} />
            Add
          </button>
        </div>
      </div>

      <div className="px-4 mt-3">
        <div className="relative">
          <Search className="absolute left-3 top-3.5 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1a2535] text-white rounded-xl border border-slate-700 py-3 px-4 pl-10 placeholder-gray-500 focus:outline-none focus:border-green-500"
          />
        </div>
      </div>

      <div className="px-4 mt-3">
        <div className="flex gap-2 overflow-x-auto">
          {['all', 'active'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-1.5 rounded-full text-sm ${
                statusFilter === status
                  ? 'bg-green-500 text-white'
                  : 'border border-slate-600 text-gray-400'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mt-4 space-y-3">
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Loading members...</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">No members found</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-green-500 text-white rounded-xl px-4 py-2 text-sm"
            >
              Add First Member
            </button>
          </div>
        ) : (
          filteredMembers.map((member) => (
            <div
              key={member.id}
              className="bg-[#111827] rounded-xl p-4 border border-[#1f2937] flex justify-between items-start"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-800 text-green-300 flex items-center justify-center font-semibold text-sm">
                  {member.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">{member.name}</h3>
                  <p className="text-gray-400 text-xs">{member.role || 'Member'}</p>
                  <p className="text-gray-400 text-xs">{member.phone || 'N/A'}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-gray-400 text-xs">Contributions</p>
                <p className="text-green-400 font-semibold text-sm">
                  {member.total_contributions ? formatCurrency(member.total_contributions) : 'KES 0'}
                </p>
                <p className="text-gray-400 text-xs">Loans</p>
                <p className="text-green-400 font-semibold text-sm">
                  {member.active_loans ? formatCurrency(member.active_loans) : 'KES 0'}
                </p>
                <button className="text-gray-400 mt-2">
                  <MoreVertical size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <BottomNav />

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
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl py-4"
            isLoading={isSubmitting}
          >
            Add Member
          </Button>
        </form>
      </Modal>
    </div>
  );
}
