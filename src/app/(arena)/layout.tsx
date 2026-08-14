/**
 * Everything under the (arena) group renders inside .arena-root, which is what
 * flips globals.css from the legacy light-on-forest-green theme to the arena
 * palette. The two nested groups split on chrome: (shell) gets the sidebar,
 * (fullscreen) does not.
 */
export default function ArenaLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // height is the shell's job now — it uses h-dvh so the mobile URL bar
  // collapsing does not leave a dead strip at the bottom
  return <div className="arena-root">{children}</div>;
}
