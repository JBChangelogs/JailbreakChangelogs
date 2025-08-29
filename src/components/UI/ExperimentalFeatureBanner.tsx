import React from 'react';
import { DiscordIcon } from '@/components/Icons/DiscordIcon';

interface ExperimentalFeatureBannerProps {
  className?: string;
}

export default function ExperimentalFeatureBanner({ className = '' }: ExperimentalFeatureBannerProps) {
  return (
    <div className={`relative overflow-hidden rounded-xl border border-amber-200/20 bg-gradient-to-br from-amber-50/5 via-amber-100/5 to-orange-50/5 backdrop-blur-sm ${className}`}>
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-400/5 via-orange-400/5 to-red-400/5" />
      
      <div className="relative p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          {/* Modern icon */}
          <div className="flex-shrink-0 flex justify-center sm:justify-start">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-400/20 to-orange-500/20 border border-amber-300/30">
              <svg className="h-5 w-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
              <h3 className="text-base font-semibold text-amber-100">Experimental Feature</h3>
              <span className="text-[10px] uppercase font-semibold text-amber-200 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/30 px-1.5 py-0.5 rounded w-fit mx-auto sm:mx-0">
                Beta
              </span>
            </div>
            
            <p className="text-sm leading-relaxed text-gray-300 mb-4">
              This feature is experimental; information may be inaccurate or the feature may break.
            </p>
            
            <a 
              href="https://discord.jailbreakchangelogs.xyz" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2.5 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 px-4 py-2.5 text-sm font-medium text-amber-100 hover:from-amber-500/20 hover:to-orange-500/20 border border-amber-400/20 hover:border-amber-400/40 transition-all duration-200 hover:scale-[1.02] w-full sm:w-auto"
            >
              <DiscordIcon className="h-4 w-4 flex-shrink-0" />
              <span className="text-center sm:text-left">Help us improve it by reporting any issues you find</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
