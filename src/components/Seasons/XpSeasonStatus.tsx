interface XpSeasonStatusProps {
  achievableNoPass: boolean;
  achievableWithPass: boolean;
}

export default function XpSeasonStatus({ achievableNoPass, achievableWithPass }: XpSeasonStatusProps) {
  return (
    <div className="rounded-lg border border-[#2E3944] bg-[#212A31] p-4">
      <h3 className="mb-3 text-xl font-semibold text-muted">📅 Season Status</h3>
      <div className="space-y-3">
        <div className="flex items-center">
          <span className={`mr-2 text-lg ${achievableNoPass ? 'text-green-400' : 'text-red-400'}`}>
            {achievableNoPass ? '✅' : '❌'}
          </span>
          <span className="text-[#FFFFFF]">
            Without Season Pass: {achievableNoPass ? 'Achievable before season ends' : 'Not achievable with normal XP'}
          </span>
        </div>
        <div className="flex items-center">
          <span className={`mr-2 text-lg ${achievableWithPass ? 'text-green-400' : 'text-red-400'}`}>
            {achievableWithPass ? '✅' : '❌'}
          </span>
          <span className="text-[#FFFFFF]">
            With Season Pass: {achievableWithPass ? 'Achievable before season ends' : 'Not achievable with normal XP'}
          </span>
        </div>
      </div>
    </div>
  );
} 