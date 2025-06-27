'use client';

import { Typography } from '@mui/material';
import Breadcrumb from "@/components/Layout/Breadcrumb";
import { DocumentTextIcon } from '@heroicons/react/24/outline';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[#2E3944] p-8 relative">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
        style={{ backgroundImage: "url('https://assets.jailbreakchangelogs.xyz/assets/backgrounds/background6.webp')" }}
      />
      <div className="absolute inset-0 bg-[#2E3944] opacity-60" />
      <div className="max-w-4xl mx-auto relative">
        <Breadcrumb />
        <div className="flex items-center gap-2 mb-2">
          <DocumentTextIcon className="h-6 w-6 text-muted" />
          <h1 className="text-2xl font-bold text-muted">Terms of Service</h1>
        </div>
        <p className="text-sm text-muted mb-6">Last updated: April 15th, 2025</p>
        
        <div className="bg-[#212A31] p-6 rounded-lg border border-[#2E3944] hover:border-[#5865F2] transition-colors">
          <Typography className="text-muted">
            Please read these Terms of Service carefully before using Jailbreak Changelogs.
          </Typography>

          <div className="space-y-6 mt-6">
            <div>
              <h2 className="text-xl font-semibold text-muted mb-4">1. Acceptance of Terms</h2>
              <Typography className="text-muted">
                By accessing and using Jailbreak Changelogs, you accept and agree to be bound by the terms and provisions of this agreement. You confirm that you&apos;re at least 13 years old and meet the minimum age required by the laws in your country. If you are old enough to access our services in your country, but not old enough to have authority to consent to our terms, your parent or legal guardian must agree to our terms on your behalf. Please ask your parent or legal guardian to read these terms with you. If you&apos;re a parent or legal guardian and you allow your child (who must meet the minimum age for your country) to use the services, then these terms also apply to you and you&apos;re responsible for your child&apos;s activity on the services, including purchases made by them.
              </Typography>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-muted mb-4">2. Use License</h2>
              <Typography className="text-muted mb-4">
                Permission is granted to temporarily access and use our materials for personal, non-commercial viewing only.
              </Typography>
              <ul className="list-disc list-inside text-muted space-y-1">
                <li>You must not modify or copy these materials</li>
                <li>You must not use these materials for commercial purposes</li>
                <li>You must not attempt to decompile or reverse engineer any software</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-muted mb-4">3. Disclaimer</h2>
              <Typography className="text-muted">
                The materials on our website are provided on an &apos;as is&apos; basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
              </Typography>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-muted mb-4">4. Limitations</h2>
              <Typography className="text-muted">
                In no event shall Jailbreak Changelogs or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on our website.
              </Typography>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-muted mb-4">5. Revisions and Errata</h2>
              <Typography className="text-muted">
                We reserve the right to make changes to our Terms of Service at any time without notice. By using this website, you are agreeing to be bound by the current version of these Terms of Service.
              </Typography>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-muted mb-4">6. Contact Information</h2>
              <Typography className="text-muted">
                If you have any questions about these Terms of Service, please contact us:
              </Typography>
              <Typography className="text-muted mt-2">
                Email: <a href="mailto:support@jailbreakchangelogs.xyz" className="text-blue-300 hover:text-blue-400 hover:underline">support@jailbreakchangelogs.xyz</a>
              </Typography>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 