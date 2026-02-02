import { io, Socket } from 'socket.io-client';

// Connect to the Heady Automation IDE server
// Ideally this URL comes from environment variables
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';

export const socket: Socket = io(SOCKET_URL, {
  path: '/socket.io',
  autoConnect: true,
  reconnection: true,
});
