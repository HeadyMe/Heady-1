import React from 'react';
import { ScrollView, Text, View, FlatList } from 'react-native';
import { SacredCard } from '@/components/SacredGeometry/SacredCard';
import { SacredContainer } from '@/components/SacredGeometry/SacredContainer';
import { CheckCircle2, Clock, AlertCircle, PlayCircle, Loader } from 'lucide-react-native';
import Animated, { FadeInLeft } from 'react-native-reanimated';
import { useSocket } from '@/components/SocketProvider';
import { Task } from '@/types';

const TaskItem = ({ item, index }: { item: Task, index: number }) => {
    let Icon = Clock;
    let color = '#9ca3af';
    let statusText = item.status;
    
    switch (item.status) {
        case 'completed':
            Icon = CheckCircle2;
            color = '#34d399';
            break;
        case 'failed':
            Icon = AlertCircle;
            color = '#f87171';
            break;
        case 'running':
        case 'in_progress':
            Icon = Loader;
            color = '#60a5fa';
            break;
        case 'pending':
            Icon = Clock;
            color = '#fbbf24';
            break;
    }

    return (
        <Animated.View entering={FadeInLeft.delay(index * 100).duration(400)}>
            <SacredCard variant="glass" className="mb-4">
                <View className="flex-row justify-between items-center mb-3">
                    <View className="flex-row items-center flex-1 mr-2">
                        <Icon size={20} color={color} className={item.status === 'running' ? 'animate-spin' : ''} />
                        <Text className="font-bold text-white text-lg ml-3 flex-1" numberOfLines={1}>
                            {item.task.type}
                        </Text>
                    </View>
                    <View className={`px-2 py-1 rounded bg-white/10 border border-white/5`}>
                        <Text className="text-xs font-bold uppercase text-gray-300">{item.task.priority}</Text>
                    </View>
                </View>
                
                <Text className="text-gray-400 mb-3">{item.task.description}</Text>

                {item.status === 'running' && (
                    <View className="mb-3">
                        <View className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <View 
                                className="h-full bg-blue-500 rounded-full" 
                                style={{ width: `${item.progress}%` }} 
                            />
                        </View>
                        <Text className="text-right text-xs text-blue-400 mt-1">{item.progress}%</Text>
                    </View>
                )}

                <View className="flex-row justify-between border-t border-white/5 pt-3 mt-1">
                    <Text className="text-xs text-gray-500 capitalize">
                        Status: <Text style={{ color }}>{statusText}</Text>
                    </Text>
                    {item.startedAt && (
                        <Text className="text-xs text-gray-500">
                            {new Date(item.startedAt).toLocaleTimeString()}
                        </Text>
                    )}
                </View>
            </SacredCard>
        </Animated.View>
    );
};

export default function TasksScreen() {
  const { tasks } = useSocket();

  return (
    <SacredContainer variant="cosmic">
      <View className="px-4 pt-12 pb-4 flex-row justify-between items-end">
        <Text className="text-3xl font-bold text-white">Tasks</Text>
        <Text className="text-purple-200 pb-1">{tasks.length} Total</Text>
      </View>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => <TaskItem item={item} index={index} />}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
            <View className="items-center justify-center py-10">
                <Text className="text-gray-500">No active tasks</Text>
            </View>
        }
      />
    </SacredContainer>
  );
}
