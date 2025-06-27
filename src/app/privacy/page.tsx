'use client';

import { Typography } from '@mui/material';
import Breadcrumb from "@/components/Layout/Breadcrumb";
import { ShieldCheckIcon } from '@heroicons/react/24/outline';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#2E3944] p-8 relative">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
        style={{ backgroundImage: "url('https://assets.jailbreakchangelogs.xyz/assets/backgrounds/background8.webp')" }}
      />
      <div className="absolute inset-0 bg-[#2E3944] opacity-60" />
      <div className="max-w-4xl mx-auto relative">
        <Breadcrumb />
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheckIcon className="h-6 w-6 text-muted" />
          <h1 className="text-2xl font-bold text-muted">Privacy Policy</h1>
        </div>
        <p className="text-sm text-muted mb-6">Last updated: May 07th, 2025</p>
        
        <div className="bg-[#212A31] p-6 rounded-lg border border-[#2E3944] hover:border-[#5865F2] transition-colors">
          <Typography className="text-muted">
            This Privacy Policy outlines our commitment to protecting your privacy. We prioritize transparency and do not collect any personal information from users of our website.
          </Typography>

          <div className="space-y-6 mt-6">
            <div>
              <h2 className="text-xl font-semibold text-muted mb-4">Discord Data (Only When Authenticating)</h2>
              <Typography className="text-muted mb-4">
                If you choose to authenticate with Discord, we collect the following publicly available information:
              </Typography>
              <ul className="list-disc list-inside text-muted space-y-1">
                <li>Discord User ID</li>
                <li>Discord Avatar</li>
                <li>Discord Username and Global Name</li>
                <li>Discord Banner</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-muted mb-4">Roblox Data (Only When Authenticating)</h2>
              <Typography className="text-muted mb-4">
                If you choose to authenticate with Roblox, we collect the following publicly available information:
              </Typography>
              <ul className="list-disc list-inside text-muted space-y-1">
                <li>Roblox Username</li>
                <li>Roblox Player ID</li>
                <li>Roblox Display Name</li>
                <li>Roblox Avatar</li>
                <li>Roblox Join Date</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-muted mb-4">Cookies</h2>
              <Typography className="text-muted">
                Our website may use cookies to enhance user experience. However, we do not track or collect any information through cookies.
              </Typography>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-muted mb-4">Microsoft Clarity and Advertising</h2>
              <Typography className="text-muted mb-4">
                We partner with Microsoft Clarity and Microsoft Advertising to capture how you use and interact with our website through behavioral metrics, heatmaps, and session replay to improve and market our products/services. Website usage data is captured using first and third-party cookies and other tracking technologies to determine the popularity of products/services and online activity. Additionally, we use this information for site optimization, fraud/security purposes, and advertising.
              </Typography>
              <Typography className="text-muted">
                For more information about how Microsoft collects and uses your data, visit the <a href="https://www.microsoft.com/en-us/privacy/privacystatement" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 hover:underline">Microsoft Privacy Statement</a>.
              </Typography>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-muted mb-4">Third-Party Links</h2>
              <Typography className="text-muted">
                Our website may contain links to third-party websites. We are not responsible for the privacy practices of these websites.
              </Typography>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-muted mb-4">Changes to This Privacy Policy</h2>
              <Typography className="text-muted">
                We may update this Privacy Policy from time to time. Any changes will be posted on this page.
              </Typography>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-muted mb-4">Contact Us</h2>
              <Typography className="text-muted">
                If you have any questions or concerns about our Privacy Policy, please don&apos;t hesitate to contact us:
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