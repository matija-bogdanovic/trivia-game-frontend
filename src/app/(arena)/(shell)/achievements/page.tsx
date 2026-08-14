import PageHeader from '@/app/(arena)/_components/page_header';
import { achievements, type Achievement } from '@/app/(arena)/_mock/progress';

/** Progress toward a locked achievement, clamped to 100. */
function progressPercent(a: Achievement): number {
  if (!a.max) return 0;
  return Math.min(100, ((a.progress ?? 0) / a.max) * 100);
}

/** Achievement gallery, split into unlocked and in-progress. */
export default function Page() {
  const unlocked = achievements.filter((a) => a.unlocked);
  const inProgress = achievements.filter((a) => !a.unlocked);
  const percentComplete = Math.round(
    (unlocked.length / achievements.length) * 100
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader eyebrow="Progress" title="ACHIEVEMENTS" />

      {/* ========================================================= progress */}
      <section className="mb-8 flex flex-col gap-4 border border-white/[0.07] bg-arena-800 p-5 sm:flex-row sm:items-center sm:gap-6">
        <div>
          <div className="mb-1 text-[10px] tracking-widest text-arena-300 uppercase">
            Unlocked
          </div>
          <div className="text-3xl font-bold text-gold tabular-nums">
            {unlocked.length} / {achievements.length}
          </div>
        </div>
        <div className="flex-1">
          <div
            className="h-2 bg-arena-700"
            role="meter"
            aria-valuenow={percentComplete}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Achievement completion"
          >
            <div
              className="h-full bg-gold transition-all"
              style={{ width: `${percentComplete}%` }}
            />
          </div>
          <div className="mt-1 text-[10px] tracking-wider text-arena-300">
            {percentComplete}% complete
          </div>
        </div>
      </section>

      {/* ========================================================= unlocked */}
      <section className="mb-8">
        <h2 className="mb-4 text-[10px] tracking-[0.25em] text-arena-200 uppercase">
          Unlocked
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {unlocked.map((a) => (
            <div
              key={a.title}
              className="border border-gold/20 bg-arena-800 p-5 text-center"
            >
              <div className="mb-3 text-3xl" aria-hidden="true">
                {a.icon}
              </div>
              <div className="mb-1 text-sm font-bold text-gold">{a.title}</div>
              <div className="mb-3 text-[10px] leading-relaxed text-arena-200">
                {a.description}
              </div>
              <div className="text-[9px] tracking-wider text-arena-400">
                Unlocked {a.date}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ====================================================== in progress */}
      <section>
        <h2 className="mb-4 text-[10px] tracking-[0.25em] text-arena-200 uppercase">
          In Progress
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {inProgress.map((a) => (
            <div
              key={a.title}
              className="border border-white/[0.05] bg-arena-750 p-5 text-center"
            >
              <div
                className="mb-3 text-3xl opacity-40 grayscale"
                aria-hidden="true"
              >
                {a.icon}
              </div>
              <div className="mb-1 text-sm font-bold text-arena-300">
                {a.title}
              </div>
              <div className="mb-3 text-[10px] leading-relaxed text-arena-400">
                {a.description}
              </div>

              {a.max ? (
                <>
                  <div
                    className="mb-1.5 h-1 bg-arena-600"
                    role="meter"
                    aria-valuenow={a.progress}
                    aria-valuemin={0}
                    aria-valuemax={a.max}
                    aria-label={`${a.title} progress`}
                  >
                    <div
                      className="h-full bg-arena-300 transition-all"
                      style={{ width: `${progressPercent(a)}%` }}
                    />
                  </div>
                  <div className="text-[9px] tracking-wider text-arena-400 tabular-nums">
                    {a.progress} / {a.max}
                  </div>
                </>
              ) : null}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
