import React from 'react';
import { ScrollView, Text, View, FlatList } from 'react-native';
import { SacredCard } from '@/components/SacredGeometry/SacredCard';
import { SacredContainer } from '@/components/SacredGeometry/SacredContainer';
import { Server, Cpu, Database, Wifi, Power, AlertTriangle } from 'lucide-react-native';
import Animated, { FadeInLeft } from 'react-native-reanimated';
import { useSocket } from '@/components/SocketProvider';
import { ServiceStatus } from '@/types';

const NodeItem = ({ item, index }: { item: ServiceStatus, index: number }) => {
    const isOnline = item.status === 'healthy';
    const isDegraded = item.status === 'degraded';
    const isOffline = item.status === 'offline' || item.status === 'unhealthy';
    
    let statusColor = 'bg-emerald-400 shadow-emerald-400';
    if (isDegraded) statusColor = 'bg-yellow-400 shadow-yellow-400';
    if (isOffline) statusColor = 'bg-red-500 shadow-red-500';

    return (
        <Animated.View entering={FadeInLeft.delay(index * 100).duration(400)}>
            <SacredCard variant="glass" className="mb-4">
                <View className="flex-row justify-between items-center mb-3">
                    <View className="flex-row items-center">
                        <View className={`w-3 h-3 rounded-full mr-3 ${statusColor}`} />
                        <Text className="font-bold text-white text-lg capitalize tracking-wide">{item.name}</Text>
                    </View>
                    <Server size={20} color={isOffline ? '#6b7280' : '#a78bfa'} />
                </View>
                
                <View className="flex-row justify-between mb-2 px-1">
                    <View className="flex-row items-center">
                        <Wifi size={14} color="#94a3b8" className="mr-1" />
                        <Text className="text-gray-400 text-xs ml-1">
                            {new Date(item.lastCheck).toLocaleTimeString()}
                        </Text>
                    </View>
                    {isOffline && (
                        <Text className="text-red-400 text-xs font-bold uppercase tracking-wider">Unhealthy</Text>
                    )}
                </View>

                {item.responseTime !== undefined && (
                    <View className="flex-row gap-2 mt-2 pt-2 border-t border-white/5">
                        <View className="flex-1 bg-black/20 p-2 rounded flex-row items-center justify-center border border-white/5">
                            <Cpu size={14} color="#94a3b8" />
                            <Text className="text-gray-300 text-xs font-bold ml-2">{item.responseTime}ms</Text>
                        </View>
                        {item.errorCount > 0 && (
                            <View className="flex-1 bg-red-900/20 p-2 rounded flex-row items-center justify-center border border-red-500/20">
                                <AlertTriangle size={14} color="#f87171" />
                                <Text className="text-red-400 text-xs font-bold ml-2">{item.errorCount} err</Text>
                            </View>
                        )}
                    </View>
                )}
            </SacredCard>
        </Animated.View>
    );
};

export default function NodesScreen() {
  const { services } = useSocket();

  return (
    <SacredContainer variant="cosmic">
      <View className="px-4 pt-12 pb-4 flex-row justify-between items-end">
        <Text className="text-3xl font-bold text-white">System Nodes</Text>
        <Text className="text-purple-200 pb-1">{services.length} Total</Text>
      </View>
      <FlatList
        data={services}
        keyExtractor={(item) => item.name}
        renderItem={({ item, index }) => <NodeItem item={item} index={index} />}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
            <View className="items-center justify-center py-10">
                <Text className="text-gray-500">No services detected</Text>
            </View>
        }
      />
    </SacredContainer>
  );
}
