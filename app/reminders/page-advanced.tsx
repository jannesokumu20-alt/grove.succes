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
import { formatDate } from '@/lib/utils';
import { 
  getAutoReminders, 
  sendAutoReminder, 
  deleteAutoReminder,
  getContributionTracking
} from '@/lib/automationFunctions';
import { Plus, Trash2, Send, Clock, AlertCircle } from 'lucide-react';

export default function RemindersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const chama = useChamaStore((state) => state.chama);
  
  const [reminders, setReminders] = useState<any[]>([]);
  const [contributions, setContributions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'auto' | 'manual'>('auto');
  
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    reminderDate: '',
    reminderTime: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!chama || !user) {
      router.push('/dashboard');
      return;
    }

    loadData();
  }, [chama, user, router]);

  const loadData = async () => {
    try {
      const [remindersData, contributionsData] = await Promise.all([
        getAutoReminders(chama!.id),
        getContributionTracking(chama!.id),
      ]);
      
      setReminders(remindersData);
      setContributions(contributionsData);
    } catch (error: any) {
      console.error('Error loading reminders:', error);
      toast.error(error.message || 'Failed to load reminders');
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    }

    if (!formData.reminderDate) {
      newErrors.reminderDate = 'Date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendReminder = async (reminderId: string) => {
    try {
      await sendAutoReminder(reminderId);
      const updated = await getAutoReminders(chama!.id);
      setReminders(updated);
      toast.success('Reminder sent successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reminder');
    }
  };

  const handleDeleteReminder = async (reminderId: string) => {
    if (!confirm('Are you sure you want to delete this reminder?')) {
      return;
    }

    try {
      await deleteAutoReminder(reminderId);
      const updated = await getAutoReminders(chama!.id);
      setReminders(updated);
      toast.success('Reminder deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete reminder');
    }
  };

  const pendingReminders = reminders.filter((r) => !r.sent);
  const sentReminders = reminders.filter((r) => r.sent);
  
  const upcomingContribs = contributions.filter((c) => c.status === 'pending');
  const overdueContribs = contributions.filter((c) => c.status === 'overdue');

  const getReminderBadgeColor = (type: string) => {
    switch (type) {
      case 'upcoming':
        return 'bg-blue-900 text-blue-200';
      case 'due':
        return 'bg-yellow-900 text-yellow-200';
      case 'overdue':
        return 'bg-red-900 text-red-200';
      default:
        return 'bg-slate-700 text-slate-300';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-grove-dark flex items-center justify-center">
        <p className="text-slate-400">Loading reminders...</p>
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
                <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
                  <Clock size={32} className="text-grove-accent" />
                  Reminders & Contributions
                </h1>
                <p className="text-slate-400">Manage automatic and manual reminders</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-8 border-b border-slate-700">
            <button
              onClick={() => setActiveTab('auto')}
              className={`px-4 py-2 font-medium transition ${
                activeTab === 'auto'
                  ? 'text-grove-accent border-b-2 border-grove-accent'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Auto Reminders
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`px-4 py-2 font-medium transition ${
                activeTab === 'manual'
                  ? 'text-grove-accent border-b-2 border-grove-accent'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Contribution Status
            </button>
          </div>

          {/* Auto Reminders Tab */}
          {activeTab === 'auto' && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                  <p className="text-slate-400 text-sm mb-1">Pending</p>
                  <p className="text-2xl font-bold text-blue-400">{pendingReminders.length}</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                  <p className="text-slate-400 text-sm mb-1">Sent</p>
                  <p className="text-2xl font-bold text-green-400">{sentReminders.length}</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                  <p className="text-slate-400 text-sm mb-1">Total</p>
                  <p className="text-2xl font-bold text-white">{reminders.length}</p>
                </div>
              </div>

              {/* Pending Reminders */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-8">
                <h2 className="text-lg font-semibold text-white mb-4">Pending Reminders</h2>
                <Table
                  columns={[
                    { key: 'members', label: 'Member', render: (_, row) => row.members?.name },
                    { 
                      key: 'reminder_type', 
                      label: 'Type',
                      render: (val) => (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getReminderBadgeColor(val)}`}>
                          {val.charAt(0).toUpperCase() + val.slice(1)}
                        </span>
                      )
                    },
                    { key: 'title', label: 'Title' },
                    {
                      key: 'scheduled_date',
                      label: 'Scheduled',
                      render: (val) => formatDate(val),
                    },
                    {
                      key: 'actions',
                      label: 'Actions',
                      render: (_, row) => (
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={<Send size={14} />}
                            onClick={() => handleSendReminder(row.id)}
                          >
                            Send
                          </Button>
                          <button
                            onClick={() => handleDeleteReminder(row.id)}
                            className="text-red-400 hover:text-red-300 transition"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ),
                    },
                  ]}
                  data={pendingReminders}
                  isEmpty={pendingReminders.length === 0}
                  emptyMessage="No pending reminders"
                />
              </div>

              {/* Sent Reminders */}
              {sentReminders.length > 0 && (
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-white mb-4">Sent Reminders</h2>
                  <Table
                    columns={[
                      { key: 'members', label: 'Member', render: (_, row) => row.members?.name },
                      { 
                        key: 'reminder_type', 
                        label: 'Type',
                        render: (val) => (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getReminderBadgeColor(val)}`}>
                            {val.charAt(0).toUpperCase() + val.slice(1)}
                          </span>
                        )
                      },
                      { key: 'title', label: 'Title' },
                      {
                        key: 'sent_at',
                        label: 'Sent At',
                        render: (val) => (val ? formatDate(val) : '-'),
                      },
                    ]}
                    data={sentReminders}
                    isEmpty={sentReminders.length === 0}
                    emptyMessage="No sent reminders"
                  />
                </div>
              )}
            </>
          )}

          {/* Contribution Status Tab */}
          {activeTab === 'manual' && (
            <>
              {/* Contribution Status Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                  <p className="text-slate-400 text-sm mb-1">Paid</p>
                  <p className="text-2xl font-bold text-green-400">
                    {contributions.filter((c) => c.status === 'paid').length}
                  </p>
                </div>
                <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                  <p className="text-slate-400 text-sm mb-1">Pending</p>
                  <p className="text-2xl font-bold text-blue-400">{upcomingContribs.length}</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                  <p className="text-slate-400 text-sm mb-1">Overdue</p>
                  <p className="text-2xl font-bold text-red-400">{overdueContribs.length}</p>
                </div>
              </div>

              {/* All Contributions */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-white mb-4">All Contributions</h2>
                <Table
                  columns={[
                    { 
                      key: 'members', 
                      label: 'Member', 
                      render: (_, row) => row.members?.name 
                    },
                    {
                      key: 'month',
                      label: 'Period',
                      render: (val, row) => `${val}/${row.year}`,
                    },
                    {
                      key: 'expected_amount',
                      label: 'Expected',
                      render: (val) => `KES ${val?.toLocaleString() || 0}`,
                    },
                    {
                      key: 'paid_amount',
                      label: 'Paid',
                      render: (val) => `KES ${val?.toLocaleString() || 0}`,
                    },
                    {
                      key: 'due_date',
                      label: 'Due Date',
                      render: (val) => formatDate(val),
                    },
                    {
                      key: 'status',
                      label: 'Status',
                      render: (val) => {
                        const colors = {
                          paid: 'bg-green-900 text-green-200',
                          partial: 'bg-yellow-900 text-yellow-200',
                          pending: 'bg-blue-900 text-blue-200',
                          overdue: 'bg-red-900 text-red-200',
                        };
                        return (
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              colors[val as keyof typeof colors] || 'bg-slate-700 text-slate-300'
                            }`}
                          >
                            {val.charAt(0).toUpperCase() + val.slice(1)}
                          </span>
                        );
                      },
                    },
                  ]}
                  data={contributions}
                  isEmpty={contributions.length === 0}
                  emptyMessage="No contribution records"
                />
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
