import { getPort } from '@/app/helpers/port';
import { decodeJwt, getCookie } from '@/app/helpers/token_operations';

export async function leaveRoom() {
  const port = getPort();

  const cookie = getCookie('token') as string;
  const decodedToken = decodeJwt(cookie);

  const data = await fetch(`${port}/getRoomCode`, {
    method: 'POST',
    headers: {
      'Content-type': 'application/json',
    },
    body: JSON.stringify({
      username: decodedToken.username,
    }),
  });
  const res = await data.json();
  const roomCode = res.code;
  try {
    const token = getCookie('token') as string;

    if (!token) {
      console.log('No token found, user already logged out');
      return;
    }

    const parsedToken = decodeJwt(token);

    if (!parsedToken || !parsedToken.username) {
      console.log('Invalid token or no username');
      return;
    }

    const blob = new Blob(
      [
        JSON.stringify({
          code: roomCode,
          username: parsedToken.username,
        }),
      ],
      {
        type: 'application/json',
      }
    );

    if (navigator.sendBeacon) {
      const success = navigator.sendBeacon(`${port}/leaveRoom`, blob);
      if (!success) {
        console.warn('sendBeacon failed, falling back to fetch.');
        await fetch(`${port}/leaveRoom`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: roomCode,
            username: parsedToken.username,
          }),
          keepalive: true,
        });
      }
    } else {
      await fetch(`${port}/leaveRoom`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: roomCode,
          username: parsedToken.username,
        }),
        keepalive: true,
      });
    }
  } catch (error) {
    console.error('Error leaving room:', error);
  }
}
