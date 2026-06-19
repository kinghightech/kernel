import { LogOut } from 'lucide-react';
import { supabase } from '../supabase';
import { startCheckout } from '../billing';
import PricingSection from '../components/PricingSection';

export default function PayWall() {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <div className="relative min-h-screen bg-[#0c0c0c] text-white overflow-x-hidden overflow-y-auto">
      {/* Same background video as the landing page */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <video
          autoPlay loop muted playsInline
          className="w-full h-full object-cover pointer-events-none"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260508_064122_c4750c0e-7476-4b44-94a2-a85a65c63bf2.mp4"
        />
      </div>

      <button
        onClick={handleSignOut}
        className="absolute top-6 right-6 z-30 text-white/50 hover:text-white transition-colors text-sm flex items-center gap-2"
      >
        <LogOut className="w-4 h-4" /> Sign out
      </button>

      <div className="relative z-10">
        <PricingSection
          watermark={{ line1: 'Choose the best', line2: 'plan for you' }}
          onChoose={(plan, interval) => {
            if (plan === 'free') { window.location.href = '/'; return; }
            startCheckout(plan, interval);
          }}
        />
      </div>
    </div>
  );
}
