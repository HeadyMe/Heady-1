import { io, Socket } from 'socket.io-client';

export const socket: Socket = io('/', {
  path: '/socket.io',
  autoConnect: true,
  reconnection: true,
});
