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
import Badge from '@/components/Badge';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { useChamaStore } from '@/store/useChamaStore';
import {
  getMembers,
  getLoans,
  createLoan,
  approveLoan,
  recordLoanRepayment,
} from '@/lib/supabase';
import {
  formatCurrency,
  formatDate,
  calculateMonthlyPayment,
  getMonthlyRate,
} from '@/lib/utils';
import { Plus } from 'lucide-react';

export default function LoansPage() {
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const chama = useChamaStore((state) => state.chama);
  const [loans, setLoans] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewLoanModalOpen, setIsNewLoanModalOpen] = useState(false);
  const [isRepaymentModalOpen, setIsRepaymentModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    memberId: '',
    amount: '',
    interestRate: '10',
    repaymentMonths: '12',
    reason: '',
  });
  const [repaymentData, setRepaymentData] = useState({
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
        const membersData = await getMembers(chama.id);
        setMembers(membersData);

        const loansData = await getLoans(chama.id);
        setLoans(loansData);
      } catch (error: any) {
        toast.error(error.message || 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [chama, user, router, toast]);

  const validateLoanForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.memberId) {
      newErrors.memberId = 'Member is required';
    }

    if (!formData.amount) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(parseFloat(formData.amount))) {
      newErrors.amount = 'Must be a valid number';
    }

    if (!formData.repaymentMonths) {
      newErrors.repaymentMonths = 'Repayment months is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateLoanForm() || !chama || !user) return;

    setIsSubmitting(true);

    try {
      const amount = parseFloat(formData.amount);
      const interestRate = parseFloat(formData.interestRate);
      const months = parseInt(formData.repaymentMonths);

      const monthlyRate = getMonthlyRate(interestRate);
      const monthlyPayment = calculateMonthlyPayment(amount, monthlyRate, months);

      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + months);

      const newLoan = await createLoan(
        chama.id,
        formData.memberId,
        amount,
        interestRate,
        months,
        monthlyPayment,
        dueDate.toISOString().split('T')[0],
        formData.reason
      );

      setLoans([newLoan, ...loans]);
      setFormData({
        memberId: '',
        amount: '',
        interestRate: '10',
        repaymentMonths: '12',
        reason: '',
      });
      setIsNewLoanModalOpen(false);
      toast.success('Loan created successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create loan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveLoan = async (loanId: string) => {
    if (!user) return;

    try {
      await approveLoan(loanId, user.id);
      const updatedLoans = loans.map((loan) =>
        loan.id === loanId ? { ...loan, status: 'approved' } : loan
      );
      setLoans(updatedLoans);
      toast.success('Loan approved!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve loan');
    }
  };

  const handleRecordRepayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedLoanId || !repaymentData.amount) {
      toast.error('Please fill all fields');
      return;
    }

    if (!user) return;

    setIsSubmitting(true);

    try {
      const result = await recordLoanRepayment(
        selectedLoanId,
        selectedLoanId,
        parseFloat(repaymentData.amount),
        user.id
      );

      // Update loans list
      const updatedLoans = loans.map((loan) =>
        loan.id === selectedLoanId
          ? {
              ...loan,
              balance: result.loan.balance,
              status: result.loan.status,
            }
          : loan
      );
      setLoans(updatedLoans);

      setRepaymentData({ amount: '' });
      setSelectedLoanId(null);
      setIsRepaymentModalOpen(false);
      toast.success('Repayment recorded!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to record repayment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1120] pb-20">
      <div className="px-4 pt-4 pb-2">
        <div className="flex justify-between items-center">
          <h1 className="text-white text-xl font-bold">Loans</h1>
          <button
            onClick={() => setIsNewLoanModalOpen(true)}
            className="bg-green-500 text-white rounded-xl px-4 py-2 text-sm flex items-center gap-1"
          >
            <Plus size={16} />
            New Loan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 px-4 mt-4">
        <div className="bg-[#111827] rounded-xl p-3 border border-[#1f2937]">
          <p className="text-gray-400 text-xs">Total Active</p>
          <p className="text-white font-bold text-lg">
            {loans.filter((l) => l.status === 'approved').length}
          </p>
        </div>
        <div className="bg-[#111827] rounded-xl p-3 border border-[#1f2937]">
          <p className="text-gray-400 text-xs">Outstanding</p>
          <p className="text-white font-bold text-lg">
            {formatCurrency(
              loans
                .filter((l) => l.status === 'approved')
                .reduce((sum, l) => sum + (l.balance || 0), 0)
            )}
          </p>
        </div>
        <div className="bg-[#111827] rounded-xl p-3 border border-[#1f2937]">
          <p className="text-gray-400 text-xs">Overdue</p>
          <p className="text-white font-bold text-lg">
            {loans.filter((l) => l.status === 'overdue').length}
          </p>
        </div>
      </div>

      <div className="flex gap-2 px-4 mt-3 overflow-x-auto">
        {['all', 'active', 'repaid', 'overdue'].map((status) => (
          <button
            key={status}
            className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap ${
              status === 'all' || (status === 'active' && loans.some(l => l.status === 'approved'))
                ? 'bg-green-500 text-white'
                : 'border border-slate-600 text-gray-400'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      <div className="px-4 mt-4 space-y-3">
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Loading loans...</p>
          </div>
        ) : loans.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No loans yet</p>
          </div>
        ) : (
          loans.map((loan) => (
            <div
              key={loan.id}
              className="bg-[#111827] rounded-xl p-4 border border-[#1f2937]"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-white font-semibold text-sm">{loan.members?.name || 'Unknown'}</h3>
                <span className={`rounded-full px-2 py-0.5 text-xs ${
                  loan.status === 'approved' 
                    ? 'bg-green-900 text-green-300' 
                    : loan.status === 'overdue'
                    ? 'bg-red-900 text-red-300'
                    : 'bg-blue-900 text-blue-300'
                }`}>
                  {loan.status || 'pending'}
                </span>
              </div>
              <div className="text-white font-bold text-lg mb-1">{formatCurrency(loan.amount)}</div>
              <div className="text-gray-400 text-xs mb-2">{formatDate(loan.created_at)}</div>
              {loan.status === 'approved' && (
                <div className="w-full bg-slate-700 rounded-full h-1.5 mt-2">
                  <div 
                    className="bg-green-500 rounded-full h-1.5" 
                    style={{ 
                      width: `${((loan.amount - (loan.balance || 0)) / loan.amount) * 100}%` 
                    }}
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <BottomNav />

      {/* New Loan Modal */}
      <Modal
        isOpen={isNewLoanModalOpen}
        onClose={() => setIsNewLoanModalOpen(false)}
        title="Create New Loan"
      >
        <form onSubmit={handleCreateLoan} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Member
            </label>
            <select
              value={formData.memberId}
              onChange={(e) =>
                setFormData({ ...formData, memberId: e.target.value })
              }
              className="w-full bg-[#1a2535] text-white border border-slate-700 rounded-xl py-3 px-4 focus:outline-none focus:border-green-500"
            >
              <option value="">Select a member</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
            {errors.memberId && (
              <p className="text-red-400 text-sm mt-1">{errors.memberId}</p>
            )}
          </div>

          <Input
            label="Loan Amount (KES)"
            type="number"
            placeholder="50000"
            value={formData.amount}
            onChange={(e) =>
              setFormData({ ...formData, amount: e.target.value })
            }
            error={errors.amount}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Interest Rate (%)"
              type="number"
              placeholder="10"
              value={formData.interestRate}
              onChange={(e) =>
                setFormData({ ...formData, interestRate: e.target.value })
              }
            />
            <Input
              label="Repayment Months"
              type="number"
              placeholder="12"
              value={formData.repaymentMonths}
              onChange={(e) =>
                setFormData({ ...formData, repaymentMonths: e.target.value })
              }
              error={errors.repaymentMonths}
            />
          </div>

          <Input
            label="Reason"
            placeholder="e.g., Business expansion"
            value={formData.reason}
            onChange={(e) =>
              setFormData({ ...formData, reason: e.target.value })
            }
          />

          <Button
            type="submit"
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl py-4"
            isLoading={isSubmitting}
          >
            Create Loan
          </Button>
        </form>
      </Modal>

      {/* Record Repayment Modal */}
      <Modal
        isOpen={isRepaymentModalOpen}
        onClose={() => {
          setIsRepaymentModalOpen(false);
          setSelectedLoanId(null);
        }}
        title="Record Repayment"
      >
        <form onSubmit={handleRecordRepayment} className="space-y-4">
          <Input
            label="Repayment Amount (KES)"
            type="number"
            placeholder="0"
            value={repaymentData.amount}
            onChange={(e) =>
              setRepaymentData({ ...repaymentData, amount: e.target.value })
            }
          />

          <Button
            type="submit"
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl py-4"
            isLoading={isSubmitting}
          >
            Record Repayment
          </Button>
        </form>
      </Modal>
    </div>
  );
}
