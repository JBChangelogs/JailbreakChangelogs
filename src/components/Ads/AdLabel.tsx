export default function AdLabel({ className = "" }: { className?: string }) {
  return (
    <span
      className={`text-tertiary-text block text-center text-[10px] font-medium tracking-widest uppercase ${className}`}
    >
      Advertisement
    </span>
  );
}
