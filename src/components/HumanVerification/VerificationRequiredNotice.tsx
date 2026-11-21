import { VERIFICATION_REQUIRED_MESSAGE } from "@/utils/api/verificationRequired";

export default function VerificationRequiredNotice({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={`border-border-card bg-secondary-bg rounded-lg border p-6 text-center ${className}`}
    >
      <h3 className="text-primary-text mb-2 text-lg font-semibold">
        Verification required
      </h3>
      <p className="text-secondary-text">{VERIFICATION_REQUIRED_MESSAGE}</p>
    </div>
  );
}
