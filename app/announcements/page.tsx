'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import BottomNav from '@/components/BottomNav';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Modal from '@/components/Modal';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { useChamaStore } from '@/store/useChamaStore';
import { getAnnouncements, createAnnouncement, deleteAnnouncement } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';
import { Plus, Trash2, Megaphone } from 'lucide-react';

export default function AnnouncementsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const chama = useChamaStore((state) => state.chama);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadData = async () => {
      if (!chama || !user) {
        router.push('/dashboard');
        return;
      }

      try {
        const announcementsData = await getAnnouncements(chama.id);
        setAnnouncements(announcementsData);
      } catch (error) {
        toast.error('Failed to load announcements');
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

    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
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
      await createAnnouncement(chama.id, formData.title, formData.content);

      const updatedAnnouncements = await getAnnouncements(chama.id);
      setAnnouncements(updatedAnnouncements);
      setFormData({ title: '', content: '' });
      setIsModalOpen(false);
      toast.success('Announcement posted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to post announcement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAnnouncement = async (announcementId: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) {
      return;
    }

    try {
      await deleteAnnouncement(announcementId);
      const updatedAnnouncements = await getAnnouncements(chama!.id);
      setAnnouncements(updatedAnnouncements);
      toast.success('Announcement deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete announcement');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-grove-dark flex items-center justify-center">
        <p className="text-slate-400">Loading announcements...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-grove-dark">
      <Navbar />
      <Sidebar />
      <BottomNav />

      <main className="flex-1 lg:ml-64 min-h-screen bg-slate-900 p-6 pt-[70px] lg:pt-6 pb-20 lg:pb-0 relative z-10">
        <div className="w-full max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
                  <Megaphone size={32} className="text-grove-accent" />
                  Announcements
                </h1>
                <p className="text-slate-400">Communicate with all members</p>
              </div>
              <Button
                variant="primary"
                icon={<Plus size={16} />}
                onClick={() => setIsModalOpen(true)}
              >
                Post Announcement
              </Button>
            </div>
          </div>

          {/* Announcements List */}
          <div className="space-y-4">
            {announcements.length === 0 ? (
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
                <Megaphone size={40} className="mx-auto text-slate-600 mb-4" />
                <p className="text-slate-400">No announcements yet</p>
              </div>
            ) : (
              announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-slate-600 transition"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white mb-1">
                        {announcement.title}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {formatDate(announcement.created_at)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteAnnouncement(announcement.id)}
                      className="text-red-400 hover:text-red-300 transition ml-4"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {announcement.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Post Announcement"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Title"
            placeholder="e.g., Monthly Meeting Reminder"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            error={errors.title}
          />

          <Input
            label="Content"
            placeholder="Write your announcement here..."
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            error={errors.content}
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
              Post
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
