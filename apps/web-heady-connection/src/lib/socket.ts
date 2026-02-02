import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';

export const socket: Socket = io(SOCKET_URL, {
  path: '/socket.io',
  autoConnect: true,
  reconnection: true,
});
