import React from 'react';
import { ScrollView, Text, View, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSocket } from '@/components/SocketProvider';
import { Card, MetricCard, Button } from '@/components/ui';
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
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView 
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header Section */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)} className="mt-4 mb-6">
          <Text className="text-3xl font-bold text-gray-900">Dashboard</Text>
          <Text className="text-gray-500 text-base">Overview of your systems</Text>
        </Animated.View>

        {/* System Status Banner */}
        <TouchableOpacity 
            onPress={() => !isConnected && connect()}
            activeOpacity={isConnected ? 1 : 0.7}
        >
            <Animated.View entering={FadeInDown.delay(200).duration(500)}>
                <Card className={`mb-6 flex-row items-center p-4 ${isConnected ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <View className={`w-3 h-3 rounded-full mr-3 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                    <View>
                        <Text className="font-bold text-gray-900">
                            System {isConnected ? 'Online' : 'Offline'}
                        </Text>
                        <Text className="text-xs text-gray-500">
                            {isConnected ? 'Connected to Heady Core' : 'Tap to reconnect...'}
                        </Text>
                    </View>
                    <Wifi size={20} color={isConnected ? '#22c55e' : '#ef4444'} style={{ marginLeft: 'auto' }} />
                </Card>
            </Animated.View>
        </TouchableOpacity>

        {/* Key Metrics Grid */}
        <View className="flex-row flex-wrap gap-4 mb-6">
            <Animated.View className="w-[47%]" entering={FadeInDown.delay(300).duration(500)}>
                <MetricCard 
                    title="CPU Usage" 
                    value={cpuValue} 
                    icon={<Cpu size={20} color="white" />}
                    trend={metrics ? `${metrics.cpu.cores} Cores` : undefined}
                    trendType="neutral"
                    variant="gradient"
                />
            </Animated.View>
            <Animated.View className="w-[47%]" entering={FadeInDown.delay(400).duration(500)}>
                <MetricCard 
                    title="Memory" 
                    value={memValue} 
                    icon={<Database size={20} color="#6b7280" />}
                    trend={metrics ? `${Math.round(metrics.memory.usagePercent)}%` : undefined}
                    trendType="neutral"
                />
            </Animated.View>
            <Animated.View className="w-[47%]" entering={FadeInDown.delay(500).duration(500)}>
                 <MetricCard 
                    title="Active Tasks" 
                    value={tasksValue} 
                    icon={<Activity size={20} color="#6b7280" />}
                />
            </Animated.View>
            <Animated.View className="w-[47%]" entering={FadeInDown.delay(600).duration(500)}>
                 <MetricCard 
                    title="Uptime" 
                    value={uptimeValue} 
                    icon={<Server size={20} color="#6b7280" />}
                />
            </Animated.View>
        </View>

        {/* Recent Activity / Actions */}
        <Animated.View className="mb-6" entering={FadeInUp.delay(700).duration(500)}>
            <Text className="text-lg font-bold text-gray-900 mb-3">Quick Actions</Text>
            <View className="flex-row gap-3">
                <Button 
                    title="Deploy" 
                    onPress={() => {}} 
                    variant="gradient" 
                    className="flex-1"
                    icon={<Zap size={18} color="white" />}
                />
                 <Button 
                    title="Stop All" 
                    onPress={() => {}} 
                    variant="secondary" 
                    className="flex-1 bg-red-600"
                />
            </View>
        </Animated.View>

        {/* Real-time Feed Preview */}
        <Animated.View entering={FadeInUp.delay(800).duration(500)}>
             <Text className="text-lg font-bold text-gray-900 mb-3">Live Feed</Text>
             <Card className="min-h-[150px]">
                {lastMessage ? (
                    <Text className="font-mono text-xs">{JSON.stringify(lastMessage, null, 2)}</Text>
                ) : (
                    <View className="items-center justify-center flex-1 py-8">
                        <Activity size={32} color="#e5e7eb" />
                        <Text className="text-gray-400 mt-2">Waiting for data...</Text>
                    </View>
                )}
             </Card>
        </Animated.View>

      </ScrollView>
    </SafeAreaView>
  );
}
