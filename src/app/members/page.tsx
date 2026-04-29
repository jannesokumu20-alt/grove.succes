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
import BulkImportModal from '@/components/BulkImportModal';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { useChamaStore } from '@/store/useChamaStore';
import { getMembers, addMember, generateInviteLink, recordContribution } from '@/lib/supabase';
import { formatDate, isValidPhoneNumber, generateInviteCode } from '@/lib/utils';
import { Plus, Copy, Share2, Upload } from 'lucide-react';

export default function MembersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const chama = useChamaStore((state) => state.chama);
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBulkImporting, setIsBulkImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
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
  }, [chama, router, toast]);

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

  const handleCopyInviteCode = () => {
    if (chama) {
      navigator.clipboard.writeText(chama.invite_code);
      toast.success('Invite code copied!');
    }
  };

  const handleShareInviteCode = () => {
    if (chama) {
      const url = `${window.location.origin}/join/${chama.invite_code}`;
      const message = `Join ${chama.name} on Grove! Use this code: ${chama.invite_code}\n${url}`;

      if (navigator.share) {
        navigator.share({
          title: 'Join Chama',
          text: message,
        });
      } else {
        navigator.clipboard.writeText(message);
        toast.success('Message copied to clipboard!');
      }
    }
  };

  const handleGenerateInviteLink = async () => {
    if (!chama || !user) return;

    try {
      setIsSubmitting(true);
      const newInvite = await generateInviteLink(chama.id, user.id);
      setInviteLink(newInvite.link);
      toast.success('Invite link generated!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate invite link');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyInviteLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      toast.success('Invite link copied!');
    }
  };

  const handleBulkImport = async (data: any[]) => {
    if (!chama || !user) return;

    setIsBulkImporting(true);

    try {
      let addedCount = 0;
      let contributedCount = 0;
      const errors: string[] = [];

      for (const row of data) {
        try {
          // Add member
          const newMember = await addMember(chama.id, row.full_name, row.phone);
          addedCount++;

          // Record contribution if amount is provided
          if (row.amount && row.month) {
            try {
              await recordContribution(
                chama.id,
                newMember.id,
                parseFloat(row.amount),
                parseInt(row.month),
                new Date().getFullYear(),
                user.id,
                row.note || ''
              );
              contributedCount++;
            } catch (err: any) {
              // Contribution might fail due to duplicate, but member was added
              console.error('Contribution error:', err);
            }
          }
        } catch (err: any) {
          errors.push(`${row.full_name}: ${err.message}`);
        }
      }

      // Reload members
      const updatedMembers = await getMembers(chama.id);
      setMembers(updatedMembers);

      let message = `Imported ${addedCount} member${addedCount !== 1 ? 's' : ''}`;
      if (contributedCount > 0) {
        message += ` and ${contributedCount} contribution${contributedCount !== 1 ? 's' : ''}`;
      }
      if (errors.length > 0) {
        message += `. ${errors.length} error${errors.length !== 1 ? 's' : ''}`;
      }

      toast.success(message);
    } catch (error: any) {
      toast.error(error.message || 'Failed to import data');
    } finally {
      setIsBulkImporting(false);
    }
  };

  const filteredMembers = members.filter((member) =>
    member.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-grove-dark">
      <Navbar />
      <Sidebar />
      <BottomNav />

      <main className="md:ml-64 md:pt-20 pt-0 pb-20 md:pb-0 px-4 md:px-6 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Members</h1>
              <p className="text-slate-400">Manage your chama members</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => setIsBulkImportModalOpen(true)}
                icon={<Upload size={16} />}
              >
                Bulk Import
              </Button>
              <Button
                variant="primary"
                onClick={() => setIsModalOpen(true)}
                icon={<Plus size={16} />}
              >
                Add Member
              </Button>
            </div>
          </div>

          {/* Invite Section */}
          {chama && (
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-8">
              <h2 className="text-lg font-semibold text-white mb-4">Invite Members</h2>
              
              {/* Old Invite Code Method */}
              <div className="mb-6 pb-6 border-b border-slate-800">
                <p className="text-sm text-slate-400 mb-3">Using invite code:</p>
                <div className="flex gap-2 flex-col sm:flex-row">
                  <Input
                    value={chama.invite_code}
                    readOnly
                    label="Invite Code"
                    className="bg-slate-800 cursor-not-allowed"
                  />
                  <Button
                    variant="secondary"
                    onClick={handleCopyInviteCode}
                    icon={<Copy size={16} />}
                    className="sm:mt-6"
                  >
                    Copy
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleShareInviteCode}
                    icon={<Share2 size={16} />}
                    className="sm:mt-6"
                  >
                    Share
                  </Button>
                </div>
              </div>

              {/* New Invite Link Method */}
              <div>
                <p className="text-sm text-slate-400 mb-3">Or generate a one-time invite link:</p>
                {inviteLink ? (
                  <div className="flex gap-2 flex-col sm:flex-row">
                    <Input
                      value={inviteLink}
                      readOnly
                      label="Invite Link"
                      className="bg-slate-800 cursor-not-allowed text-xs"
                    />
                    <Button
                      variant="secondary"
                      onClick={handleCopyInviteLink}
                      icon={<Copy size={16} />}
                      className="sm:mt-6"
                    >
                      Copy Link
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="primary"
                    onClick={handleGenerateInviteLink}
                    isLoading={isSubmitting}
                    className="w-full sm:w-auto"
                  >
                    Generate Link
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Search */}
          <div className="mb-6">
            <Input
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Members Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <Table
              columns={[
                { key: 'full_name', label: 'Name' },
                { key: 'phone', label: 'Phone' },
                {
                  key: 'status',
                  label: 'Status',
                  render: (val) => <Badge variant="green">{val}</Badge>,
                },
                {
                  key: 'credit_score',
                  label: 'Credit Score',
                  render: (val) => (
                    <Badge
                      variant={val >= 75 ? 'green' : val >= 50 ? 'yellow' : 'red'}
                    >
                      {val}/100
                    </Badge>
                  ),
                },
                { key: 'joined_at', label: 'Joined', render: (val) => formatDate(val) },
              ]}
              data={filteredMembers}
              isLoading={isLoading}
              isEmpty={filteredMembers.length === 0}
              emptyMessage="No members found"
            />
          </div>
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
              variant="primary"
              className="w-full"
              isLoading={isSubmitting}
            >
              Add Member
            </Button>
          </form>
        </Modal>

        {/* Bulk Import Modal */}
        <BulkImportModal
          isOpen={isBulkImportModalOpen}
          onClose={() => setIsBulkImportModalOpen(false)}
          onImport={handleBulkImport}
          isLoading={isBulkImporting}
        />
      </main>
    </div>
  );
}
