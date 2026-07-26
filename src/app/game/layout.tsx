import GameProvider from '../components/hooks/game/context/game_context';

export default function GameLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <GameProvider>{children}</GameProvider>;
}
