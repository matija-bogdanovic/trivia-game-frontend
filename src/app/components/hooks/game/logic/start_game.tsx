import { StartGame } from '@/app/helpers/types';

export async function startGame({ sendJsonMessage }: StartGame) {
  const code = window.location.pathname.split('/')[2];
  sendJsonMessage({
    message: 'game_start',
    code: code,
  });
}
