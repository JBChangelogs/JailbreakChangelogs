import React from "react";

const ServerHeader: React.FC = () => {
  return (
    <div className="border-border-card bg-secondary-bg mb-8 rounded-lg border p-6">
      <h2 className="text-primary-text mb-4 text-2xl font-semibold">
        Roblox Jailbreak Private Servers
      </h2>
      <p className="text-secondary-text mb-4">
        Welcome to our Private Servers hub! Connect with fellow Jailbreak
        players in dedicated trading and gaming spaces. Browse through
        community-shared servers, or share your own to build the ultimate
        Jailbreak trading community.
      </p>
      <p className="text-secondary-text">
        To submit, edit, or delete servers, please log in to your JBCL account.
        This helps us maintain a reliable trading environment.
      </p>
    </div>
  );
};

export default ServerHeader;
