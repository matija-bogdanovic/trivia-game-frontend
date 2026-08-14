'use client';

import { useState } from 'react';

/**
 * NOTE: every control here is local state only — nothing saves, and the
 * account fields are seeded with the mock identity rather than the signed-in
 * one. Log out and Delete account are inert. See the P3 report.
 */
export default function Page() {
  const [username, setUsername] = useState('AlphaWolf');
  const [email, setEmail] = useState('alphawolf@example.com');
  const [profileVisible, setProfileVisible] = useState(true);
  const [friendRequests, setFriendRequests] = useState(true);
  const [roomInvites, setRoomInvites] = useState(true);
  const [notifications, setNotifications] = useState(true);

  return (
    <div className="p-8 max-w-2xl space-y-6">
      <div>
        <div className="text-arena-200 text-[10px] tracking-[0.25em] uppercase mb-1">
          Configuration
        </div>
        <h1 className="text-3xl font-bold tracking-wide">SETTINGS</h1>
      </div>

      {/* Account */}
      <Section label="Account">
        <div className="space-y-4">
          <Field label="Username">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-arena-750 border border-white/10 text-white text-sm px-4 py-3 outline-none focus:border-gold/40"
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-arena-750 border border-white/10 text-white text-sm px-4 py-3 outline-none focus:border-gold/40"
            />
          </Field>
          <Field label="Profile Picture">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gold text-arena-950 flex items-center justify-center font-bold text-2xl">
                A
              </div>
              <button className="border border-white/20 text-white text-[10px] tracking-[0.2em] uppercase px-4 py-2 hover:bg-arena-700 transition-colors">
                CHANGE PHOTO
              </button>
            </div>
          </Field>
          <Field label="Password">
            <button className="border border-white/20 text-white text-[10px] tracking-[0.2em] uppercase px-4 py-2 hover:bg-arena-700 transition-colors">
              CHANGE PASSWORD
            </button>
          </Field>
          <div className="pt-2">
            <button className="bg-gold text-arena-950 font-bold text-[10px] tracking-[0.2em] uppercase px-6 py-3 hover:bg-gold-light transition-colors">
              SAVE CHANGES
            </button>
          </div>
        </div>
      </Section>

      {/* Game */}
      <Section label="Game Preferences">
        <div className="space-y-4">
          <Toggle
            label="Game Notifications"
            sublabel="Get notified when friends start games or invite you"
            value={notifications}
            onChange={setNotifications}
          />
          <Field label="Default Difficulty">
            <div className="flex gap-2">
              {['Easy', 'Medium', 'Hard', 'Mixed'].map((d) => (
                <button
                  key={d}
                  className="px-4 py-2 text-[10px] tracking-wider uppercase border border-white/10 text-arena-200 hover:border-arena-300 hover:text-white transition-colors"
                >
                  {d}
                </button>
              ))}
            </div>
          </Field>
        </div>
      </Section>

      {/* Privacy */}
      <Section label="Privacy">
        <div className="space-y-4">
          <Toggle
            label="Public Profile"
            sublabel="Allow other players to view your profile and stats"
            value={profileVisible}
            onChange={setProfileVisible}
          />
          <Toggle
            label="Friend Requests"
            sublabel="Allow others to send you friend requests"
            value={friendRequests}
            onChange={setFriendRequests}
          />
          <Toggle
            label="Room Invitations"
            sublabel="Allow friends to invite you to their rooms"
            value={roomInvites}
            onChange={setRoomInvites}
          />
        </div>
      </Section>

      {/* Danger zone */}
      <Section label="Account Management">
        <div className="space-y-3">
          <button className="w-full border border-white/20 text-white text-[11px] tracking-[0.2em] uppercase py-3 hover:bg-arena-700 transition-colors text-left px-4">
            LOG OUT
          </button>
          <button className="w-full border border-arena-500/40 text-arena-300 text-[11px] tracking-[0.2em] uppercase py-3 hover:border-arena-300 hover:text-white transition-colors text-left px-4">
            DELETE ACCOUNT
          </button>
        </div>
      </Section>
    </div>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-arena-800 border border-white/[0.07]">
      <div className="px-6 py-4 border-b border-white/[0.07]">
        <div className="text-[11px] tracking-[0.25em] uppercase font-bold text-arena-200">
          {label}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-arena-300 text-[10px] tracking-[0.2em] uppercase mb-2">
        {label}
      </div>
      {children}
    </div>
  );
}

function Toggle({
  label,
  sublabel,
  value,
  onChange,
}: {
  label: string;
  sublabel: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <div>
        <div className="text-white text-sm">{label}</div>
        <div className="text-arena-300 text-[11px] mt-0.5">{sublabel}</div>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-10 h-6 transition-colors flex-shrink-0 ${value ? 'bg-gold' : 'bg-arena-600'}`}
      >
        <div
          className={`absolute top-1 w-4 h-4 bg-white transition-transform ${
            value ? 'translate-x-5' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}
