import React from 'react';
import { ScrollView, Text, View, RefreshControl, TouchableOpacity } from 'react-native';
import { useSocket } from '@/components/SocketProvider';
import { MetricCard, Button } from '@/components/ui';
import { SacredContainer } from '@/components/SacredGeometry/SacredContainer';
import { SacredCard } from '@/components/SacredGeometry/SacredCard';
import { Zap, Wifi, Activity, Server, Cpu, Database } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

export default function Dashboard() {
  const { isConnected, lastMessage, connect, metrics, tasks, services } = useSocket();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // In a real app, you might re-request initial data here
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  // Format helpers
  const formatBytes = (bytes: number) => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Derive display values
  const cpuValue = metrics ? `${Math.round(metrics.cpu.usage)}%` : '--';
  const memValue = metrics ? formatBytes(metrics.memory.used) : '--';
  const tasksValue = tasks.length.toString();
  const uptimeValue = metrics ? `${Math.floor(metrics.process.uptime / 3600)}h ${Math.floor((metrics.process.uptime % 3600) / 60)}m` : '--';

  return (
    <SacredContainer variant="cosmic">
      <ScrollView 
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 20, paddingTop: 60 }}
        refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
        }
      >
        {/* Header Section */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)} className="mb-6">
          <Text className="text-3xl font-bold text-white">Dashboard</Text>
          <Text className="text-purple-200 text-base">Overview of your systems</Text>
        </Animated.View>

        {/* System Status Banner */}
        <TouchableOpacity 
            onPress={() => !isConnected && connect()}
            activeOpacity={isConnected ? 1 : 0.7}
        >
            <Animated.View entering={FadeInDown.delay(200).duration(500)}>
                <SacredCard 
                    variant={isConnected ? 'glass' : 'solid'}
                    glowing={isConnected}
                    className="mb-6 flex-row items-center p-4"
                >
                    <View className="flex-row items-center justify-between w-full">
                        <View className="flex-row items-center">
                            <View className={`w-3 h-3 rounded-full mr-3 ${isConnected ? 'bg-emerald-400 shadow-emerald-400' : 'bg-red-500'}`} />
                            <View>
                                <Text className="font-bold text-white text-lg">
                                    System {isConnected ? 'Online' : 'Offline'}
                                </Text>
                                <Text className="text-xs text-gray-400">
                                    {isConnected ? 'Connected to Heady Core' : 'Tap to reconnect...'}
                                </Text>
                            </View>
                        </View>
                        <Wifi size={24} color={isConnected ? '#34d399' : '#ef4444'} />
                    </View>
                </SacredCard>
            </Animated.View>
        </TouchableOpacity>

        {/* Key Metrics Grid */}
        <View className="flex-row flex-wrap gap-4 mb-6 justify-between">
            <Animated.View className="w-[48%]" entering={FadeInDown.delay(300).duration(500)}>
                <SacredCard title="CPU Usage" variant="glass">
                    <View className="flex-row items-center justify-between mb-2">
                        <Cpu size={20} color="#a78bfa" />
                        <Text className="text-2xl font-bold text-white">{cpuValue}</Text>
                    </View>
                    <Text className="text-xs text-gray-400">{metrics ? `${metrics.cpu.cores} Cores` : 'Unknown'}</Text>
                </SacredCard>
            </Animated.View>
            <Animated.View className="w-[48%]" entering={FadeInDown.delay(400).duration(500)}>
                <SacredCard title="Memory" variant="glass">
                    <View className="flex-row items-center justify-between mb-2">
                        <Database size={20} color="#a78bfa" />
                        <Text className="text-2xl font-bold text-white">{memValue}</Text>
                    </View>
                    <Text className="text-xs text-gray-400">{metrics ? `${Math.round(metrics.memory.usagePercent)}% Used` : 'Unknown'}</Text>
                </SacredCard>
            </Animated.View>
            <Animated.View className="w-[48%]" entering={FadeInDown.delay(500).duration(500)}>
                 <SacredCard title="Active Tasks" variant="glass">
                    <View className="flex-row items-center justify-between mb-2">
                        <Activity size={20} color="#a78bfa" />
                        <Text className="text-2xl font-bold text-white">{tasksValue}</Text>
                    </View>
                    <Text className="text-xs text-gray-400">Running now</Text>
                </SacredCard>
            </Animated.View>
            <Animated.View className="w-[48%]" entering={FadeInDown.delay(600).duration(500)}>
                 <SacredCard title="Uptime" variant="glass">
                    <View className="flex-row items-center justify-between mb-2">
                        <Server size={20} color="#a78bfa" />
                        <Text className="text-2xl font-bold text-white">{uptimeValue}</Text>
                    </View>
                    <Text className="text-xs text-gray-400">Since last reboot</Text>
                </SacredCard>
            </Animated.View>
        </View>

        {/* Quick Actions */}
        <Animated.View className="mb-6" entering={FadeInUp.delay(700).duration(500)}>
            <Text className="text-lg font-bold text-white mb-3 ml-1">Quick Actions</Text>
            <View className="flex-row gap-3">
                <Button 
                    title="Deploy" 
                    onPress={() => {}} 
                    variant="gradient" 
                    className="flex-1 bg-purple-600 border-0"
                    icon={<Zap size={18} color="white" />}
                />
                 <Button 
                    title="Stop All" 
                    onPress={() => {}} 
                    variant="secondary" 
                    className="flex-1 bg-red-900/50 border border-red-800"
                />
            </View>
        </Animated.View>

        {/* Real-time Feed Preview */}
        <Animated.View entering={FadeInUp.delay(800).duration(500)}>
             <Text className="text-lg font-bold text-white mb-3 ml-1">Live Feed</Text>
             <SacredCard variant="holographic" className="min-h-[150px]">
                {lastMessage ? (
                    <Text className="font-mono text-xs text-green-400">{JSON.stringify(lastMessage, null, 2)}</Text>
                ) : (
                    <View className="items-center justify-center flex-1 py-8">
                        <Activity size={32} color="#4b5563" />
                        <Text className="text-gray-500 mt-2">Waiting for data stream...</Text>
                    </View>
                )}
             </SacredCard>
        </Animated.View>

      </ScrollView>
    </SacredContainer>
  );
}
