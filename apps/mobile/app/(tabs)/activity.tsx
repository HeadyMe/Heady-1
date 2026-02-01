import React from 'react';
import { ScrollView, Text, View, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/ui';
import { Clock, CheckCircle2, AlertCircle, PlayCircle, Info } from 'lucide-react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { useSocket } from '@/components/SocketProvider';
import { Alert } from '@/types';

const ActivityItem = ({ item, index }: { item: Alert, index: number }) => {
    let Icon = Info;
    let color = '#3b82f6';
    
    // Map severity/resolved to visual styles
    if (item.resolved) {
        Icon = CheckCircle2;
        color = '#22c55e';
    } else {
        switch (item.severity) {
            case 'critical':
                Icon = AlertCircle;
                color = '#ef4444';
                break;
            case 'warning':
                Icon = AlertCircle;
                color = '#eab308';
                break;
            case 'info':
            default:
                Icon = Info;
                color = '#3b82f6';
                break;
        }
    }

    const timeString = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <Animated.View entering={FadeInRight.delay(index * 100).springify()}>
            <Card className="mb-3 flex-row items-start p-4">
                <View className="mr-4 mt-1">
                    <Icon size={20} color={color} />
                </View>
                <View className="flex-1">
                    <View className="flex-row justify-between items-center mb-1">
                        <Text className="font-bold text-gray-900 capitalize">{item.service || 'System'}</Text>
                        <Text className="text-xs text-gray-500">{timeString}</Text>
                    </View>
                    <Text className="text-gray-600 text-sm leading-5">{item.message}</Text>
                    {item.resolved && (
                        <Text className="text-green-600 text-xs mt-1">Resolved</Text>
                    )}
                </View>
            </Card>
        </Animated.View>
    );
};

export default function ActivityScreen() {
  const { alerts } = useSocket();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-4 pt-4 pb-2">
        <Text className="text-3xl font-bold text-gray-900">Activity Log</Text>
      </View>
      <FlatList
        data={alerts}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => <ActivityItem item={item} index={index} />}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
            <View className="items-center justify-center py-10">
                <Text className="text-gray-400">No recent activity</Text>
            </View>
        }
      />
    </SafeAreaView>
  );
}
