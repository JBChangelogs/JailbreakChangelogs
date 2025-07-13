"use client";

import React, { useState } from 'react';
import { getToken } from '@/utils/auth';
import toast from 'react-hot-toast';
import { PUBLIC_API_URL } from "@/utils/api";

interface Survey {
  id: string;
  question: string;
  answer_type: string;
  chance: number;
  survey_type: string;
  target_audience: string;
  is_active: number;
  max_responses: number;
  responses: number;
  expires: number;
  created_at: number;
}

interface SurveyModalProps {
  open: boolean;
  onClose: () => void;
  survey: Survey;
}

const SurveyModal: React.FC<SurveyModalProps> = ({ open, onClose, survey }) => {
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) {
      toast.error('Please provide an answer');
      return;
    }

    setSubmitting(true);
    try {
      const token = getToken();
      const response = await fetch(`${PUBLIC_API_URL}/surveys/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: survey.id,
          answer: answer,
          owner: token,
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit survey');
      }

      toast.success('Thank you for your feedback!');
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit survey. Please try again.';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div 
      className="modal-overlay"
      onClick={onClose}
      style={{
        display: 'flex',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1000,
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <div 
        className="modal-container"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        style={{
          backgroundColor: '#212A31',
          border: '1px solid #2E3944',
          borderRadius: '8px',
          minWidth: '400px',
          maxWidth: '600px',
          width: '100%',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}
      >
        <div 
          className="modal-header"
          style={{
            color: '#D3D9D4',
            borderBottom: '1px solid #2E3944',
            padding: '16px 24px',
            fontSize: '1.25rem',
            fontWeight: 600
          }}
        >
          Survey
        </div>
        <div 
          className="modal-body"
          style={{
            padding: '24px',
            color: '#D3D9D4'
          }}
        >
          <p className="mb-4">{survey.question}</p>
          <form onSubmit={handleSubmit}>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="w-full p-2 rounded bg-[#2E3944] border border-[#37424D] text-white"
              rows={4}
              placeholder="Type your answer here..."
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded bg-[#37424D] text-white hover:bg-[#2E3944] transition-colors"
              >
                Skip
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded bg-[#1A5F7A] text-white hover:bg-[#124e66] transition-colors disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SurveyModal; 