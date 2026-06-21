import { LogOut } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../supabase';
import { startCheckout } from '../billing';
import PricingSection from '../components/PricingSection';

export default function PayWall() {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative min-h-screen bg-[#0c0c0c] text-white overflow-x-hidden overflow-y-auto"
    >
      {/* Same background video as the landing page */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <video
          autoPlay loop muted playsInline
          className="w-full h-full object-cover pointer-events-none"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260508_064122_c4750c0e-7476-4b44-94a2-a85a65c63bf2.mp4"
        />
        {/* Subtle darkening so the cards pop and the entry feels calm */}
        <div className="absolute inset-0 bg-black/40" />
      </div>

      <button
        onClick={handleSignOut}
        className="absolute top-6 right-6 z-30 text-white/50 hover:text-white transition-colors text-sm flex items-center gap-2"
      >
        <LogOut className="w-4 h-4" /> Sign out
      </button>

      <motion.div
        className="relative z-10"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
      >
        <PricingSection
          watermark={{ line1: 'Choose the best', line2: 'plan for you' }}
          onChoose={(plan, interval) => startCheckout(plan, interval)}
        />
      </motion.div>
    </motion.div>
  );
}
