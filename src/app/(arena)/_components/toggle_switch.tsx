'use client';

/**
 * Labelled on/off switch used throughout Settings.
 *
 * The export's version was a bare button with a sliding box inside and no
 * state exposed to assistive tech. role="switch" plus aria-checked is what
 * makes it announce as a toggle rather than an unlabelled button.
 */
export default function ToggleSwitch({
  label,
  description = '',
  checked,
  labelId,
  onToggle,
}: {
  label: string;
  description?: string;
  checked: boolean;
  labelId: string;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div>
        <div className="text-sm text-white" id={labelId}>
          {label}
        </div>
        <div className="mt-0.5 text-[11px] text-arena-300">{description}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        onClick={onToggle}
        className={`relative h-6 w-11 shrink-0 cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-arena-800 focus-visible:outline-none ${
          checked ? 'bg-gold' : 'bg-arena-600'
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}
