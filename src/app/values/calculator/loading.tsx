import React from 'react';
import { Skeleton } from '@mui/material';

export default function Loading() {
  return (
    <div className="space-y-6 pb-8">
      <div className="bg-[#212A31] rounded-lg p-4 border border-[#2E3944]">
        <Skeleton variant="rectangular" height={200} className="rounded-lg" />
      </div>
      <div className="bg-[#212A31] rounded-lg p-4 border border-[#2E3944]">
        <Skeleton variant="rectangular" height={400} className="rounded-lg" />
      </div>
    </div>
  );
} 