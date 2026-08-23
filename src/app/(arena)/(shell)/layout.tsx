import InviteBanner from '../_components/invite_banner';
import PresenceProvider from '../_components/presence_provider';
import ReconnectBanner from '../_components/reconnect_banner';
import UnreadIndicator from '../_components/unread_indicator';
import Sidebar from '../_components/sidebar';

/**
 * Translated from the Angular app's Shell. Column on small screens so the nav
 * sits as a top bar above the content, row from lg up so it becomes the
 * sidebar. h-dvh rather than h-screen: on mobile browsers the dynamic
 * viewport unit accounts for the collapsing URL bar.
 */
export default function ShellLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    /*
      PresenceProvider wraps the shell so every signed-in screen holds a
      socket. Until it existed, a player outside /game had no connection at
      all — nothing could be pushed to them, and friendsList had no row to
      read, which is why "online" was a status almost nobody ever wore.
    */
    <PresenceProvider>
      <div className="flex h-dvh flex-col overflow-hidden bg-arena-900 text-white lg:flex-row">
        <Sidebar />
        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
        <ReconnectBanner />
        <InviteBanner />
        <UnreadIndicator />
      </div>
    </PresenceProvider>
  );
}
