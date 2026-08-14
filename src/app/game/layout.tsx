import GameProvider from '../components/hooks/game/context/game_context';

/**
 * The in-room experience: one socket, one route, phase-switched inside.
 * .arena-root puts it on the arena palette (see globals.css); the sidebar
 * shell is deliberately absent — a game takes the whole viewport.
 */
export default function GameLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <GameProvider>
      <div className="arena-root h-screen overflow-hidden">{children}</div>
    </GameProvider>
  );
}
