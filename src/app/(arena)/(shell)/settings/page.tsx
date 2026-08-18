'use client';

import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { setAvatarVersion } from '@/app/redux/slicers/avatar_slice';
import { setDisplayName } from '@/app/redux/slicers/profile_slice';
import type { AppDispatch, RootState } from '@/app/redux/store';
import { useEffect, useRef, useState } from 'react';
import { signOut, updateUserAttributes } from 'aws-amplify/auth';
import Avatar from '@/app/(arena)/_components/avatar';
import PageHeader from '@/app/(arena)/_components/page_header';
import ToggleSwitch from '@/app/(arena)/_components/toggle_switch';
import { difficultyOptions } from '@/app/(arena)/_mock/progress';
import { useWallet } from '@/app/(arena)/_data/use_wallet';
import { ErrorMessage, Field, Form, Formik } from 'formik';
import Button from '@/app/components/general/button';
import { apiFetch } from '@/app/helpers/api';
import { fileToDataUrl } from '@/app/helpers/avatar';
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
  const dispatch = useDispatch<AppDispatch>();
  const { t } = useT();
  const { identity, wallet, loading, signedIn } = useWallet();
  const storedName = useSelector((s: RootState) => s.profile.displayName);
  const showSignInPrompt = !loading && !signedIn;
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [defaultDifficulty, setDefaultDifficulty] = useState('Medium');
  const [notifications, setNotifications] = useState(true);
  const [profileVisible, setProfileVisible] = useState(true);
  const [friendRequests, setFriendRequests] = useState(true);
  const [roomInvites, setRoomInvites] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
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

  /**
   * The account fields show what Cognito and the wallet actually hold, rather
   * than a fixture. They seed once the session resolves and are not overwritten
   * afterwards, so typing is never clobbered by a late response.
   */
  useEffect(() => {
    if (loading) return;
    setSignedInAs(identity?.username ?? null);
    setUsername(
      (current) => current || storedName || identity?.displayName || ''
    );
    setEmail((current) => current || identity?.email || '');
    setCurrentAvatar(wallet?.avatar ?? null);
  }, [loading, identity, wallet, storedName]);

  useEffect(() => {
    return () => {
      if (savedTimer.current) clearTimeout(savedTimer.current);
    };
  }, []);

  /** Enough of an email to be worth submitting; the server decides the rest. */
  const emailValid = /^\S+@\S+\.\S+$/.test(email);
  const usernameValid = username.trim().length >= 3;
  const canSave = usernameValid && emailValid;

  /**
   * Save the display name.
   *
   * Two writes, because two things read it. The wallet is what every
   * server-sourced screen shows — leaderboard, friends, lobby, in-game — and
   * the Cognito `name` attribute is what survives into the next session's id
   * token, which is where the sidebar and profile header get it from on a
   * fresh load.
   *
   * Only surrounding whitespace is stripped. The casing is the whole point of
   * this screen, so nothing here normalises it, and the Cognito *username* is
   * untouched — that handle is immutable and case-insensitive by pool config.
   */
  const save = async () => {
    const name = username.trim();
    if (!canSave || saving || !name) return;
    setSaving(true);
    setSaveError('');
    setSaved(false);
    try {
      const res = await apiFetch('/wallet', { body: { displayName: name } });
      if (!res.ok) throw new Error('wallet');

      // the id token keeps the old name until it refreshes, so the store is
      // what updates the sidebar and profile header right now
      await updateUserAttributes({ userAttributes: { name } });
      dispatch(setDisplayName(name));

      setSaved(true);
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error('Saving the display name failed:', err);
      setSaveError(t('arena.settings.saveFailed'));
    } finally {
      setSaving(false);
    }
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
      // this is what makes the new picture appear everywhere at once — the
      // sidebar and any other render site read the version from the store
      if (signedInAs)
        dispatch(setAvatarVersion({ username: signedInAs, avatar }));
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
      <PageHeader
        eyebrow={t('arena.settings.eyebrow')}
        title={t('arena.settings.title')}
      />

      {/* ========================================================== account */}
      <section className="border border-white/[0.07] bg-arena-800">
        <div className="border-b border-white/[0.07] px-6 py-4">
          <h2 className="text-[11px] font-bold tracking-[0.25em] text-arena-200 uppercase">
            {t('arena.settings.account')}
          </h2>
        </div>
        <div className="space-y-4 p-6">
          {showSignInPrompt && (
            <p className="mb-4 text-[11px] text-arena-300">
              {t('arena.common.signInPrompt')}
            </p>
          )}
          <div>
            <Formik
              initialValues={{ username, email }}
              enableReinitialize
              validate={(values) => {
                const errors: { username?: string; email?: string } = {};
                if (!values.username || values.username.trim().length < 3) {
                  errors.username = t('arena.settings.usernameShort');
                }
                if (!values.email || !/^\S+@\S+\.\S+$/.test(values.email)) {
                  errors.email = t('arena.settings.emailInvalid');
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
                    {t('auth.username')}
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
                    {t('auth.email')}
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
              {t('arena.settings.profilePicture')}
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Avatar
                initial={(username || identity?.username || '?')
                  .charAt(0)
                  .toUpperCase()}
                username={signedInAs}
                avatar={currentAvatar}
                previewUrl={preview}
                alt={t('profile.avatar')}
                size="lg"
                accent
              />

              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                onChange={pickFile}
                className="sr-only"
                aria-label={t('profile.avatar')}
              />
              <Button
                text={t('arena.settings.changePhoto')}
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
              {t('arena.settings.password')}
            </div>
            <button
              type="button"
              className="cursor-pointer border border-white/20 px-4 py-2 text-[10px] tracking-[0.2em] text-white uppercase transition-colors hover:bg-arena-700 focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
            >
              {t('arena.settings.changePassword')}
            </button>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <button
              type="button"
              onClick={save}
              disabled={!canSave || saving}
              className={`px-6 py-3 text-[10px] font-bold tracking-[0.2em] uppercase transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none ${
                canSave
                  ? 'cursor-pointer bg-gold text-arena-950 hover:bg-gold-light'
                  : 'cursor-not-allowed bg-arena-700 text-arena-400'
              }`}
            >
              {saving ? t('arena.settings.saving') : t('arena.settings.save')}
            </button>
            <p className="text-[11px] text-gold" aria-live="polite">
              {saveError || (saved && t('arena.settings.saved'))}
            </p>
          </div>
        </div>
      </section>

      {/* ====================================================== preferences */}
      <section className="border border-white/[0.07] bg-arena-800">
        <div className="border-b border-white/[0.07] px-6 py-4">
          <h2 className="text-[11px] font-bold tracking-[0.25em] text-arena-200 uppercase">
            {t('arena.settings.preferences')}
          </h2>
        </div>
        <div className="space-y-4 p-6">
          <ToggleSwitch
            label={t('arena.settings.notifications')}
            description={t('arena.settings.notificationsDesc')}
            labelId="toggle-notifications"
            checked={notifications}
            onToggle={() => setNotifications((v) => !v)}
          />

          <div>
            <div
              className="mb-2 text-[10px] tracking-[0.2em] text-arena-300 uppercase"
              id="default-difficulty-label"
            >
              {t('arena.settings.defaultDifficulty')}
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
                  {t(`arena.difficulty.${difficulty}`)}
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
            {t('arena.settings.privacy')}
          </h2>
        </div>
        <div className="space-y-4 p-6">
          <ToggleSwitch
            label={t('arena.settings.publicProfile')}
            description={t('arena.settings.publicProfileDesc')}
            labelId="toggle-profile"
            checked={profileVisible}
            onToggle={() => setProfileVisible((v) => !v)}
          />
          <ToggleSwitch
            label={t('arena.settings.friendRequests')}
            description={t('arena.settings.friendRequestsDesc')}
            labelId="toggle-requests"
            checked={friendRequests}
            onToggle={() => setFriendRequests((v) => !v)}
          />
          <ToggleSwitch
            label={t('arena.settings.roomInvites')}
            description={t('arena.settings.roomInvitesDesc')}
            labelId="toggle-invites"
            checked={roomInvites}
            onToggle={() => setRoomInvites((v) => !v)}
          />
        </div>
      </section>

      {/* ===================================================== danger zone */}
      <section className="border border-red-500/40 bg-red-500/[0.04]">
        <div className="border-b border-red-500/30 px-6 py-4">
          <h2 className="text-[11px] font-bold tracking-[0.25em] text-red-400 uppercase">
            {t('arena.settings.dangerZone')}
          </h2>
          <p className="mt-1 text-[10px] text-arena-300">
            {t('arena.settings.dangerZoneNote')}
          </p>
        </div>
        <div className="space-y-3 p-6">
          {/*
            No handle beside the button. It printed the Cognito username next
            to Log Out — a google_1024… id on a federated account — which told
            the player nothing they wanted and showed them an internal
            identifier they never chose.
          */}
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full cursor-pointer border border-red-500/60 bg-red-500/10 px-4 py-3 text-[11px] font-bold tracking-[0.2em] text-red-400 uppercase transition-colors hover:bg-red-500/20 hover:text-red-300 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none"
          >
            {t('arena.settings.logOut')}
          </button>
          <button
            type="button"
            className="w-full cursor-pointer border border-red-500/60 bg-red-500/10 px-4 py-3 text-[11px] font-bold tracking-[0.2em] text-red-400 uppercase transition-colors hover:bg-red-500/20 hover:text-red-300 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none"
          >
            {t('arena.settings.deleteAccount')}
          </button>
          {/* it has never had a handler; styling it does not make it work */}
          <p className="text-[10px] tracking-wider text-arena-300">
            {t('arena.settings.deleteNotWired')}
          </p>
        </div>
      </section>
    </div>
  );
}
