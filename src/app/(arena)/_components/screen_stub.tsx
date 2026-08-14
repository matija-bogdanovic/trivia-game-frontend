/**
 * Placeholder for an arena screen whose design has not been ported yet. Every
 * one of these is replaced by the real screen in P3; when none are left, this
 * component goes with them.
 */
export default function ScreenStub({
  title,
  source,
}: {
  title: string;
  /** the view in the design export this screen is ported from */
  source: string;
}) {
  return (
    <div className="p-8">
      <div className="text-g200 text-[10px] tracking-[0.2em] uppercase mb-2">
        Not built yet
      </div>
      <h1 className="text-4xl font-bold text-white tracking-wide mb-4">
        {title}
      </h1>
      <div className="bg-g800 border border-white/[0.07] p-5 inline-block">
        <div className="text-g200 text-[11px] tracking-wider uppercase mb-1">
          Ports from
        </div>
        <div className="text-gold text-sm font-bold">{source}</div>
      </div>
    </div>
  );
}
