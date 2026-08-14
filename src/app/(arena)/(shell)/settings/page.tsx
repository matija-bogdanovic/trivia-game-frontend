'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { signOut } from 'aws-amplify/auth';
import Avatar from '@/app/(arena)/_components/avatar';
import PageHeader from '@/app/(arena)/_components/page_header';
import ToggleSwitch from '@/app/(arena)/_components/toggle_switch';
import { ME, difficultyOptions } from '@/app/(arena)/_mock/progress';
import { getIdentity } from '@/app/helpers/token_operations';
import { ErrorMessage, Field, Form, Formik } from 'formik';
import Button from '@/app/components/general/button';
import { apiFetch } from '@/app/helpers/api';
import { decodeAvatar, fileToDataUrl } from '@/app/helpers/avatar';
import { getPort } from '@/app/helpers/port';
import { useT } from '@/app/lib/i18n';
import AvatarCropper from '@/app/components/ui/avatar_cropper';

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
  const { t } = useT();
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
  const fileInput = useRef<HTMLInputElement>(null);
  /** the picked file, waiting to be cropped */
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  /** the cropped square, not uploaded yet */
  const [preview, setPreview] = useState<string | null>(null);
  /** what the server currently has, as the wallet's avatar string */
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [avatarError, setAvatarError] = useState('');

  useEffect(() => {
    getIdentity().then((id) => setSignedInAs(id?.username ?? null));
    // the wallet holds the avatar the server already has
    apiFetch('/wallet')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setCurrentAvatar(data?.avatar ?? null))
      .catch(() => {});
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

  const pickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // let the same file be picked again after a cancel
    e.target.value = '';
    if (!file) return;
    setAvatarError('');
    try {
      setCropSrc(await fileToDataUrl(file));
    } catch {
      setAvatarError(t('profile.badImage'));
    }
  };

  const uploadAvatar = async () => {
    if (!preview || uploading) return;
    setUploading(true);
    setAvatarError('');
    try {
      const res = await apiFetch('/avatar', { body: { image: preview } });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message ?? 'upload failed');
      }
      const { avatar } = await res.json();
      setCurrentAvatar(avatar);
      setPreview(null);
    } catch (err) {
      console.error('Avatar upload failed:', err);
      const detail =
        err instanceof Error && err.message ? ` (${err.message})` : '';
      setAvatarError(`${t('profile.uploadFailed')}${detail}`);
    } finally {
      setUploading(false);
    }
  };

  /** what the tile shows: the pending crop, else the saved avatar, else initials */
  const savedAvatar = decodeAvatar(currentAvatar);
  const savedAvatarUrl =
    savedAvatar?.kind === 'upload' && signedInAs
      ? `${getPort()}/avatar/img/${encodeURIComponent(signedInAs)}?v=${savedAvatar.version}`
      : null;

  const handleSignOut = async () => {
    try {
      await signOut();
    } finally {
      router.push('/login');
    }
  };

  return (
    <div className="max-w-2xl space-y-6 p-4 sm:p-6 lg:p-8 ">
      {cropSrc && (
        <AvatarCropper
          imageSrc={cropSrc}
          onDone={(cropped) => {
            setPreview(cropped);
            setCropSrc(null);
          }}
          onCancel={() => setCropSrc(null)}
        />
      )}
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
            <Formik
              initialValues={{ username: ME.name, email: ME.email }}
              validate={(values) => {
                const errors: { username?: string; email?: string } = {};
                if (!values.username || values.username.trim().length < 3) {
                  errors.username = 'Usernames need at least three characters.';
                }
                if (!values.email || !/^\S+@\S+\.\S+$/.test(values.email)) {
                  errors.email = "That doesn't look like an email.";
                }

                return errors;
              }}
              onSubmit={() => {}}
            >
              {({ handleChange, handleBlur, values, errors }) => (
                <Form>
                  <label
                    htmlFor="username"
                    className="mb-2 block text-[10px] tracking-[0.2em] text-arena-300 uppercase"
                  >
                    Username
                  </label>
                  <Field
                    id="username"
                    type="text"
                    value={values.username}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      handleChange(e);
                      setUsername(e.target.value);
                      setSaved(false);
                    }}
                    onBlur={handleBlur}
                    aria-invalid={!!errors.username}
                    className="w-full border border-white/10 bg-arena-750 px-4 py-3 text-sm text-white outline-none focus:border-gold/40"
                  />
                  <ErrorMessage name="username" component="div" />
                  <label
                    htmlFor="email"
                    className="mb-2 block text-[10px] tracking-[0.2em] text-arena-300 uppercase"
                  >
                    Email
                  </label>
                  <Field
                    id="email"
                    type="email"
                    value={values.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      handleChange(e);
                      setEmail(e.target.value);
                      setSaved(false);
                    }}
                    onBlur={handleBlur}
                    aria-invalid={!!errors.email}
                    className="w-full border border-white/10 bg-arena-750 px-4 py-3 text-sm text-white outline-none focus:border-gold/40"
                  />
                  <ErrorMessage name="email" component="div" />
                </Form>
              )}
            </Formik>
          </div>
          <div>
            <div className="mb-2 text-[10px] tracking-[0.2em] text-arena-300 uppercase">
              Profile Picture
            </div>
            <div className="flex flex-wrap items-center gap-4">
              {preview || savedAvatarUrl ? (
                // the backend serves these; next/image would need the host
                // allow-listed, and a data: URL cannot be optimised at all
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview ?? savedAvatarUrl ?? ''}
                  alt={t('profile.avatar')}
                  className="h-12 w-12 shrink-0 object-cover"
                />
              ) : (
                <Avatar initial={ME.initial} size="lg" accent />
              )}

              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                onChange={pickFile}
                className="sr-only"
                aria-label={t('profile.avatar')}
              />
              <Button
                text={'Change photo'}
                version="secondary"
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.preventDefault();
                  fileInput.current?.click();
                }}
              />

              {preview && (
                <>
                  <button
                    type="button"
                    onClick={uploadAvatar}
                    disabled={uploading}
                    className={`px-4 py-2 text-[10px] font-bold tracking-[0.2em] uppercase transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none ${
                      uploading
                        ? 'cursor-not-allowed bg-arena-700 text-arena-400'
                        : 'cursor-pointer bg-gold text-arena-950 hover:bg-gold-light'
                    }`}
                  >
                    {uploading ? '…' : t('profile.apply')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreview(null)}
                    disabled={uploading}
                    className="cursor-pointer border border-arena-400 px-4 py-2 text-[10px] tracking-[0.2em] text-arena-300 uppercase transition-colors hover:border-arena-300 hover:text-white focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none disabled:opacity-50"
                  >
                    {t('profile.cancel')}
                  </button>
                </>
              )}
            </div>
            {avatarError && (
              <p className="mt-2 text-[11px] text-gold" role="alert">
                {avatarError}
              </p>
            )}
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
