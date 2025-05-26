export function getPort(): string {
  const protocol = window.location.protocol === "https:" ? "https" : "http";
  const host =
    window.location.host === "localhost:3001"
      ? "localhost:3000"
      : "whoisfaster.onrender.com";

  return `${protocol}://${host}`;
}

export function getWebSocketPort(): string {
  return window.location.protocol === "https:" ? "wss" : "ws";
}
