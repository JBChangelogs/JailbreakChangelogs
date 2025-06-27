'use client';

import { Suspense } from 'react';
import LoginModal from './LoginModal';

interface LoginModalWrapperProps {
  open: boolean;
  onClose: () => void;
}

export default function LoginModalWrapper({ open, onClose }: LoginModalWrapperProps) {
  return (
    <Suspense fallback={null}>
      <LoginModal open={open} onClose={onClose} />
    </Suspense>
  );
} 