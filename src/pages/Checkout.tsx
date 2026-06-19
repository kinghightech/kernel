import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

// Stripe returns the user here (e.g. trykernel.xyz/checkout) after checkout.
// We briefly show a spinner, then forward into the app:
//  - success  -> dashboard, which polls until the subscription is active
//  - anything else (cancelled) -> dashboard, which shows the pay wall
export default function Checkout() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const status = params.get('status');

  useEffect(() => {
    if (status === 'success') navigate('/dashboard?checkout=success', { replace: true });
    else navigate('/dashboard', { replace: true });
  }, [status, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0c0c0c] text-white gap-4">
      <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      <p className="text-white/60 text-sm">
        {status === 'success' ? 'Completing your checkout…' : 'Returning you to Kernel…'}
      </p>
    </div>
  );
}
