import React from 'react';
import { ScrollView, Text, View, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/ui';
import { CheckCircle2, Clock, AlertCircle, PlayCircle, Loader } from 'lucide-react-native';
import Animated, { FadeInLeft } from 'react-native-reanimated';
import { useSocket } from '@/components/SocketProvider';
import { Task } from '@/types';

const TaskItem = ({ item, index }: { item: Task, index: number }) => {
    let Icon = Clock;
    let color = '#6b7280';
    let statusText = item.status;
    
    switch (item.status) {
        case 'completed':
            Icon = CheckCircle2;
            color = '#22c55e';
            break;
        case 'failed':
            Icon = AlertCircle;
            color = '#ef4444';
            break;
        case 'running':
        case 'in_progress':
            Icon = Loader;
            color = '#3b82f6';
            break;
        case 'pending':
            Icon = Clock;
            color = '#eab308';
            break;
    }

    return (
        <Animated.View entering={FadeInLeft.delay(index * 100).duration(400)}>
            <Card className="mb-4 p-4">
                <View className="flex-row justify-between items-center mb-3">
                    <View className="flex-row items-center flex-1 mr-2">
                        <Icon size={20} color={color} className={item.status === 'running' ? 'animate-spin' : ''} />
                        <Text className="font-bold text-gray-900 text-lg ml-3 flex-1" numberOfLines={1}>
                            {item.task.type}
                        </Text>
                    </View>
                    <View className={`px-2 py-1 rounded bg-gray-100`}>
                        <Text className="text-xs font-bold uppercase text-gray-600">{item.task.priority}</Text>
                    </View>
                </View>
                
                <Text className="text-gray-600 mb-3">{item.task.description}</Text>

                {item.status === 'running' && (
                    <View className="mb-2">
                        <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <View 
                                className="h-full bg-blue-500 rounded-full" 
                                style={{ width: `${item.progress}%` }} 
                            />
                        </View>
                        <Text className="text-right text-xs text-gray-500 mt-1">{item.progress}%</Text>
                    </View>
                )}

                <View className="flex-row justify-between border-t border-gray-100 pt-2 mt-1">
                    <Text className="text-xs text-gray-500 capitalize">
                        Status: <Text style={{ color }}>{statusText}</Text>
                    </Text>
                    {item.startedAt && (
                        <Text className="text-xs text-gray-500">
                            {new Date(item.startedAt).toLocaleTimeString()}
                        </Text>
                    )}
                </View>
            </Card>
        </Animated.View>
    );
};

export default function TasksScreen() {
  const { tasks } = useSocket();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-4 pt-4 pb-2 flex-row justify-between items-end">
        <Text className="text-3xl font-bold text-gray-900">Tasks</Text>
        <Text className="text-gray-500 pb-1">{tasks.length} Total</Text>
      </View>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => <TaskItem item={item} index={index} />}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
            <View className="items-center justify-center py-10">
                <Text className="text-gray-400">No active tasks</Text>
            </View>
        }
      />
    </SafeAreaView>
  );
}
