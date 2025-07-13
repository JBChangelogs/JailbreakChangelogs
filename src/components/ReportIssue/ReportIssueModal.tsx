'use client';

import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { PUBLIC_API_URL } from "@/utils/api";

const MIN_TITLE_LENGTH = 10;
const MIN_DESCRIPTION_LENGTH = 25;

interface ReportIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReportIssueModal({ isOpen, onClose }: ReportIssueModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (title.length < MIN_TITLE_LENGTH) {
      toast.error(`Title must be at least ${MIN_TITLE_LENGTH} characters`);
      return;
    }

    if (description.length < MIN_DESCRIPTION_LENGTH) {
      toast.error(`Description must be at least ${MIN_DESCRIPTION_LENGTH} characters`);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${PUBLIC_API_URL}/issues/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          user: localStorage.getItem('userid')
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit issue');
      }

      toast.success('Issue reported successfully');
      onClose();
      setTitle('');
      setDescription('');
    } catch (error) {
      console.error('Error submitting issue:', error);
      toast.error('Failed to submit issue. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto w-full max-w-sm rounded-lg bg-[#212A31] p-6">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-xl font-semibold text-white">
              Report an Issue
            </Dialog.Title>
            <button
              onClick={onClose}
              className="rounded-full p-1 text-muted hover:bg-[#2E3944] hover:text-white"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-muted">
                Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full rounded-md border border-[#37424D] bg-[#2E3944] px-3 py-2 text-white placeholder-muted focus:border-[#5865F2] focus:outline-none focus:ring-1 focus:ring-[#5865F2]"
                placeholder="Brief description of the issue"
                required
              />
              <p className="mt-1 text-xs text-muted">
                Minimum {MIN_TITLE_LENGTH} characters
              </p>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-muted">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="mt-1 block w-full rounded-md border border-[#37424D] bg-[#2E3944] px-3 py-2 text-white placeholder-muted focus:border-[#5865F2] focus:outline-none focus:ring-1 focus:ring-[#5865F2]"
                placeholder="Detailed description of the issue"
                required
              />
              <p className="mt-1 text-xs text-muted">
                Minimum {MIN_DESCRIPTION_LENGTH} characters
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-[#37424D] px-4 py-2 text-sm font-medium text-muted hover:bg-[#2E3944] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-md bg-[#5865F2] px-4 py-2 text-sm font-medium text-white hover:bg-[#4752C4] focus:outline-none focus:ring-2 focus:ring-[#5865F2] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Issue'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 