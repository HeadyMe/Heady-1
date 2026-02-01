import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Alert as RNAlert } from 'react-native'; // Rename to avoid conflict
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SystemMetrics, ServiceStatus, Alert, Task } from '../types';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  lastMessage: any;
  sendMessage: (event: string, data: any) => void;
  connect: () => void;
  disconnect: () => void;
  serverUrl: string;
  setServerUrl: (url: string) => void;
  
  // Data state
  metrics: SystemMetrics | null;
  services: ServiceStatus[];
  alerts: Alert[];
  tasks: Task[];
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  lastMessage: null,
  sendMessage: () => {},
  connect: () => {},
  disconnect: () => {},
  serverUrl: '',
  setServerUrl: () => {},
  metrics: null,
  services: [],
  alerts: [],
  tasks: [],
});

export const useSocket = () => useContext(SocketContext);

interface SocketProviderProps {
  children: React.ReactNode;
  initialUrl?: string; 
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children, initialUrl }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const [serverUrl, setServerUrlState] = useState(initialUrl || 'http://10.0.2.2:4100');

  // Data state
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    // Load saved URL on startup
    AsyncStorage.getItem('server_url').then((saved) => {
        if (saved) setServerUrlState(saved);
    });
  }, []);

  const setServerUrl = async (url: string) => {
      setServerUrlState(url);
      await AsyncStorage.setItem('server_url', url);
  };

  useEffect(() => {
    if (!serverUrl) return;

    const newSocket = io(serverUrl, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
      
      // Subscribe to channels
      newSocket.emit('subscribe:monitoring');
      newSocket.emit('subscribe:alerts');
      newSocket.emit('subscribe:tasks');
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      console.log('Socket connection error:', err);
    });

    // --- Data Handlers ---

    // Initial State
    newSocket.on('initial:metrics', (data: SystemMetrics) => setMetrics(data));
    newSocket.on('initial:services', (data: ServiceStatus[]) => setServices(data));
    newSocket.on('initial:alerts', (data: Alert[]) => setAlerts(data));
    newSocket.on('initial:tasks', (data: Task[]) => setTasks(data));

    // Real-time Updates
    newSocket.on('system:metrics', (data: SystemMetrics) => {
        setMetrics(data);
        setLastMessage(data); // Keep for debug/raw view
    });

    newSocket.on('service:health', (data: ServiceStatus) => {
        setServices(prev => {
            const index = prev.findIndex(s => s.name === data.name);
            if (index >= 0) {
                const newServices = [...prev];
                newServices[index] = data;
                return newServices;
            }
            return [...prev, data];
        });
    });

    newSocket.on('alert:created', (data: Alert) => {
        setAlerts(prev => [data, ...prev]);
        // Optional: Trigger local notification here
    });

    newSocket.on('alert:resolved', (data: Alert) => {
        setAlerts(prev => prev.map(a => a.id === data.id ? data : a));
    });

    // --- Task Updates ---
    
    newSocket.on('task:created', (newTask: Task) => {
        setTasks(prev => [newTask, ...prev]);
    });

    newSocket.on('task:status', (data: { taskId: string, status: string, execution: any, result?: any, error?: any }) => {
        setTasks(prev => prev.map(t => {
            if (t.id === data.taskId) {
                return {
                    ...t,
                    status: data.status,
                    executionTime: data.execution.executionTime, // Assuming execution contains this if completed
                    // Merge other updates if necessary
                };
            }
            return t;
        }));
    });

    newSocket.on('task:progress', (data: { taskId: string, progress: number, message?: string }) => {
        setTasks(prev => prev.map(t => {
            if (t.id === data.taskId) {
                return {
                    ...t,
                    progress: data.progress
                };
            }
            return t;
        }));
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [serverUrl]);

  const sendMessage = (event: string, data: any) => {
    if (socket && isConnected) {
      socket.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot send message');
    }
  };

  const connect = () => {
    if (socket && !socket.connected) {
      socket.connect();
    }
  };

  const disconnect = () => {
    if (socket && socket.connected) {
      socket.disconnect();
    }
  };

  return (
    <SocketContext.Provider value={{ 
        socket, 
        isConnected, 
        lastMessage, 
        sendMessage, 
        connect, 
        disconnect, 
        serverUrl, 
        setServerUrl,
        metrics,
        services,
        alerts,
        tasks
    }}>
      {children}
    </SocketContext.Provider>
  );
};
