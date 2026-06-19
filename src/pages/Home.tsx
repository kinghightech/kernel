import { Home as HomeIcon } from 'lucide-react';

export default function Home() {
  return (
    <div className="relative h-full flex flex-col items-center justify-center bg-[#0c0c0c] text-white overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-30" style={{ background: 'radial-gradient(800px circle at 50% 0%, #0B2551, transparent 70%)' }} />

      <div className="relative z-10 flex flex-col items-center text-center px-6">
        <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mb-6">
          <HomeIcon className="w-8 h-8 text-[#A4F4FD]" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Home page</h1>
        <p className="text-white/60">Coming soon.</p>
      </div>
    </div>
  );
}
