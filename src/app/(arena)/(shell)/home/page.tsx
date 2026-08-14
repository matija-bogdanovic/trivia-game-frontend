import Link from 'next/link';
import { homeRecentMatches } from '@/app/(arena)/_mock/matches';
import { onlineFriends } from '@/app/(arena)/_mock/players';
import { homeAchievementTease, homeStats } from '@/app/(arena)/_mock/progress';

export default function Page() {
  return (
    <div className="p-8 space-y-8">
      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4">
        {homeStats.map((stat) => (
          <div
            key={stat.label}
            className="bg-g800 border border-white/[0.07] p-5"
          >
            <div className="text-g200 text-[10px] tracking-[0.2em] uppercase mb-2">
              {stat.label}
            </div>
            <div
              className={`text-3xl font-bold ${stat.accent ? 'text-gold' : 'text-white'}`}
            >
              {stat.value} {stat.suffix}
            </div>
          </div>
        ))}
      </div>

      {/* Hero CTA */}
      <div
        className="relative bg-g800 border border-white/[0.07] p-10 overflow-hidden"
        style={{
          background:
            'linear-gradient(135deg, #0c1c0d 0%, #122513 60%, #162a18 100%)',
        }}
      >
        <div className="absolute right-0 top-0 bottom-0 w-64 flex items-center justify-center opacity-5 pointer-events-none">
          <div className="text-[200px] leading-none font-bold text-gold">?</div>
        </div>
        <div className="relative">
          <div className="text-g200 text-xs tracking-[0.3em] uppercase mb-3">
            Ready to compete?
          </div>
          <h1 className="text-5xl font-bold text-white mb-2 tracking-wide">
            TRIVIA DEATHMATCH
          </h1>
          <p className="text-g200 text-sm mb-8 max-w-md leading-relaxed">
            Bet your in-game money on every answer. Outsmart your opponents. Win
            the table.
          </p>
          <div className="flex gap-4">
            <Link
              href="/live-game"
              className="bg-gold text-g950 font-bold text-sm tracking-[0.2em] uppercase px-10 py-4 hover:bg-gold-light transition-colors"
            >
              ▶ PLAY NOW
            </Link>
            <Link
              href="/rooms/create"
              className="border border-white/20 text-white font-bold text-sm tracking-[0.2em] uppercase px-8 py-4 hover:bg-g700 transition-colors"
            >
              CREATE ROOM
            </Link>
            <Link
              href="/rooms/join"
              className="border border-white/20 text-white font-bold text-sm tracking-[0.15em] uppercase px-8 py-4 hover:bg-g700 transition-colors"
            >
              JOIN ROOM
            </Link>
          </div>
        </div>
      </div>

      {/* Content columns */}
      <div className="grid grid-cols-5 gap-6">
        {/* Recent matches */}
        <div className="col-span-3 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-[11px] tracking-[0.25em] uppercase text-g200">
              Recent Matches
            </h2>
            <Link
              href="/history"
              className="text-gold text-[10px] tracking-wider uppercase hover:text-gold-light"
            >
              View All →
            </Link>
          </div>
          {homeRecentMatches.map((match) => (
            <div
              key={match.id}
              className="bg-g800 border border-white/[0.07] p-4 flex items-center gap-4 hover:bg-g700 transition-colors cursor-pointer"
            >
              <div
                className={`w-2 h-12 flex-shrink-0 ${match.result === 'WIN' ? 'bg-gold' : 'bg-g400'}`}
              />
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm font-bold mb-0.5">
                  {match.players.join(' · ')}
                </div>
                <div className="text-g200 text-[10px] tracking-wider uppercase">
                  {match.category} · {match.date}
                </div>
              </div>
              <div className="text-right">
                <div
                  className={`font-bold text-sm ${match.result === 'WIN' ? 'text-gold' : 'text-g300'}`}
                >
                  {match.money}
                </div>
                <div className="text-g200 text-[10px] tracking-wider">
                  #{match.placement}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Online friends */}
        <div className="col-span-2 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-[11px] tracking-[0.25em] uppercase text-g200">
              Friends Online
            </h2>
            <Link
              href="/friends"
              className="text-gold text-[10px] tracking-wider uppercase hover:text-gold-light"
            >
              All →
            </Link>
          </div>
          {onlineFriends.map((friend) => (
            <div
              key={friend.name}
              className="bg-g800 border border-white/[0.07] p-3 flex items-center gap-3"
            >
              <div className="relative">
                <div className="w-9 h-9 bg-g600 flex items-center justify-center text-white font-bold text-sm">
                  {friend.name[0]}
                </div>
                <div
                  className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 border-2 border-g800 rounded-full ${friend.status === 'In Game' ? 'bg-gold' : 'bg-g300'}`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white text-xs font-bold truncate">
                  {friend.name}
                </div>
                <div className="text-g200 text-[10px]">{friend.status}</div>
              </div>
              {friend.streak > 0 && (
                <div className="text-gold text-[10px] font-bold">
                  🔥 {friend.streak}
                </div>
              )}
              <button className="text-[10px] tracking-wider text-g200 border border-g400 px-2 py-1 hover:text-white hover:border-g300 transition-colors uppercase">
                Invite
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Achievement tease */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[11px] tracking-[0.25em] uppercase text-g200">
            Recent Achievements
          </h2>
          <Link
            href="/achievements"
            className="text-gold text-[10px] tracking-wider uppercase hover:text-gold-light"
          >
            View All →
          </Link>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {homeAchievementTease.map((a) => (
            <div
              key={a.title}
              className={`p-4 border text-center ${a.unlocked ? 'bg-g800 border-gold/20' : 'bg-g750 border-white/[0.05] opacity-50'}`}
            >
              <div className={`text-2xl mb-2 ${a.unlocked ? '' : 'grayscale'}`}>
                {a.icon}
              </div>
              <div
                className={`text-xs font-bold mb-1 ${a.unlocked ? 'text-gold' : 'text-g200'}`}
              >
                {a.title}
              </div>
              <div className="text-g200 text-[10px] leading-tight">
                {a.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
