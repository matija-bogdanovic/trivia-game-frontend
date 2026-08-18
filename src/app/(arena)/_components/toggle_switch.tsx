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
        {/*
          left-0 is not decoration. The knob is absolutely positioned with only
          `top` set, so without it the browser falls back to the STATIC
          position — and a button centres its content, which put the knob's
          origin at the middle of the track. Measured: 26px from the left edge
          in the OFF state on a 44px track, i.e. already hard right, with the
          ON state translating a further 24px straight off the end.

          With the origin pinned, the two translates are simply the inset and
          the far edge: 4px, and 44 - 16 - 4 = 24px.
        */}
        <span
          className={`absolute top-1 left-0 h-4 w-4 bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}
