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
    <div className="min-h-screen bg-gradient-to-b from-[#0B1220] to-[#05070D]">
      <Navbar />
      <Sidebar />
      <BottomNav />

      <main className="flex-1 md:ml-64 min-h-screen bg-gradient-to-b from-[#0B1220] to-[#05070D] pt-[70px] md:pt-6 pb-24 md:pb-6 relative z-10">
        <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Loans</h1>
              <p className="text-[#AEB6C2]">Manage member loans</p>
            </div>
            <Button
              variant="primary"
              onClick={() => setIsNewLoanModalOpen(true)}
              icon={<Plus size={16} />}
            >
              New Loan
            </Button>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Total Active Loans', value: loans.filter((l) => l.status === 'approved').length, color: '#00D084', bgColor: '#0C1A14', glowColor: '#00D084' },
              { label: 'Total Outstanding', value: formatCurrency(loans.filter((l) => l.status === 'approved').reduce((sum, l) => sum + (l.balance || 0), 0)), color: '#3B82F6', bgColor: '#0C1620', glowColor: '#3B82F6' },
              { label: 'Overdue Loans', value: loans.filter((l) => l.status === 'overdue').length, color: '#EF4444', bgColor: '#1F0F0F', glowColor: '#EF4444' },
            ].map((stat, i) => (
              <div
                key={i}
                className="rounded-[16px] px-6 py-6 transition-all hover:scale-105"
                style={{
                  background: stat.bgColor,
                  border: `2px solid ${stat.color}`,
                  boxShadow: `0 0 40px ${stat.glowColor}70, 0 0 80px ${stat.glowColor}30, inset 0 1px 2px rgba(255,255,255,0.1)`,
                }}
              >
                <p className="text-xs text-[#AEB6C2] uppercase tracking-widest font-bold mb-2">{stat.label}</p>
                <p className="text-3xl font-bold text-white" style={{
                  textShadow: `0 0 20px ${stat.glowColor}c0`
                }}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          {/* Loans Table */}
          <div className="rounded-[16px] p-6" style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
          }}>
            <Table
              columns={[
                { key: 'members', label: 'Member', render: (_, row) => row.members?.name },
                { key: 'amount', label: 'Amount', render: (val) => formatCurrency(val) },
                { key: 'balance', label: 'Balance', render: (val) => formatCurrency(val) },
                {
                  key: 'monthly_payment',
                  label: 'Monthly',
                  render: (val) => formatCurrency(val),
                },
                {
                  key: 'status',
                  label: 'Status',
                  render: (val) => (
                    <Badge
                      variant={
                        val === 'approved'
                          ? 'green'
                          : val === 'pending'
                          ? 'yellow'
                          : val === 'paid'
                          ? 'blue'
                          : 'red'
                      }
                    >
                      {val}
                    </Badge>
                  ),
                },
                {
                  key: 'id',
                  label: 'Actions',
                  render: (val, row) => (
                    <div className="flex gap-2">
                      {row.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleApproveLoan(val)}
                        >
                          Approve
                        </Button>
                      )}
                      {row.status === 'approved' && (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => {
                            setSelectedLoanId(val);
                            setIsRepaymentModalOpen(true);
                          }}
                        >
                          Repay
                        </Button>
                      )}
                    </div>
                  ),
                },
              ]}
              data={loans}
              isLoading={isLoading}
              isEmpty={loans.length === 0}
              emptyMessage="No loans yet"
            />
          </div>
        </div>

        {/* New Loan Modal */}
        <Modal
          isOpen={isNewLoanModalOpen}
          onClose={() => setIsNewLoanModalOpen(false)}
          title="Create New Loan"
        >
          <form onSubmit={handleCreateLoan} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Member
              </label>
              <select
                value={formData.memberId}
                onChange={(e) =>
                  setFormData({ ...formData, memberId: e.target.value })
                }
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-grove-accent"
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
              variant="primary"
              className="w-full"
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
              variant="primary"
              className="w-full"
              isLoading={isSubmitting}
            >
              Record Repayment
            </Button>
          </form>
        </Modal>
      </main>
    </div>
  );
}
