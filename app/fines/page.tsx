'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import BottomNav from '@/components/BottomNav';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Modal from '@/components/Modal';
import Table from '@/components/Table';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { useChamaStore } from '@/store/useChamaStore';
import { getFines, createFine, payFine, deleteFine, getMembers } from '@/lib/supabase';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, Trash2 } from 'lucide-react';

export default function FinesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const chama = useChamaStore((state) => state.chama);
  const [fines, setFines] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    memberId: '',
    reason: '',
    amount: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadData = async () => {
      if (!chama || !user) {
        router.push('/dashboard');
        return;
      }

      try {
        const [finesData, membersData] = await Promise.all([
          getFines(chama.id),
          getMembers(chama.id),
        ]);
        setFines(finesData);
        setMembers(membersData);
      } catch (error) {
        toast.error('Failed to load fines');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [chama, user, router, toast]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.memberId) {
      newErrors.memberId = 'Member is required';
    }

    if (!formData.reason.trim()) {
      newErrors.reason = 'Reason is required';
    }

    if (!formData.amount) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(parseFloat(formData.amount))) {
      newErrors.amount = 'Must be a valid number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !chama) {
      return;
    }

    setIsSubmitting(true);

    try {
      await createFine(
        chama.id,
        formData.memberId,
        formData.reason,
        parseFloat(formData.amount)
      );

      const updatedFines = await getFines(chama.id);
      setFines(updatedFines);
      setFormData({ memberId: '', reason: '', amount: '' });
      setIsModalOpen(false);
      toast.success('Fine recorded successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to record fine');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayFine = async (fineId: string) => {
    try {
      await payFine(fineId);
      const updatedFines = await getFines(chama!.id);
      setFines(updatedFines);
      toast.success('Fine marked as paid');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update fine');
    }
  };

  const handleDeleteFine = async (fineId: string) => {
    if (!confirm('Are you sure you want to delete this fine?')) {
      return;
    }

    try {
      await deleteFine(fineId);
      const updatedFines = await getFines(chama!.id);
      setFines(updatedFines);
      toast.success('Fine deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete fine');
    }
  };

  const totalFines = fines.reduce((sum, f) => sum + (f.amount || 0), 0);
  const totalPaid = fines.filter((f) => f.paid).reduce((sum, f) => sum + (f.amount || 0), 0);
  const totalUnpaid = totalFines - totalPaid;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-grove-dark flex items-center justify-center">
        <p className="text-slate-400">Loading fines...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-grove-dark">
      <Navbar />
      <Sidebar />
      <BottomNav />

      <main className="flex-1 lg:ml-64 min-h-screen bg-slate-900 p-6 pt-[70px] lg:pt-6 pb-20 lg:pb-0 relative z-10">
        <div className="w-full max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Fines Management</h1>
                <p className="text-slate-400">Track and manage member fines</p>
              </div>
              <Button
                variant="primary"
                icon={<Plus size={16} />}
                onClick={() => setIsModalOpen(true)}
              >
                Record Fine
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <p className="text-slate-400 text-sm mb-1">Total Fines</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(totalFines)}</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <p className="text-slate-400 text-sm mb-1">Paid</p>
              <p className="text-2xl font-bold text-green-400">{formatCurrency(totalPaid)}</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <p className="text-slate-400 text-sm mb-1">Outstanding</p>
              <p className="text-2xl font-bold text-red-400">{formatCurrency(totalUnpaid)}</p>
            </div>
          </div>

          {/* Fines Table */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">All Fines</h2>
            <Table
              columns={[
                { key: 'members', label: 'Member', render: (_, row) => row.members?.full_name },
                { key: 'reason', label: 'Reason' },
                { key: 'amount', label: 'Amount', render: (val) => formatCurrency(val) },
                {
                  key: 'paid',
                  label: 'Status',
                  render: (val) => (
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        val ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'
                      }`}
                    >
                      {val ? 'Paid' : 'Unpaid'}
                    </span>
                  ),
                },
                {
                  key: 'created_at',
                  label: 'Date',
                  render: (val) => formatDate(val),
                },
                {
                  key: 'actions',
                  label: 'Actions',
                  render: (_, row) => (
                    <div className="flex gap-2">
                      {!row.paid && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handlePayFine(row.id)}
                        >
                          Mark Paid
                        </Button>
                      )}
                      <button
                        onClick={() => handleDeleteFine(row.id)}
                        className="text-red-400 hover:text-red-300 transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ),
                },
              ]}
              data={fines}
              isEmpty={fines.length === 0}
              emptyMessage="No fines recorded"
            />
          </div>
        </div>
      </main>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Record Fine">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Member</label>
            <select
              value={formData.memberId}
              onChange={(e) => setFormData({ ...formData, memberId: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-grove-accent"
            >
              <option value="">Select a member</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.full_name}
                </option>
              ))}
            </select>
            {errors.memberId && <p className="text-red-400 text-sm mt-1">{errors.memberId}</p>}
          </div>

          <Input
            label="Reason for Fine"
            placeholder="e.g., Late payment, absence"
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            error={errors.reason}
          />

          <Input
            label="Amount (KES)"
            type="number"
            placeholder="1000"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            error={errors.amount}
          />

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              isLoading={isSubmitting}
            >
              Record Fine
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
