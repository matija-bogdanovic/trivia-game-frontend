import { achievements } from '@/app/(arena)/_mock/progress';

export default function Page() {
  const unlocked = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="p-8">
      <div className="mb-6">
        <div className="text-arena-200 text-[10px] tracking-[0.25em] uppercase mb-1">
          Progress
        </div>
        <h1 className="text-3xl font-bold tracking-wide">ACHIEVEMENTS</h1>
      </div>

      {/* Progress bar */}
      <div className="bg-arena-800 border border-white/[0.07] p-5 mb-8 flex items-center gap-6">
        <div>
          <div className="text-arena-300 text-[10px] tracking-widest uppercase mb-1">
            Unlocked
          </div>
          <div className="text-gold text-3xl font-bold">
            {unlocked} / {achievements.length}
          </div>
        </div>
        <div className="flex-1">
          <div className="h-2 bg-arena-700">
            <div
              className="h-full bg-gold transition-all"
              style={{ width: `${(unlocked / achievements.length) * 100}%` }}
            />
          </div>
          <div className="text-arena-300 text-[10px] mt-1 tracking-wider">
            {Math.round((unlocked / achievements.length) * 100)}% complete
          </div>
        </div>
      </div>

      {/* Unlocked */}
      <div className="mb-8">
        <div className="text-[10px] tracking-[0.25em] uppercase text-arena-200 mb-4">
          Unlocked
        </div>
        <div className="grid grid-cols-4 gap-4">
          {achievements
            .filter((a) => a.unlocked)
            .map((a) => (
              <div
                key={a.title}
                className="bg-arena-800 border border-gold/20 p-5 text-center"
              >
                <div className="text-3xl mb-3">{a.icon}</div>
                <div className="text-gold font-bold text-sm mb-1">
                  {a.title}
                </div>
                <div className="text-arena-200 text-[10px] leading-relaxed mb-3">
                  {a.description}
                </div>
                <div className="text-arena-400 text-[9px] tracking-wider">
                  Unlocked {a.date}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Locked */}
      <div>
        <div className="text-[10px] tracking-[0.25em] uppercase text-arena-200 mb-4">
          In Progress
        </div>
        <div className="grid grid-cols-4 gap-4">
          {achievements
            .filter((a) => !a.unlocked)
            .map((a) => (
              <div
                key={a.title}
                className="bg-arena-750 border border-white/[0.05] p-5 text-center"
              >
                <div className="text-3xl mb-3 grayscale opacity-40">
                  {a.icon}
                </div>
                <div className="text-arena-300 font-bold text-sm mb-1">
                  {a.title}
                </div>
                <div className="text-arena-400 text-[10px] leading-relaxed mb-3">
                  {a.description}
                </div>
                {a.progress !== undefined && a.max !== undefined && (
                  <>
                    <div className="h-1 bg-arena-600 mb-1.5">
                      <div
                        className="h-full bg-arena-300 transition-all"
                        style={{
                          width: `${Math.min((a.progress / a.max) * 100, 100)}%`,
                        }}
                      />
                    </div>
                    <div className="text-arena-400 text-[9px] tracking-wider">
                      {a.progress} / {a.max}
                    </div>
                  </>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
