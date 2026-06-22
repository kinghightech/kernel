import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UtensilsCrossed, Coffee, CakeSlice, Shirt, Store, Smartphone,
  Scissors, Sparkles, Dumbbell, Wrench, MapPin, DollarSign, Percent, TrendingUp,
  Users, Calendar, Globe, Tag, Footprints, ShoppingBag, GraduationCap, Briefcase, HelpCircle, Sun, Moon,
} from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../supabase';
import { saveOnboarding, stageOnboardingLocal, clearPendingOnboarding, type OnboardingData } from '../onboarding';
import { applyTheme, type Theme } from '../theme';

declare global {
  interface Window { google: any; }
}

const GoogleIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const TOTAL_QUESTION_STEPS = 6;

const businesses = [
  { label: 'Restaurant', icon: UtensilsCrossed },
  { label: 'Café', icon: Coffee },
  { label: 'Bakery', icon: CakeSlice },
  { label: 'Clothing / Boutique', icon: Shirt },
  { label: 'Convenience Store', icon: Store },
  { label: 'Specialty Retail', icon: Smartphone },
  { label: 'Hair Salon / Barber', icon: Scissors },
  { label: 'Nail Salon', icon: Sparkles },
  { label: 'Fitness Studio', icon: Dumbbell },
  { label: 'Service Business', icon: Wrench },
];

const businessModels = [
  { label: 'Walk-in heavy', desc: 'Most customers walk in without reservations' },
  { label: 'Mixed', desc: 'Select multiple — pick the ones that apply' },
  { label: 'Appointment-based', desc: 'Most customers book ahead of time' },
  { label: 'Online', desc: 'Most sales happen through delivery or online' },
];

const peakTrafficOptions = ['Morning', 'Lunch', 'Afternoon', 'Evening', 'Late night'];
const customerSourceOptions = [
  { label: 'Nearby schools', icon: GraduationCap },
  { label: 'Offices / workers', icon: Briefcase },
  { label: 'Shopping / mall traffic', icon: ShoppingBag },
  { label: 'Local neighborhood', icon: Footprints },
  { label: 'People who specifically travel here', icon: Globe },
  { label: 'Not sure', icon: HelpCircle },
];

const promotionOptions = [
  'Discounts (e.g., % off)',
  'Bundles (buy 1 get 1, combos)',
  'Limited-time offers',
  'Loyalty rewards',
  "I don't run promotions",
];

// US industry average statistics
const industryStats: Record<string, { revenue: string; margin: string }> = {
  'Restaurant': { revenue: '6027', margin: '4' },
  'Café': { revenue: '3397', margin: '14' },
  'Bakery': { revenue: '1096', margin: '15' },
  'Clothing / Boutique': { revenue: '734', margin: '4' },
  'Convenience Store': { revenue: '15068', margin: '2' },
  'Specialty Retail': { revenue: '1227', margin: '5.5' },
  'Hair Salon / Barber': { revenue: '879', margin: '10' },
  'Nail Salon': { revenue: '200', margin: '4.4' },
  'Fitness Studio': { revenue: '1192', margin: '15' },
  'Service Business': { revenue: '748', margin: '13' },
};

