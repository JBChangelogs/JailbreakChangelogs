import React from 'react';

const ServerHeader: React.FC = () => {
  return (
    <div className="mb-8 rounded-lg border border-[#2E3944] bg-[#212A31] p-6">
      <h2 className="mb-4 text-2xl font-semibold text-muted">
        Roblox Jailbreak Private Servers
      </h2>
      <p className="mb-4 text-muted">
        Welcome to our Private Servers hub! Connect with fellow Jailbreak players in dedicated trading and gaming spaces. Browse through community-shared servers, or share your own to build the ultimate Jailbreak trading community.
      </p>
      <p className="mb-8 text-muted">
        To submit, edit, or delete servers, please log in to your JBCL account. This helps us maintain a reliable trading environment.
      </p>
    </div>
  );
};

export default ServerHeader; 