'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { signOut } from 'aws-amplify/auth';
import Avatar from '@/app/(arena)/_components/avatar';
import PageHeader from '@/app/(arena)/_components/page_header';
import ToggleSwitch from '@/app/(arena)/_components/toggle_switch';
import { ME, difficultyOptions } from '@/app/(arena)/_mock/progress';
import { getIdentity } from '@/app/helpers/token_operations';

/**
 * Account and preference toggles.
 *
 * The export bound the username and email inputs but wired "Save changes" to
 * nothing, and rendered the default-difficulty buttons with no state at all —
 * clicking one did nothing and none ever looked selected. Both work here, and
 * both fields validate, as in the Angular app.
 */
export default function Page() {
  const router = useRouter();
  const [username, setUsername] = useState(ME.name);
  const [email, setEmail] = useState(ME.email);
  const [defaultDifficulty, setDefaultDifficulty] = useState('Medium');
  const [notifications, setNotifications] = useState(true);
  const [profileVisible, setProfileVisible] = useState(true);
  const [friendRequests, setFriendRequests] = useState(true);
  const [roomInvites, setRoomInvites] = useState(true);
  const [saved, setSaved] = useState(false);
  const [signedInAs, setSignedInAs] = useState<string | null>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    getIdentity().then((id) => setSignedInAs(id?.username ?? null));
    return () => {
      if (savedTimer.current) clearTimeout(savedTimer.current);
    };
  }, []);

  /** Enough of an email to be worth submitting; the server decides the rest. */
  const emailValid = /^\S+@\S+\.\S+$/.test(email);
  const usernameValid = username.trim().length >= 3;
  const canSave = usernameValid && emailValid;

  const save = () => {
    if (!canSave) return;
    setSaved(true);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSaved(false), 2500);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } finally {
      router.push('/login');
    }
  };

  return (
    <div className="max-w-2xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader eyebrow="Configuration" title="SETTINGS" />

      {/* ========================================================== account */}
      <section className="border border-white/[0.07] bg-arena-800">
        <div className="border-b border-white/[0.07] px-6 py-4">
          <h2 className="text-[11px] font-bold tracking-[0.25em] text-arena-200 uppercase">
            Account
          </h2>
        </div>
        <div className="space-y-4 p-6">
          <div>
            <label
              htmlFor="username"
              className="mb-2 block text-[10px] tracking-[0.2em] text-arena-300 uppercase"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setSaved(false);
              }}
              aria-invalid={!usernameValid}
              className="w-full border border-white/10 bg-arena-750 px-4 py-3 text-sm text-white outline-none focus:border-gold/40"
            />
            {!usernameValid && (
              <p className="mt-1.5 text-[11px] text-gold">
                Usernames need at least three characters.
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-[10px] tracking-[0.2em] text-arena-300 uppercase"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setSaved(false);
              }}
              aria-invalid={!emailValid}
              className="w-full border border-white/10 bg-arena-750 px-4 py-3 text-sm text-white outline-none focus:border-gold/40"
            />
            {!emailValid && (
              <p className="mt-1.5 text-[11px] text-gold">
                That doesn&apos;t look like an email.
              </p>
            )}
          </div>

          <div>
            <div className="mb-2 text-[10px] tracking-[0.2em] text-arena-300 uppercase">
              Profile Picture
            </div>
            <div className="flex items-center gap-4">
              <Avatar initial={ME.initial} size="lg" accent />
              <button
                type="button"
                className="cursor-pointer border border-white/20 px-4 py-2 text-[10px] tracking-[0.2em] text-white uppercase transition-colors hover:bg-arena-700 focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
              >
                Change photo
              </button>
            </div>
          </div>

          <div>
            <div className="mb-2 text-[10px] tracking-[0.2em] text-arena-300 uppercase">
              Password
            </div>
            <button
              type="button"
              className="cursor-pointer border border-white/20 px-4 py-2 text-[10px] tracking-[0.2em] text-white uppercase transition-colors hover:bg-arena-700 focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
            >
              Change password
            </button>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <button
              type="button"
              onClick={save}
              disabled={!canSave}
              className={`px-6 py-3 text-[10px] font-bold tracking-[0.2em] uppercase transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none ${
                canSave
                  ? 'cursor-pointer bg-gold text-arena-950 hover:bg-gold-light'
                  : 'cursor-not-allowed bg-arena-700 text-arena-400'
              }`}
            >
              Save changes
            </button>
            <p className="text-[11px] text-gold" aria-live="polite">
              {saved && '✓ Saved'}
            </p>
          </div>
        </div>
      </section>

      {/* ====================================================== preferences */}
      <section className="border border-white/[0.07] bg-arena-800">
        <div className="border-b border-white/[0.07] px-6 py-4">
          <h2 className="text-[11px] font-bold tracking-[0.25em] text-arena-200 uppercase">
            Game Preferences
          </h2>
        </div>
        <div className="space-y-4 p-6">
          <ToggleSwitch
            label="Game Notifications"
            description="Get notified when friends start games or invite you"
            labelId="toggle-notifications"
            checked={notifications}
            onToggle={() => setNotifications((v) => !v)}
          />

          <div>
            <div
              className="mb-2 text-[10px] tracking-[0.2em] text-arena-300 uppercase"
              id="default-difficulty-label"
            >
              Default Difficulty
            </div>
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-labelledby="default-difficulty-label"
            >
              {difficultyOptions.map((difficulty) => (
                <button
                  key={difficulty}
                  type="button"
                  onClick={() => setDefaultDifficulty(difficulty)}
                  aria-pressed={defaultDifficulty === difficulty}
                  className={`cursor-pointer border px-4 py-2 text-[10px] tracking-wider uppercase transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none ${
                    defaultDifficulty === difficulty
                      ? 'border-arena-300 bg-arena-600 font-bold text-white'
                      : 'border-white/10 text-arena-200 hover:border-arena-300 hover:text-white'
                  }`}
                >
                  {difficulty}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================== privacy */}
      <section className="border border-white/[0.07] bg-arena-800">
        <div className="border-b border-white/[0.07] px-6 py-4">
          <h2 className="text-[11px] font-bold tracking-[0.25em] text-arena-200 uppercase">
            Privacy
          </h2>
        </div>
        <div className="space-y-4 p-6">
          <ToggleSwitch
            label="Public Profile"
            description="Allow other players to view your profile and stats"
            labelId="toggle-profile"
            checked={profileVisible}
            onToggle={() => setProfileVisible((v) => !v)}
          />
          <ToggleSwitch
            label="Friend Requests"
            description="Allow others to send you friend requests"
            labelId="toggle-requests"
            checked={friendRequests}
            onToggle={() => setFriendRequests((v) => !v)}
          />
          <ToggleSwitch
            label="Room Invitations"
            description="Allow friends to invite you to their rooms"
            labelId="toggle-invites"
            checked={roomInvites}
            onToggle={() => setRoomInvites((v) => !v)}
          />
        </div>
      </section>

      {/* =================================================== account mgmt */}
      <section className="border border-white/[0.07] bg-arena-800">
        <div className="border-b border-white/[0.07] px-6 py-4">
          <h2 className="text-[11px] font-bold tracking-[0.25em] text-arena-200 uppercase">
            Account Management
          </h2>
        </div>
        <div className="space-y-3 p-6">
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full cursor-pointer border border-white/20 px-4 py-3 text-left text-[11px] tracking-[0.2em] text-white uppercase transition-colors hover:bg-arena-700 focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
          >
            Log out
            {signedInAs && (
              <span className="ml-2 text-arena-300 normal-case">
                ({signedInAs})
              </span>
            )}
          </button>
          <button
            type="button"
            className="w-full cursor-pointer border border-arena-500/40 px-4 py-3 text-left text-[11px] tracking-[0.2em] text-arena-300 uppercase transition-colors hover:border-arena-300 hover:text-white focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
          >
            Delete account
          </button>
        </div>
      </section>
    </div>
  );
}