export default function Onboarding() {
  const navigate = useNavigate();
  // Step 1 is now Sign Up. Steps 2-7 are questions. Step 8 is Theme.
  const [step, setStep] = useState(1);
  const [displayedText, setDisplayedText] = useState('');
  const [typingDone, setTypingDone] = useState(false);

  // Auth fields (Step 1)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  // Email of the signed-in user, shown top-right during the question steps.
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Question fields
  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null);
  const [address, setAddress] = useState('');
  const [latLng, setLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const [revenue, setRevenue] = useState('');
  const [profitMargin, setProfitMargin] = useState('');
  const [businessModel, setBusinessModel] = useState<string | null>(null);
  const [mixedModels, setMixedModels] = useState<string[]>([]);
  const [peakTraffic, setPeakTraffic] = useState<string | null>(null);
  const [customerSource, setCustomerSource] = useState<string | null>(null);
  const [promotionStyle, setPromotionStyle] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [theme, setTheme] = useState<Theme>('dark');

  const addressInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const fullText = 'Welcome to Kernel, where you, out of millions of businesses, will stand out. To start, answer these questions.';

  // If the user is already signed in (e.g. came back from Google), skip the
  // sign-up screen (step 1) and go straight to the first question.
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setStep((s) => (s === 1 ? 2 : s));
        setUserEmail(session.user.email ?? null);
      }
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Typewriter effect for step 2 (first question step)
  useEffect(() => {
    if (step !== 2) return;
    if (typingDone) return; // Only do it once
    let i = 0;
    const interval = setInterval(() => {
      if (i < fullText.length) {
        setDisplayedText(fullText.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
        setTimeout(() => setTypingDone(true), 400);
      }
    }, 30);
    return () => clearInterval(interval);
  }, [step, fullText, typingDone]);

  // Google Places Autocomplete for step 3 (address step)
  useEffect(() => {
    if (step !== 3 || !addressInputRef.current) return;
    const initTimer = setTimeout(() => {
      if (!window.google?.maps?.places) return;
      try {
        autocompleteRef.current = new window.google.maps.places.Autocomplete(
          addressInputRef.current!,
          { types: ['establishment', 'geocode'] }
        );
        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current.getPlace();
          if (place?.formatted_address) {
            setAddress(place.formatted_address);
            if (addressInputRef.current) addressInputRef.current.value = place.formatted_address;
          }
          if (place?.geometry?.location) {
            setLatLng({ lat: place.geometry.location.lat(), lng: place.geometry.location.lng() });
          }
        });
      } catch (err) {
        console.error('Google Places init error:', err);
      }
    }, 500);
    return () => clearTimeout(initTimer);
  }, [step]);

  const collectData = (): OnboardingData => ({
    businessType: selectedBusiness,
    address,
    lat: latLng?.lat ?? null,
    lng: latLng?.lng ?? null,
    revenue,
    profitMargin,
    businessModel,
    mixedModels,
    peakTraffic,
    customerSource,
    promotionStyle,
    businessName,
    theme,
  });

  // Step 1 action: create the account
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    const { error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) {
      setAuthError(signUpError.message);
      setAuthLoading(false);
      return;
    }

    setAuthLoading(false);
    setStep(2); // move to the first question
  };

  const handleGoogleAuth = async () => {
    setAuthLoading(true);
    setAuthError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    if (error) {
      setAuthError(error.message);
      setAuthLoading(false);
    }
  };

  // Final step: pick a theme and save it, then enter the app.
  // We keep the screen dark through the payment page (it's always dark) so the
  // handoff stays smooth — the chosen theme is applied once inside the dashboard.
  const finishWithTheme = async (chosen: Theme) => {
    setTheme(chosen);
    applyTheme('dark');
    const data = { ...collectData(), theme: chosen };
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await saveOnboarding(data);
      clearPendingOnboarding();
    } else {
      stageOnboardingLocal(data);
    }
    navigate('/dashboard');
  };

  // Shared styles
  const glassStyle = {
    background: 'linear-gradient(135deg, rgba(20, 24, 32, 0.7) 0%, rgba(12, 14, 20, 0.6) 100%)',
    backdropFilter: 'blur(28px) saturate(1.6)',
    WebkitBackdropFilter: 'blur(28px) saturate(1.6)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 8px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.12), inset 0 -1px 0 rgba(255, 255, 255, 0.04)',
  };

  const optionBtnStyle = (selected: boolean) => ({
    border: `1px solid ${selected ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'}`,
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
  });

  const stepIndicator = (activeQuestionStep: number) => (
    <div className="flex items-center justify-between mb-10">
      <div className="flex items-center gap-2">
        {Array.from({ length: TOTAL_QUESTION_STEPS }, (_, i) => i + 1).map((s) => (
          <div key={s} className={`w-8 h-1.5 rounded-full transition-all duration-500 ${s <= activeQuestionStep ? 'bg-white/70' : 'bg-white/15'}`} />
        ))}
      </div>
      <span className="text-white/40 text-sm font-geist">{activeQuestionStep} / {TOTAL_QUESTION_STEPS}</span>
    </div>
  );

  const navButtons = (back: () => void, next: () => void, canContinue: boolean, nextLabel = 'Continue') => (
    <div className="flex justify-between mt-10">
      <button
        onClick={back}
        className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold font-geist transition-all duration-300 bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white hover:scale-105 active:scale-95 cursor-pointer"
        style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
      >
        <span className="text-xs">‹</span> Back
      </button>
      <button
        onClick={next}
        disabled={!canContinue}
        className={`flex items-center gap-2 px-7 py-3.5 rounded-xl text-base font-semibold font-geist transition-all duration-300 ${
          canContinue
            ? 'bg-white/15 text-white border border-white/20 hover:bg-white/25 hover:scale-105 active:scale-95 cursor-pointer'
            : 'bg-white/5 text-white/30 border border-white/5 cursor-not-allowed'
        }`}
        style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
      >
        {nextLabel} <span className="text-xs">›</span>
      </button>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-[#000000] text-white font-geist"
    >
      {/* Background for steps 2-8 */}
      {step > 1 && (
        <>
          <video
            autoPlay loop muted playsInline
            className="absolute inset-0 w-full h-full object-cover z-0"
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260302_085844_21a8f4b3-dea5-4ede-be16-d53f6973bb14.mp4"
          />
          <div className="absolute inset-0 z-0 bg-black/55 pointer-events-none" />
        </>
      )}

      {/* ===== STEP 1: Sign up (split screen) ===== */}
      {step === 1 && (
        <div className="absolute inset-0 flex z-10 bg-[#000000]">
          {/* Left side: Form */}
          <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 lg:px-24 xl:px-32 relative z-10">
            <div className="w-full max-w-md mx-auto">
              <button 
                onClick={() => navigate('/')} 
                className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors mb-12 font-medium"
              >
                <span className="text-lg leading-none mb-[2px]">‹</span> Back to home
              </button>

              <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-3 tracking-tight">
                Create your account
              </h2>
              <p className="text-white/50 text-base mb-10">
                Sign up to get started with Kernel.
              </p>

              {authError && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl mb-6">{authError}</div>}

              <button 
                type="button"
                onClick={handleGoogleAuth}
                disabled={authLoading}
                className="w-full flex items-center justify-center gap-3 bg-white text-black font-semibold rounded-xl py-4 text-base hover:bg-white/90 transition-colors disabled:opacity-50"
              >
                <GoogleIcon />
                Sign up with Google
              </button>

              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-white/40 text-sm font-medium">or continue with email</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <form className="space-y-5" onSubmit={handleSignUp}>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Email address</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com"
                    className="w-full rounded-xl px-5 py-4 text-base text-white placeholder-white/30 outline-none focus:border-white/40 transition-colors"
                    style={{ background: '#111111', border: '1px solid #222222' }} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Password</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
                    className="w-full rounded-xl px-5 py-4 text-base text-white placeholder-white/30 outline-none focus:border-white/40 transition-colors"
                    style={{ background: '#111111', border: '1px solid #222222' }} />
                </div>
                <button disabled={authLoading} type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-white/5 border border-white/20 text-white font-semibold rounded-xl py-4 text-base hover:bg-white/10 transition-colors mt-4 disabled:opacity-50">
                  {authLoading ? 'Creating account…' : 'Create account & continue'}
                </button>
              </form>

              <div className="mt-8 text-center flex flex-col gap-6">
                <button onClick={() => navigate('/auth')} className="text-sm text-white/50 hover:text-white transition-colors">
                  Already have an account? Sign in
                </button>
                <p className="text-xs text-white/30">
                  By continuing, you agree to our{' '}
                  <a href="https://kerneltermsofservice.notion.site/" target="_blank" rel="noopener noreferrer" className="underline hover:text-white/50 transition-colors">Terms of Service</a>
                  {' '}and{' '}
                  <a href="https://kernelprivacypolicy.notion.site/" target="_blank" rel="noopener noreferrer" className="underline hover:text-white/50 transition-colors">Privacy Policy</a>.
                </p>
              </div>
            </div>
          </div>

          {/* Right side: Video */}
          <div className="hidden lg:block lg:w-1/2 relative bg-[#0c0c0c]">
            <video
              autoPlay loop muted playsInline
              className="absolute inset-0 w-full h-full object-cover"
              src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260302_085844_21a8f4b3-dea5-4ede-be16-d53f6973bb14.mp4"
            />
            <div className="absolute inset-0 bg-black/10" />
          </div>
        </div>
      )}

      {/* For steps 2-8, use the frosted glass centered container */}
      {step > 1 && (
        <div className="relative z-10 flex flex-col items-center justify-center w-full py-10 min-h-screen">
          {/* Signed-in user, top-right */}
          {userEmail && (
            <div className="absolute top-6 right-6 z-20 text-sm text-white/60 font-geist">
              Signed in as <span className="text-white/90 font-medium">{userEmail}</span>
            </div>
          )}

          {/* ===== STEP 2: Business Type ===== */}
          {step === 2 && (
            <div className="relative z-10 w-[94%] max-w-5xl rounded-3xl px-12 py-14 sm:px-16 sm:py-16 opacity-0 animate-fade-in-up" style={glassStyle}>
              {stepIndicator(1)}
              <div className="mb-10 font-geist">
                <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-snug text-white">
                  {displayedText}
                  {!typingDone && <span className="inline-block w-[3px] h-[1em] bg-white/80 ml-1 align-middle animate-pulse" />}
                </h1>
              </div>
              <div className={`transition-all duration-700 ${typingDone ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
                <h2 className="text-2xl sm:text-3xl font-semibold text-white mb-3 font-geist italic">What type of business are you?</h2>
                <p className="text-white/50 text-base mb-8 font-geist">This helps us tailor insights to your industry.</p>
                <div className="grid grid-cols-2 gap-4 mb-10">
                  {businesses.map(({ label, icon: Icon }) => (
                    <button
                      key={label}
                      onClick={() => setSelectedBusiness(label)}
                      className={`flex items-center gap-3 px-5 py-4 rounded-2xl text-left text-base font-medium transition-all duration-300 cursor-pointer font-geist group
                        ${selectedBusiness === label
                          ? 'bg-white/15 text-white scale-[1.02] shadow-lg shadow-white/5'
                          : 'bg-white/5 text-white/80 hover:bg-white/10 hover:text-white hover:scale-[1.01]'
                        }`}
                      style={optionBtnStyle(selectedBusiness === label)}
                    >
                      <Icon className={`w-5 h-5 flex-shrink-0 transition-all duration-300 ${selectedBusiness === label ? 'text-white' : 'text-white/50 group-hover:text-white/70'}`} />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => selectedBusiness && setStep(3)}
                    disabled={!selectedBusiness}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold font-geist transition-all duration-300 ${selectedBusiness
                      ? 'bg-white/15 text-white border border-white/20 hover:bg-white/25 hover:scale-105 active:scale-95 cursor-pointer'
                      : 'bg-white/5 text-white/30 border border-white/5 cursor-not-allowed'
                    }`}
                    style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
                  >
                    Continue <span className="text-xs">›</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ===== STEP 3: Address ===== */}
          {step === 3 && (
            <div className="relative z-10 w-[94%] max-w-5xl rounded-3xl px-12 py-14 sm:px-16 sm:py-16 opacity-0 animate-fade-in-up" style={glassStyle}>
              {stepIndicator(2)}
              <h2 className="text-2xl sm:text-3xl font-semibold text-white mb-3 font-geist italic">Where is your business located?</h2>
              <p className="text-white/50 text-base mb-8 font-geist">Start typing your address and select from the suggestions.</p>
              <div className="relative mb-2">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  ref={addressInputRef}
                  type="text"
                  placeholder="Search your business address..."
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full pl-12 pr-5 py-4 rounded-2xl text-base text-white placeholder-white/30 font-geist outline-none transition-all duration-300 focus:border-white/30 focus:shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                  style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
                />
              </div>
              {navButtons(
                () => setStep(2),
                () => { if (address.trim()) setStep(4); },
                !!address.trim()
              )}
            </div>
          )}

          {/* ===== STEP 4: Revenue & Profit Margin ===== */}
          {step === 4 && (
            <div className="relative z-10 w-[94%] max-w-5xl rounded-3xl px-12 py-14 sm:px-16 sm:py-16 opacity-0 animate-fade-in-up" style={glassStyle}>
              {stepIndicator(3)}
              <h2 className="text-2xl sm:text-3xl font-semibold text-white mb-3 font-geist italic">Tell us about your numbers</h2>
              <p className="text-white/50 text-base mb-8 font-geist">This helps us build accurate revenue forecasts for your business.</p>

              {selectedBusiness && industryStats[selectedBusiness] && (
                <button
                  onClick={() => {
                    const stats = industryStats[selectedBusiness!];
                    setRevenue(stats.revenue);
                    setProfitMargin(stats.margin);
                  }}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold font-geist mb-8 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    color: 'rgba(255, 255, 255, 0.7)',
                  }}
                >
                  <TrendingUp className="w-4 h-4 text-white/40" />
                  Use average {selectedBusiness.toLowerCase()} statistics
                </button>
              )}

              <div className="mb-6">
                <label className="block text-white/70 text-sm font-semibold font-geist mb-2">Average Daily Revenue</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input type="text" inputMode="numeric" placeholder="e.g. 500" value={revenue}
                    onChange={(e) => setRevenue(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full pl-12 pr-5 py-4 rounded-2xl text-base text-white placeholder-white/30 font-geist outline-none transition-all duration-300 focus:border-white/30"
                    style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
                  />
                  {revenue && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 text-sm font-geist">${Number(revenue).toLocaleString()} / day</span>}
                </div>
              </div>
              <div className="mb-2">
                <label className="block text-white/70 text-sm font-semibold font-geist mb-2">Estimated Profit Margin</label>
                <div className="relative">
                  <Percent className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input type="text" inputMode="numeric" placeholder="e.g. 15" value={profitMargin}
                    onChange={(e) => { const val = e.target.value.replace(/[^0-9.]/g, ''); if (Number(val) <= 100 || val === '') setProfitMargin(val); }}
                    className="w-full pl-12 pr-5 py-4 rounded-2xl text-base text-white placeholder-white/30 font-geist outline-none transition-all duration-300 focus:border-white/30"
                    style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
                  />
                  {profitMargin && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 text-sm font-geist">{profitMargin}% margin</span>}
                </div>
              </div>
              {navButtons(() => setStep(3), () => { if (revenue.trim() && profitMargin.trim()) setStep(5); }, !!(revenue.trim() && profitMargin.trim()))}
            </div>
          )}

          {/* ===== STEP 5: Business Model Type ===== */}
          {step === 5 && (
            <div className="relative z-10 w-[94%] max-w-5xl rounded-3xl px-12 py-14 sm:px-16 sm:py-16 opacity-0 animate-fade-in-up" style={glassStyle}>
              {stepIndicator(4)}
              <h2 className="text-2xl sm:text-3xl font-semibold text-white mb-3 font-geist italic">How do customers reach you?</h2>
              <p className="text-white/50 text-base mb-8 font-geist">This is critical for understanding how weather affects your business.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
                {businessModels.map(({ label, desc }) => {
                  const isMixedMode = businessModel === 'Mixed';
                  const isSelected = label === 'Mixed'
                    ? businessModel === 'Mixed'
                    : isMixedMode
                      ? mixedModels.includes(label)
                      : businessModel === label;

                  const handleClick = () => {
                    if (label === 'Mixed') {
                      if (businessModel === 'Mixed') {
                        setBusinessModel(null);
                        setMixedModels([]);
                      } else {
                        setBusinessModel('Mixed');
                        setMixedModels([]);
                      }
                    } else if (isMixedMode) {
                      setMixedModels((prev) =>
                        prev.includes(label) ? prev.filter((m) => m !== label) : [...prev, label]
                      );
                    } else {
                      setBusinessModel(label);
                      setMixedModels([]);
                    }
                  };

                  return (
                    <button
                      key={label}
                      onClick={handleClick}
                      className={`flex flex-col gap-1 px-5 py-5 rounded-2xl text-left transition-all duration-300 cursor-pointer font-geist group
                        ${isSelected
                          ? 'bg-white/15 text-white scale-[1.02] shadow-lg shadow-white/5'
                          : 'bg-white/5 text-white/80 hover:bg-white/10 hover:text-white hover:scale-[1.01]'
                        }`}
                      style={optionBtnStyle(isSelected)}
                    >
                      <span className="text-base font-semibold">{label}</span>
                      <span className={`text-sm ${isSelected ? 'text-white/60' : 'text-white/35'}`}>
                        {label === 'Mixed' && businessModel === 'Mixed'
                          ? 'Select which models apply below'
                          : desc}
                      </span>
                    </button>
                  );
                })}
              </div>

              {businessModel === 'Mixed' && mixedModels.length > 0 && (
                <p className="text-white/40 text-sm font-geist mt-3 mb-0">Selected: {mixedModels.join(', ')}</p>
              )}

              {navButtons(
                () => setStep(4),
                () => {
                  const canContinue = businessModel === 'Mixed' ? mixedModels.length >= 2 : !!businessModel;
                  if (canContinue) setStep(6);
                },
                businessModel === 'Mixed' ? mixedModels.length >= 2 : !!businessModel
              )}
            </div>
          )}

          {/* ===== STEP 6: Optional Insights ===== */}
          {step === 6 && (
            <div className="relative z-10 w-[94%] max-w-5xl rounded-3xl px-12 py-12 sm:px-16 sm:py-14 opacity-0 animate-fade-in-up overflow-y-auto max-h-[90vh]" style={glassStyle}>
              {stepIndicator(5)}
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl sm:text-3xl font-semibold text-white font-geist italic">A few more details</h2>
                <span className="text-xs text-white/30 border border-white/15 rounded-full px-2.5 py-0.5 font-geist">Optional</span>
              </div>
              <p className="text-white/50 text-base mb-8 font-geist">These are optional but help us give you more accurate forecasts.</p>

              <div className="mb-8">
                <h3 className="text-lg font-semibold text-white mb-1 font-geist flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-white/50" /> When do you get the most customers?
                </h3>
                <p className="text-white/40 text-sm mb-3 font-geist">Weather only matters during your busiest hours.</p>
                <div className="flex flex-wrap gap-3">
                  {peakTrafficOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setPeakTraffic(opt)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 cursor-pointer font-geist
                        ${peakTraffic === opt ? 'bg-white/15 text-white scale-[1.02]' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'}`}
                      style={optionBtnStyle(peakTraffic === opt)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-2">
                <h3 className="text-lg font-semibold text-white mb-1 font-geist flex items-center gap-2">
                  <Users className="w-4 h-4 text-white/50" /> Where do most of your customers come from?
                </h3>
                <p className="text-white/40 text-sm mb-3 font-geist">Helps us weight traffic anchors near your business.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {customerSourceOptions.map(({ label, icon: Icon }) => (
                    <button
                      key={label}
                      onClick={() => setCustomerSource(label)}
                      className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 cursor-pointer font-geist group
                        ${customerSource === label
                          ? 'bg-white/15 text-white scale-[1.02]'
                          : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                        }`}
                      style={optionBtnStyle(customerSource === label)}
                    >
                      <Icon className={`w-4 h-4 flex-shrink-0 ${customerSource === label ? 'text-white' : 'text-white/40'}`} />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {navButtons(() => setStep(5), () => setStep(7), true, 'Continue')}
            </div>
          )}

          {/* ===== STEP 7: Promotions ===== */}
          {step === 7 && (
            <div className="relative z-10 w-[94%] max-w-5xl rounded-3xl px-12 py-14 sm:px-16 sm:py-16 opacity-0 animate-fade-in-up" style={glassStyle}>
              {stepIndicator(6)}
              <h2 className="text-2xl sm:text-3xl font-semibold text-white mb-3 font-geist italic flex items-center gap-3">
                <Tag className="w-7 h-7 text-white/50" /> What types of promotions work best for you?
              </h2>
              <p className="text-white/50 text-base mb-8 font-geist">This powers smart recommendations for slower days.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
                {promotionOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setPromotionStyle(opt)}
                    className={`px-5 py-4 rounded-2xl text-left text-base font-medium transition-all duration-300 cursor-pointer font-geist
                      ${promotionStyle === opt
                        ? 'bg-white/15 text-white scale-[1.02] shadow-lg shadow-white/5'
                        : 'bg-white/5 text-white/80 hover:bg-white/10 hover:text-white hover:scale-[1.01]'
                      }`}
                    style={optionBtnStyle(promotionStyle === opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-semibold text-white mb-2 font-geist flex items-center gap-2">
                   What is the name of your business? <span className="text-xs text-white/30 border border-white/15 rounded-full px-2 py-0.5 ml-2 font-normal">Optional</span>
                </h3>
                <div className="relative">
                  <input
                    type="text"
                    value={businessName}
                    onChange={e => setBusinessName(e.target.value)}
                    placeholder="e.g. The Daily Grind"
                    className="w-full px-5 py-4 rounded-2xl text-base text-white placeholder-white/30 font-geist outline-none transition-all duration-300 focus:border-white/30 focus:shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                    style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
                  />
                </div>
              </div>
              {navButtons(
                () => setStep(6),
                () => { if (promotionStyle) setStep(8); },
                !!promotionStyle,
                'Finish Setup'
              )}
            </div>
          )}

          {/* ===== STEP 8: Choose theme ===== */}
          {step === 8 && (
            <div className="relative z-10 w-[94%] max-w-3xl rounded-3xl px-10 py-12 sm:px-16 sm:py-14 opacity-0 animate-fade-in-up" style={glassStyle}>
              <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-3 font-geist text-center">Choose your dashboard</h2>
              <p className="text-white/50 text-base sm:text-lg mb-10 font-geist text-center">Pick the look you prefer. You can change this anytime in settings.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10">
                {/* Dark option */}
                <button
                  onClick={() => { setTheme('dark'); applyTheme('dark'); }}
                  className={`rounded-2xl p-5 text-left transition-all duration-300 ${theme === 'dark' ? 'ring-2 ring-white scale-[1.01]' : 'ring-1 ring-white/10 hover:ring-white/30'}`}
                  style={optionBtnStyle(theme === 'dark')}
                >
                  <div className="rounded-xl overflow-hidden border border-white/10 h-28 flex mb-4" style={{ background: '#0c0c0c' }}>
                    <div className="w-1/4 h-full" style={{ background: '#000' }} />
                    <div className="flex-1 p-3 space-y-2">
                      <div className="h-2 w-2/3 rounded bg-white/30" />
                      <div className="h-2 w-1/2 rounded bg-white/15" />
                      <div className="h-2 w-3/4 rounded bg-white/15" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-white font-semibold font-geist">
                    <Moon className="w-4 h-4" /> Dark
                  </div>
                </button>

                {/* Light option */}
                <button
                  onClick={() => { setTheme('light'); applyTheme('light'); }}
                  className={`rounded-2xl p-5 text-left transition-all duration-300 ${theme === 'light' ? 'ring-2 ring-white scale-[1.01]' : 'ring-1 ring-white/10 hover:ring-white/30'}`}
                  style={optionBtnStyle(theme === 'light')}
                >
                  <div className="rounded-xl overflow-hidden border border-black/10 h-28 flex mb-4" style={{ background: '#f4f5f7' }}>
                    <div className="w-1/4 h-full" style={{ background: '#ffffff' }} />
                    <div className="flex-1 p-3 space-y-2">
                      <div className="h-2 w-2/3 rounded bg-black/30" />
                      <div className="h-2 w-1/2 rounded bg-black/15" />
                      <div className="h-2 w-3/4 rounded bg-black/15" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-white font-semibold font-geist">
                    <Sun className="w-4 h-4" /> Light
                  </div>
                </button>
              </div>

              <button
                onClick={() => finishWithTheme(theme)}
                className="w-full flex items-center justify-center gap-2 bg-white text-black font-semibold rounded-2xl py-4 text-base hover:bg-white/90 transition-colors font-geist"
              >
                Continue to dashboard <span className="text-xs">›</span>
              </button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
