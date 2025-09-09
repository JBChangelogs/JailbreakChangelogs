import React from "react";

const ServerHeader: React.FC = () => {
  return (
    <div className="mb-8 rounded-lg border border-[#2E3944] bg-[#212A31] p-6">
      <h2 className="text-muted mb-4 text-2xl font-semibold">
        Roblox Jailbreak Private Servers
      </h2>
      <p className="text-muted mb-4">
        Welcome to our Private Servers hub! Connect with fellow Jailbreak
        players in dedicated trading and gaming spaces. Browse through
        community-shared servers, or share your own to build the ultimate
        Jailbreak trading community.
      </p>
      <p className="text-muted mb-8">
        To submit, edit, or delete servers, please log in to your JBCL account.
        This helps us maintain a reliable trading environment.
      </p>
      <div className="mb-4 rounded-lg border border-[#40C0E7]/30 bg-[#2B9CD9]/10 p-4">
        <h3 className="mb-1 text-lg font-semibold text-[#40C0E7]">
          Important for Joining VIP Servers
        </h3>
        <p className="mb-1 text-sm text-[#D3D9D4]">
          For you to join a VIP server link, please make sure you have your{" "}
          <b>&apos;Who can invite me to private servers?&apos;</b> setting set
          to <b>Everyone</b>!
        </p>
        <p className="mb-1 text-sm text-[#D3D9D4]">
          <b>You have to be 13 or over to change this setting.</b>
        </p>
        <p className="text-sm text-[#D3D9D4]">
          You can change that setting here:{" "}
          <a
            href="https://www.roblox.com/my/account#!/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[#40C0E7] transition-colors hover:text-[#2B9CD9] hover:underline"
          >
            Roblox Privacy Settings
          </a>
        </p>
      </div>
    </div>
  );
};

export default ServerHeader;
