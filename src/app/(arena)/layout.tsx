/**
 * Everything under the (arena) group renders inside .arena-root, which is what
 * flips globals.css from the legacy light-on-forest-green theme to the arena
 * palette. The two nested groups split on chrome: (shell) gets the sidebar,
 * (fullscreen) does not.
 */
export default function ArenaLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="arena-root h-screen overflow-hidden">{children}</div>;
}
