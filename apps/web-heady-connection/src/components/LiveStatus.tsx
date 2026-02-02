'use client';

import React, { useEffect, useState } from 'react';
import { socket } from '../lib/socket';

export function LiveStatus() {
  const [connected, setConnected] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    function onConnect() {
      setConnected(true);
      socket.emit('subscribe:monitoring');
    }

    function onDisconnect() {
      setConnected(false);
    }

    function onMetrics(data: any) {
      setMetrics(data);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('system:metrics', onMetrics);
    socket.on('initial:metrics', onMetrics);

    // Initial check
    if (socket.connected) {
      onConnect();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('system:metrics', onMetrics);
      socket.off('initial:metrics', onMetrics);
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 pointer-events-none z-50">
      {/* Connection Status */}
      <div className={`
        flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md border shadow-lg transition-all duration-500
        ${connected 
          ? 'bg-emerald-900/20 border-emerald-500/30 text-emerald-200' 
          : 'bg-red-900/20 border-red-500/30 text-red-200'}
      `}>
        <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
        <span className="text-xs font-mono tracking-wider">
          {connected ? 'SYSTEM ONLINE' : 'DISCONNECTED'}
        </span>
      </div>

      {/* Metrics Mini-Display (only if connected) */}
      {connected && metrics && (
        <div className="bg-black/40 backdrop-blur-md border border-white/5 rounded-lg p-3 text-xs font-mono text-gray-300 shadow-xl">
          <div className="flex justify-between gap-4">
            <span>UPTIME</span>
            <span className="text-white">{Math.floor(metrics.uptime / 60)}m</span>
          </div>
          <div className="flex justify-between gap-4">
            <span>REQ</span>
            <span className="text-blue-300">{metrics.totalRequests}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span>LATENCY</span>
            <span className="text-yellow-300">{Math.round(metrics.avgResponseTime)}ms</span>
          </div>
        </div>
      )}
    </div>
  );
}
