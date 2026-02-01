import React from 'react';
import { ScrollView, Text, View, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/ui';
import { Server, Cpu, Database, Wifi, Power, AlertTriangle } from 'lucide-react-native';
import Animated, { FadeInLeft } from 'react-native-reanimated';
import { useSocket } from '@/components/SocketProvider';
import { ServiceStatus } from '@/types';

const NodeItem = ({ item, index }: { item: ServiceStatus, index: number }) => {
    const isOnline = item.status === 'healthy';
    const isDegraded = item.status === 'degraded';
    const isOffline = item.status === 'offline' || item.status === 'unhealthy';
    
    let statusColor = 'bg-green-500';
    if (isDegraded) statusColor = 'bg-yellow-500';
    if (isOffline) statusColor = 'bg-red-500';

    return (
        <Animated.View entering={FadeInLeft.delay(index * 100).duration(400)}>
            <Card className="mb-4 p-4">
                <View className="flex-row justify-between items-center mb-3">
                    <View className="flex-row items-center">
                        <View className={`w-3 h-3 rounded-full mr-2 ${statusColor}`} />
                        <Text className="font-bold text-gray-900 text-lg capitalize">{item.name}</Text>
                    </View>
                    <Server size={20} color={isOffline ? '#9ca3af' : '#374151'} />
                </View>
                
                <View className="flex-row justify-between mb-2">
                    <View className="flex-row items-center">
                        <Wifi size={14} color="#6b7280" className="mr-1" />
                        <Text className="text-gray-500 text-xs ml-1">
                            {new Date(item.lastCheck).toLocaleTimeString()}
                        </Text>
                    </View>
                    {isOffline && (
                        <Text className="text-red-500 text-xs font-bold uppercase">Unhealthy</Text>
                    )}
                </View>

                {item.responseTime !== undefined && (
                    <View className="flex-row gap-2 mt-2 pt-2 border-t border-gray-100">
                        <View className="flex-1 bg-gray-50 p-2 rounded flex-row items-center justify-center">
                            <Cpu size={14} color="#4b5563" />
                            <Text className="text-gray-700 text-xs font-bold ml-2">{item.responseTime}ms</Text>
                        </View>
                        {item.errorCount > 0 && (
                            <View className="flex-1 bg-red-50 p-2 rounded flex-row items-center justify-center">
                                <AlertTriangle size={14} color="#ef4444" />
                                <Text className="text-red-700 text-xs font-bold ml-2">{item.errorCount} err</Text>
                            </View>
                        )}
                    </View>
                )}
            </Card>
        </Animated.View>
    );
};

export default function NodesScreen() {
  const { services } = useSocket();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-4 pt-4 pb-2 flex-row justify-between items-end">
        <Text className="text-3xl font-bold text-gray-900">System Nodes</Text>
        <Text className="text-gray-500 pb-1">{services.length} Total</Text>
      </View>
      <FlatList
        data={services}
        keyExtractor={(item) => item.name}
        renderItem={({ item, index }) => <NodeItem item={item} index={index} />}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
            <View className="items-center justify-center py-10">
                <Text className="text-gray-400">No services detected</Text>
            </View>
        }
      />
    </SafeAreaView>
  );
}
