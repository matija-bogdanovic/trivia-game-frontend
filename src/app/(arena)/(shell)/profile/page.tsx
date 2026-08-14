import { profileRecentMatches } from '@/app/(arena)/_mock/matches';
import {
  favoriteCategories,
  profileAchievementTease,
  profileIdentity,
  profileStats,
} from '@/app/(arena)/_mock/progress';

export default function Page() {
  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="bg-arena-800 border border-white/[0.07] p-8 flex items-center gap-8">
        <div className="w-24 h-24 bg-gold flex items-center justify-center text-arena-950 font-bold text-4xl flex-shrink-0">
          {profileIdentity.initial}
        </div>
        <div className="flex-1">
          <div className="text-arena-200 text-[10px] tracking-[0.25em] uppercase mb-1">
            Player Profile
          </div>
          <div className="text-white text-4xl font-bold tracking-wide mb-2">
            {profileIdentity.name}
          </div>
          <div className="flex items-center gap-6">
            <div>
              <div className="text-arena-300 text-[10px] tracking-widest uppercase">
                Current Streak
              </div>
              <div className="text-gold text-2xl font-bold">
                🔥 {profileIdentity.streak} WINS
              </div>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-arena-200 text-sm">
              {profileIdentity.memberSince}
            </div>
          </div>
        </div>
        <button className="border border-white/20 text-white text-[11px] tracking-[0.2em] uppercase px-5 py-3 hover:bg-arena-700 transition-colors">
          EDIT PROFILE
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-6 gap-3">
        {profileStats.map((s) => (
          <div
            key={s.label}
            className="bg-arena-800 border border-white/[0.07] p-4 text-center"
          >
            <div className="text-2xl font-bold text-gold mb-1">{s.value}</div>
            <div className="text-arena-300 text-[9px] tracking-[0.2em] uppercase leading-tight">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Category performance */}
        <div className="bg-arena-800 border border-white/[0.07] p-6">
          <div className="text-[10px] tracking-[0.25em] uppercase text-arena-200 mb-5">
            Category Performance
          </div>
          <div className="space-y-4">
            {favoriteCategories.map((cat) => (
              <div key={cat.name}>
                <div className="flex justify-between text-[11px] mb-1.5">
                  <span className="text-white">{cat.name}</span>
                  <span className="text-gold font-bold">{cat.pct}%</span>
                </div>
                <div className="h-1.5 bg-arena-700">
                  <div
                    className="h-full bg-gold"
                    style={{ width: `${cat.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent matches */}
        <div className="bg-arena-800 border border-white/[0.07] p-6">
          <div className="text-[10px] tracking-[0.25em] uppercase text-arena-200 mb-5">
            Recent Matches
          </div>
          <div className="space-y-3">
            {profileRecentMatches.map((m, i) => (
              <div
                key={i}
                className="flex items-center gap-3 py-3 border-b border-white/[0.05]"
              >
                <div
                  className={`w-2 h-8 flex-shrink-0 ${m.result === 'WIN' ? 'bg-gold' : 'bg-arena-400'}`}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-white text-xs font-bold truncate">
                    {m.opponent}
                  </div>
                  <div className="text-arena-300 text-[10px]">{m.date}</div>
                </div>
                <div
                  className={`font-bold text-sm ${m.result === 'WIN' ? 'text-gold' : 'text-arena-300'}`}
                >
                  {m.money}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Achievements row */}
      <div className="bg-arena-800 border border-white/[0.07] p-6">
        <div className="text-[10px] tracking-[0.25em] uppercase text-arena-200 mb-5">
          Achievements
        </div>
        <div className="flex gap-4">
          {profileAchievementTease.map((a) => (
            <div
              key={a.label}
              className={`flex flex-col items-center gap-2 p-4 border flex-1 text-center ${
                a.unlocked
                  ? 'border-gold/20 bg-gold/5'
                  : 'border-white/[0.04] opacity-40'
              }`}
            >
              <div className="text-2xl">{a.icon}</div>
              <div
                className={`text-[10px] tracking-wider ${a.unlocked ? 'text-gold' : 'text-arena-300'}`}
              >
                {a.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
