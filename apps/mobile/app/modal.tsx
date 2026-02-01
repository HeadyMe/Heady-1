import { StatusBar } from 'expo-status-bar';
import { Platform, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { Button } from '@/components/ui';

export default function ModalScreen() {
  return (
    <View className="flex-1 items-center justify-center p-4">
      <Text className="text-2xl font-bold mb-4 text-gray-900">Modal Screen</Text>
      <View className="h-px w-[80%] bg-gray-200 mb-6" />
      
      <Text className="text-center text-gray-600 mb-8 text-base">
        This is a modal. It overlays the current screen and is great for quick actions or information.
      </Text>

      <Button title="Dismiss" onPress={() => router.back()} className="w-full" />

      {/* Use a light status bar on iOS to account for the black space above the modal */}
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </View>
  );
}
