import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UtensilsCrossed, Coffee, CakeSlice, Shirt, Store, Smartphone,
  Scissors, Sparkles, Dumbbell, Wrench, MapPin, DollarSign, Percent, TrendingUp,
  Users, Calendar, Globe, Tag, Footprints, ShoppingBag, GraduationCap, Briefcase, HelpCircle, Loader2, Sun, Moon,
} from 'lucide-react';
import { supabase } from '../supabase';
import { saveOnboarding, stageOnboardingLocal, clearPendingOnboarding, type OnboardingData } from '../onboarding';
import { applyTheme, type Theme } from '../theme';

declare global {
  interface Window { google: any; }
}

const TOTAL_STEPS = 6;

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
  const [step, setStep] = useState(1);
  const [displayedText, setDisplayedText] = useState('');
  const [typingDone, setTypingDone] = useState(false);

  // Step 1
  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null);
  // Step 2
  const [address, setAddress] = useState('');
  const [latLng, setLatLng] = useState<{ lat: number; lng: number } | null>(null);
  // Step 3
  const [revenue, setRevenue] = useState('');
  const [profitMargin, setProfitMargin] = useState('');
  // Step 4
  const [businessModel, setBusinessModel] = useState<string | null>(null);
  const [mixedModels, setMixedModels] = useState<string[]>([]);
  // Step 5 (optional)
  const [peakTraffic, setPeakTraffic] = useState<string | null>(null);
  const [customerSource, setCustomerSource] = useState<string | null>(null);
  // Step 6
  const [promotionStyle, setPromotionStyle] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState('');

  // Step 7 — sign up
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  // Step 8 — theme choice
  const [theme, setTheme] = useState<Theme>('dark');

  const addressInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const fullText = 'Welcome to Kernel, where you, out of millions of businesses, will stand out. To start, answer these questions.';

  // Typewriter effect for step 1
  useEffect(() => {
    if (step !== 1) return;
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
  }, []);

  // Google Places Autocomplete for step 2 (gracefully does nothing if unavailable)
  useEffect(() => {
    if (step !== 2 || !addressInputRef.current) return;
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

  // Final step: create the account, then store every answer in Supabase.
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    const data = collectData();
    stageOnboardingLocal(data); // safety net in case the session isn't ready yet

    const { error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) {
      setAuthError(signUpError.message);
      setAuthLoading(false);
      return;
    }

    // If a session is available immediately, save now and clear the staged copy.
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await saveOnboarding(data);
      clearPendingOnboarding();
    }

    setAuthLoading(false);
    setStep(8); // go to the theme-choice screen
  };

  // Final step: pick a theme, save it, apply it, then enter the app.
  const finishWithTheme = async (chosen: Theme) => {
    setTheme(chosen);
    applyTheme(chosen);
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

  const stepIndicator = (activeStep: number) => (
    <div className="flex items-center justify-between mb-10">
      <div className="flex items-center gap-2">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
          <div key={s} className={`w-8 h-1.5 rounded-full transition-all duration-500 ${s <= activeStep ? 'bg-white/70' : 'bg-white/15'}`} />
        ))}
      </div>
      <span className="text-white/40 text-sm font-geist">{activeStep} / {TOTAL_STEPS}</span>
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
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-[#0c0c0c] text-white font-geist py-10">
      {/* Onboarding background video */}
      <video
        autoPlay loop muted playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260302_085844_21a8f4b3-dea5-4ede-be16-d53f6973bb14.mp4"
      />
      {/* Darkening overlay so the glass cards stay readable */}
      <div className="absolute inset-0 z-0 bg-black/55 pointer-events-none" />

      {/* Already have an account? */}
      <button
        onClick={() => navigate('/auth')}
        className="absolute top-6 right-6 z-20 text-sm text-white/70 hover:text-white transition-colors font-geist"
      >
        Already have an account? <span className="underline underline-offset-2 font-medium">Log in</span>
      </button>

      <div className="relative z-10 flex flex-col items-center justify-center w-full">

      {/* ===== STEP 1: Business Type ===== */}
      {step === 1 && (
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
                onClick={() => selectedBusiness && setStep(2)}
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

      {/* ===== STEP 2: Address ===== */}
      {step === 2 && (
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
            () => setStep(1),
            () => { const val = addressInputRef.current?.value || address; if (val.trim()) { setAddress(val); setStep(3); } },
            !!(address.trim() || addressInputRef.current?.value?.trim())
          )}
        </div>
      )}

      {/* ===== STEP 3: Revenue & Profit Margin ===== */}
      {step === 3 && (
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
          {navButtons(() => setStep(2), () => { if (revenue.trim() && profitMargin.trim()) setStep(4); }, !!(revenue.trim() && profitMargin.trim()))}
        </div>
      )}

      {/* ===== STEP 4: Business Model Type ===== */}
      {step === 4 && (
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
            () => setStep(3),
            () => {
              const canContinue = businessModel === 'Mixed' ? mixedModels.length >= 2 : !!businessModel;
              if (canContinue) setStep(5);
            },
            businessModel === 'Mixed' ? mixedModels.length >= 2 : !!businessModel
          )}
        </div>
      )}

      {/* ===== STEP 5: Optional Insights ===== */}
      {step === 5 && (
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

          {navButtons(() => setStep(4), () => setStep(6), true, 'Continue')}
        </div>
      )}

      {/* ===== STEP 6: Promotions ===== */}
      {step === 6 && (
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
            () => setStep(5),
            () => { if (promotionStyle) setStep(7); },
            !!promotionStyle,
            'Finish'
          )}
        </div>
      )}

      {/* ===== STEP 7: Create account (final screen) ===== */}
      {step === 7 && (
        <div className="relative z-10 w-[94%] max-w-xl rounded-3xl px-10 py-12 sm:px-16 sm:py-14 opacity-0 animate-fade-in-up" style={glassStyle}>
          <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-3 font-geist text-center">You're all set{businessName ? `, ${businessName}` : ''}.</h2>
          <p className="text-white/50 text-base sm:text-lg mb-10 font-geist text-center">Create your account to save your setup and continue.</p>

          {authError && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl mb-6 font-geist">{authError}</div>}

          <form className="space-y-5" onSubmit={handleSignUp}>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2 font-geist">Email address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com"
                className="w-full rounded-2xl px-5 py-4 text-base text-white placeholder-white/30 font-geist outline-none focus:border-white/30 transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2 font-geist">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
                className="w-full rounded-2xl px-5 py-4 text-base text-white placeholder-white/30 font-geist outline-none focus:border-white/30 transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
            </div>
            <button disabled={authLoading} type="submit"
              className="w-full flex items-center justify-center gap-2 bg-white text-black font-semibold rounded-2xl py-4 text-base hover:bg-white/90 transition-colors mt-2 disabled:opacity-50 font-geist">
              {authLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {authLoading ? 'Creating account…' : 'Create account & finish'}
            </button>
          </form>

          <div className="flex items-center justify-between mt-8">
            <button onClick={() => setStep(6)} className="text-sm text-white/50 hover:text-white transition-colors font-geist">‹ Back</button>
            <button onClick={() => navigate('/auth')} className="text-sm text-white/50 hover:text-white transition-colors font-geist">Already have an account? Sign in</button>
          </div>
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
    </div>
  );
}
