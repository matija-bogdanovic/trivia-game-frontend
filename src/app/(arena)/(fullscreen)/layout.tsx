/**
 * Arena screens that take the whole viewport with no sidebar — the live game
 * hides the shell so nothing competes with the question timer.
 */
export default function FullscreenLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="h-full bg-g900 overflow-y-auto">{children}</div>;
}
