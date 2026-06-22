import { HelpCircle } from 'lucide-react';

/**
 * A small, subtle "?" affordance pinned to the bottom-right of a dashboard page.
 * On hover it reveals a short, professional explanation of what the page does —
 * replacing the large descriptive page headers we removed for a cleaner look.
 */
export default function HelpHint({ text }: { text: string }) {
  return (
    <div className="group fixed bottom-5 right-5 z-40">
      {/* Tooltip */}
      <div
        role="tooltip"
        className="pointer-events-none absolute bottom-full right-0 mb-2 w-64 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 px-3.5 py-2.5 text-xs leading-relaxed text-neutral-600 dark:text-white/70 shadow-xl opacity-0 translate-y-1 transition-all duration-150 group-hover:opacity-100 group-hover:translate-y-0"
      >
        {text}
      </div>
      <button
        type="button"
        aria-label="About this page"
        className="w-7 h-7 rounded-full border border-black/10 dark:border-white/15 bg-white/70 dark:bg-white/[0.06] backdrop-blur flex items-center justify-center text-neutral-400 dark:text-white/40 hover:text-neutral-700 dark:hover:text-white/80 transition-colors"
      >
        <HelpCircle className="w-4 h-4" />
      </button>
    </div>
  );
}
