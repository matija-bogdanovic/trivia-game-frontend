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
    <div className="flex h-dvh flex-col overflow-hidden bg-arena-900 text-white lg:flex-row">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
