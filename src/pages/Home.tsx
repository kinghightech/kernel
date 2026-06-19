import { Home as HomeIcon, Building2, MapPin, DollarSign, Percent, Users, Calendar, Tag, Loader2 } from 'lucide-react';
import { useOnboarding } from '../onboarding';

export default function Home() {
  const { loading, data } = useOnboarding();

  const rows = data ? [
    { icon: Building2, label: 'Business type', value: data.businessType },
    { icon: MapPin, label: 'Location', value: data.address },
    { icon: DollarSign, label: 'Avg daily revenue', value: data.revenue ? `$${Number(data.revenue).toLocaleString()}` : null },
    { icon: Percent, label: 'Profit margin', value: data.profitMargin ? `${data.profitMargin}%` : null },
    { icon: Users, label: 'Business model', value: data.businessModel === 'Mixed' ? data.mixedModels.join(', ') : data.businessModel },
    { icon: Calendar, label: 'Peak traffic', value: data.peakTraffic },
    { icon: Users, label: 'Customers come from', value: data.customerSource },
    { icon: Tag, label: 'Promotions', value: data.promotionStyle },
  ].filter(r => r.value) : [];

  return (
    <div className="relative h-full overflow-y-auto bg-white text-neutral-900 dark:bg-[#0c0c0c] dark:text-white">
      <div className="absolute inset-0 pointer-events-none opacity-30 hidden dark:block" style={{ background: 'radial-gradient(800px circle at 50% 0%, #0B2551, transparent 70%)' }} />

      <div className="relative z-10 max-w-2xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-full bg-black/[0.05] border border-black/10 dark:bg-white/10 dark:border-white/20 flex items-center justify-center">
            <HomeIcon className="w-6 h-6 text-blue-600 dark:text-[#A4F4FD]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {data?.businessName ? `Welcome back, ${data.businessName}` : 'Welcome back'}
            </h1>
            <p className="text-neutral-500 dark:text-white/50 text-sm">Here's the setup we saved for you.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-neutral-500 dark:text-white/50 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading your setup…
          </div>
        ) : rows.length === 0 ? (
          <p className="text-neutral-500 dark:text-white/50 text-sm">No setup data found yet.</p>
        ) : (
          <div className="rounded-2xl border border-black/10 bg-black/[0.02] dark:border-white/10 dark:bg-white/[0.03] divide-y divide-black/5 dark:divide-white/5">
            {rows.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-4 px-5 py-4">
                <Icon className="w-4 h-4 text-neutral-400 dark:text-white/40 shrink-0" />
                <span className="text-neutral-500 dark:text-white/50 text-sm w-44 shrink-0">{label}</span>
                <span className="text-sm text-neutral-900 dark:text-white/90">{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
