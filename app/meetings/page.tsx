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
import {
  getMeetings,
  createMeeting,
  getMeeting,
  recordAttendance,
  getAttendance,
  deleteMeeting,
  getMembers,
} from '@/lib/supabase';
import { formatDate } from '@/lib/utils';
import { Plus, Trash2, Users } from 'lucide-react';

export default function MeetingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const chama = useChamaStore((state) => state.chama);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    location: '',
    agenda: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadData = async () => {
      if (!chama || !user) {
        router.push('/dashboard');
        return;
      }

      try {
        const [meetingsData, membersData] = await Promise.all([
          getMeetings(chama.id),
          getMembers(chama.id),
        ]);
        setMeetings(meetingsData);
        setMembers(membersData);
      } catch (error) {
        toast.error('Failed to load meetings');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [chama, user, router, toast]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (!formData.agenda.trim()) {
      newErrors.agenda = 'Agenda is required';
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
      await createMeeting(
        chama.id,
        formData.date,
        formData.time,
        formData.location,
        formData.agenda
      );

      const updatedMeetings = await getMeetings(chama.id);
      setMeetings(updatedMeetings);
      setFormData({ date: '', time: '', location: '', agenda: '' });
      setIsModalOpen(false);
      toast.success('Meeting created successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create meeting');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenAttendance = async (meeting: any) => {
    try {
      const attendanceData = await getAttendance(meeting.id);
      setAttendance(attendanceData);
      setSelectedMeeting(meeting);
      setIsAttendanceModalOpen(true);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load attendance');
    }
  };

  const handleRecordAttendance = async (memberId: string, attended: boolean) => {
    if (!selectedMeeting) return;

    try {
      await recordAttendance(selectedMeeting.id, memberId, attended);
      const updatedAttendance = await getAttendance(selectedMeeting.id);
      setAttendance(updatedAttendance);
      toast.success('Attendance recorded');
    } catch (error: any) {
      toast.error(error.message || 'Failed to record attendance');
    }
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    if (!confirm('Are you sure you want to delete this meeting?')) {
      return;
    }

    try {
      await deleteMeeting(meetingId);
      const updatedMeetings = await getMeetings(chama!.id);
      setMeetings(updatedMeetings);
      toast.success('Meeting deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete meeting');
    }
  };

  const upcomingMeetings = meetings.filter((m) => new Date(m.date) > new Date());
  const attendanceCount =
    selectedMeeting && attendance ? attendance.filter((a) => a.attended).length : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-grove-dark flex items-center justify-center">
        <p className="text-slate-400">Loading meetings...</p>
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
                <h1 className="text-3xl font-bold text-white mb-2">Meetings</h1>
                <p className="text-slate-400">Schedule and track meeting attendance</p>
              </div>
              <Button
                variant="primary"
                icon={<Plus size={16} />}
                onClick={() => setIsModalOpen(true)}
              >
                Schedule Meeting
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-2 gap-4 mb-8">
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <p className="text-slate-400 text-sm mb-1">Total Meetings</p>
              <p className="text-2xl font-bold text-white">{meetings.length}</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <p className="text-slate-400 text-sm mb-1">Upcoming</p>
              <p className="text-2xl font-bold text-blue-400">{upcomingMeetings.length}</p>
            </div>
          </div>

          {/* Meetings Table */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">All Meetings</h2>
            <Table
              columns={[
                {
                  key: 'date',
                  label: 'Date',
                  render: (val) => formatDate(val),
                },
                {
                  key: 'time',
                  label: 'Time',
                  render: (val) => val || '-',
                },
                {
                  key: 'location',
                  label: 'Location',
                },
                {
                  key: 'agenda',
                  label: 'Agenda',
                  render: (val) => <span className="truncate max-w-xs">{val}</span>,
                },
                {
                  key: 'actions',
                  label: 'Actions',
                  render: (_, row) => (
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<Users size={14} />}
                        onClick={() => handleOpenAttendance(row)}
                      >
                        Attendance
                      </Button>
                      <button
                        onClick={() => handleDeleteMeeting(row.id)}
                        className="text-red-400 hover:text-red-300 transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ),
                },
              ]}
              data={meetings}
              isEmpty={meetings.length === 0}
              emptyMessage="No meetings scheduled"
            />
          </div>
        </div>
      </main>

      {/* Create Meeting Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Schedule Meeting"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            error={errors.date}
          />

          <Input
            label="Time (Optional)"
            type="time"
            value={formData.time}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
          />

          <Input
            label="Location"
            placeholder="e.g., Community Hall"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            error={errors.location}
          />

          <Input
            label="Agenda"
            placeholder="Meeting topics and purpose"
            value={formData.agenda}
            onChange={(e) => setFormData({ ...formData, agenda: e.target.value })}
            error={errors.agenda}
            type="textarea"
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

      {/* Attendance Modal */}
      <Modal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
        title={`Attendance - ${selectedMeeting ? formatDate(selectedMeeting.date) : ''}`}
      >
        <div className="space-y-4">
          <div className="bg-slate-700 p-3 rounded text-sm">
            <p className="text-slate-300">
              <span className="text-white font-semibold">{attendanceCount}</span> of{' '}
              <span className="text-white font-semibold">{members.length}</span> members present
            </p>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {members.map((member) => {
              const memberAttendance = attendance.find((a) => a.member_id === member.id);
              const isAttended = memberAttendance?.attended || false;

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 bg-slate-700 rounded hover:bg-slate-600 transition"
                >
                  <span className="text-white">{member.name}</span>
                  <button
                    onClick={() => handleRecordAttendance(member.id, !isAttended)}
                    className={`px-3 py-1 rounded text-sm font-medium transition ${
                      isAttended
                        ? 'bg-green-600 text-white'
                        : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                    }`}
                  >
                    {isAttended ? 'Present' : 'Absent'}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => setIsAttendanceModalOpen(false)}
            >
              Done
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
