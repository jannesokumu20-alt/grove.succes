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
import { getReminders, createReminder, deleteReminder, sendReminder } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';
import { Plus, Trash2, Send, Clock } from 'lucide-react';

export default function RemindersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const chama = useChamaStore((state) => state.chama);
  const [reminders, setReminders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    reminderDate: '',
    reminderTime: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadData = async () => {
      if (!chama || !user) {
        router.push('/dashboard');
        return;
      }

      try {
        const remindersData = await getReminders(chama.id);
        setReminders(remindersData);
      } catch (error: any) {
        console.error('Error loading reminders:', error);
        toast.error(error.message || 'Failed to load reminders');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [chama, user, router, toast]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !chama) {
      return;
    }

    setIsSubmitting(true);

    try {
      const reminderDateTime = formData.reminderTime
        ? `${formData.reminderDate}T${formData.reminderTime}`
        : `${formData.reminderDate}T09:00`;

      await createReminder(chama.id, formData.title, formData.message, reminderDateTime);

      const updatedReminders = await getReminders(chama.id);
      setReminders(updatedReminders);
      setFormData({ title: '', message: '', reminderDate: '', reminderTime: '' });
      setIsModalOpen(false);
      toast.success('Reminder scheduled successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create reminder');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendReminder = async (reminderId: string) => {
    try {
      await sendReminder(reminderId);
      const updatedReminders = await getReminders(chama!.id);
      setReminders(updatedReminders);
      toast.success('Reminder sent to all members');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reminder');
    }
  };

  const handleDeleteReminder = async (reminderId: string) => {
    if (!confirm('Are you sure you want to delete this reminder?')) {
      return;
    }

    try {
      await deleteReminder(reminderId);
      const updatedReminders = await getReminders(chama!.id);
      setReminders(updatedReminders);
      toast.success('Reminder deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete reminder');
    }
  };

  const pendingReminders = reminders.filter((r) => !r.sent);
  const sentReminders = reminders.filter((r) => r.sent);

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

      <main className="flex-1 md:ml-64 min-h-screen bg-slate-900 p-6 pt-[70px] md:pt-6 pb-20 md:pb-0 relative z-10">
        <div className="w-full max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
                  <Clock size={32} className="text-grove-accent" />
                  Reminders
                </h1>
                <p className="text-slate-400">Schedule and send member reminders</p>
              </div>
              <Button
                variant="primary"
                icon={<Plus size={16} />}
                onClick={() => setIsModalOpen(true)}
              >
                Schedule Reminder
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-2 gap-4 mb-8">
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <p className="text-slate-400 text-sm mb-1">Pending</p>
              <p className="text-2xl font-bold text-blue-400">{pendingReminders.length}</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <p className="text-slate-400 text-sm mb-1">Sent</p>
              <p className="text-2xl font-bold text-green-400">{sentReminders.length}</p>
            </div>
          </div>

          {/* Pending Reminders */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-white mb-4">Pending Reminders</h2>
            <Table
              columns={[
                { key: 'title', label: 'Title' },
                { key: 'message', label: 'Message', render: (val) => <span className="truncate max-w-xs">{val}</span> },
                {
                  key: 'reminder_date',
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
                        Send Now
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
                  { key: 'title', label: 'Title' },
                  { key: 'message', label: 'Message', render: (val) => <span className="truncate max-w-xs">{val}</span> },
                  {
                    key: 'sent_at',
                    label: 'Sent At',
                    render: (val) => (val ? formatDate(val) : '-'),
                  },
                  {
                    key: 'actions',
                    label: 'Actions',
                    render: (_, row) => (
                      <button
                        onClick={() => handleDeleteReminder(row.id)}
                        className="text-red-400 hover:text-red-300 transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    ),
                  },
                ]}
                data={sentReminders}
                isEmpty={sentReminders.length === 0}
                emptyMessage="No sent reminders"
              />
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Schedule Reminder"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Title"
            placeholder="e.g., Monthly Contribution Due"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            error={errors.title}
          />

          <Input
            label="Message"
            placeholder="Reminder message for members..."
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            error={errors.message}
            type="textarea"
          />

          <Input
            label="Date"
            type="date"
            value={formData.reminderDate}
            onChange={(e) => setFormData({ ...formData, reminderDate: e.target.value })}
            error={errors.reminderDate}
          />

          <Input
            label="Time (Optional)"
            type="time"
            value={formData.reminderTime}
            onChange={(e) => setFormData({ ...formData, reminderTime: e.target.value })}
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
              Schedule
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
