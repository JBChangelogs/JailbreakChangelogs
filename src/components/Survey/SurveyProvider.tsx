"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getToken } from '@/utils/auth';
import SurveyModal from './SurveyModal';
import SurveyBanner from './SurveyBanner';
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

interface SurveyContextType {
  showSurvey: () => void;
}

const SurveyContext = createContext<SurveyContextType | undefined>(undefined);

export const useSurvey = () => {
  const context = useContext(SurveyContext);
  if (!context) {
    throw new Error('useSurvey must be used within a SurveyProvider');
  }
  return context;
};

export const SurveyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBannerVisible, setIsBannerVisible] = useState(false);
  const [hasCheckedSurvey, setHasCheckedSurvey] = useState(false);

  const checkForSurvey = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch(`${PUBLIC_API_URL}/surveys/request?user=${token}`);
      if (!response.ok) return;

      const data = await response.json();
      if (data && data.id) {
        setSurvey(data);
        setIsBannerVisible(true);
      }
    } catch (error) {
      console.error('Error checking for survey:', error);
    } finally {
      setHasCheckedSurvey(true);
    }
  };

  useEffect(() => {
    if (!hasCheckedSurvey) {
      checkForSurvey();
    }
  }, [hasCheckedSurvey]);

  const showSurvey = () => {
    if (survey) {
      setIsModalOpen(true);
      setIsBannerVisible(false);
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
  };

  const handleDismiss = () => {
    setIsBannerVisible(false);
  };

  return (
    <SurveyContext.Provider value={{ showSurvey }}>
      {children}
      {survey && isBannerVisible && (
        <SurveyBanner
          question={survey.question}
          onAccept={showSurvey}
          onDismiss={handleDismiss}
        />
      )}
      {survey && (
        <SurveyModal
          open={isModalOpen}
          onClose={handleClose}
          survey={survey}
        />
      )}
    </SurveyContext.Provider>
  );
};

export default SurveyProvider; 