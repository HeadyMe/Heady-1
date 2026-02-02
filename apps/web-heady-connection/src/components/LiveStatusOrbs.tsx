'use client';

import React, { useEffect, useState } from 'react';
import { BreathingOrb } from '@heady/ui';
import { socket } from '../lib/socket';

interface ServiceStatus {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  requestCount?: number;
  errorCount?: number;
}

export const LiveStatusOrbs = () => {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    function onConnect() {
      setConnected(true);
      socket.emit('subscribe:monitoring');
    }

    function onDisconnect() {
      setConnected(false);
    }

    function onMetrics(data: any) {
      if (data && data.services) {
        setServices(data.services);
      }
    }

    function onInitialServices(data: any) {
        if (data) {
            setServices(data);
        }
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('system:metrics', onMetrics);
    socket.on('initial:metrics', onMetrics);
    socket.on('initial:services', onInitialServices);

    if (socket.connected) {
      onConnect();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('system:metrics', onMetrics);
      socket.off('initial:metrics', onMetrics);
      socket.off('initial:services', onInitialServices);
    };
  }, []);

  // Map backend service names to display labels
  const getDisplayServices = () => {
    if (services.length === 0) {
        return [
            { service: 'Nexus', status: connected ? 'healthy' : 'unhealthy' },
            { service: 'Signal', status: 'healthy' }, // Placeholder
            { service: 'Flow', status: 'healthy' }    // Placeholder
        ];
    }
    return services;
  };

  const getColor = (name: string, status: string) => {
    if (status !== 'healthy' && status !== 'online') return '#f56565'; // Red for error
    if (name.toLowerCase().includes('ide')) return '#b794f4'; // Purple
    if (name.toLowerCase().includes('connection')) return '#f687b3'; // Pink
    return '#63b3ed'; // Blue
  };

  return (
    <div className="grid grid-cols-3 gap-12 mb-12">
      {getDisplayServices().map((s, i) => (
        <div key={s.service + i} className="flex flex-col items-center gap-4">
            <BreathingOrb 
            label="" 
            color={getColor(s.service, s.status)} 
            size={80}
            isActive={s.status === 'healthy' || s.status === 'online'} 
            />
            <div className="text-sm font-medium tracking-widest uppercase opacity-80">
                {s.service.replace('Heady', '').replace('Web', '')}
            </div>
        </div>
      ))}
    </div>
  );
};
