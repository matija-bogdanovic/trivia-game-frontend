/* ==========================================================================
 * TODO(logo): SWAP THIS FOR THE REAL LOGO
 * --------------------------------------------------------------------------
 * The asset has not landed yet. When it does, replace the <div> below with
 * the image and delete the dashed-box styling:
 *
 *   <img src="/logo.svg" alt="Ipak se okreće" className="h-full w-auto" />
 *
 * Drop the file in `public/`. Keep the caller's height wrapper intact — the
 * top bar and the sidebar size this differently, and the rest of the layout
 * is measured against that height.
 * ==========================================================================*/
export default function LogoPlaceholder({
  label = 'Ipak se okreće',
}: {
  /** Announced to screen readers in place of the missing artwork. */
  label?: string;
}) {
  return (
    <div
      className="flex h-full items-center justify-center rounded-sm border border-dashed border-gold/40 bg-gold/5 px-3"
      role="img"
      aria-label={label}
    >
      <span className="text-[10px] font-bold tracking-[0.25em] whitespace-nowrap text-gold/70 uppercase">
        Logo
      </span>
    </div>
  );
}
