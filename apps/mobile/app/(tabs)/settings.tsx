import React from 'react';
import { ScrollView, Text, View, Switch, TouchableOpacity, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Button } from '@/components/ui';
import { ChevronRight, Bell, Lock, Smartphone, Globe, Moon, X } from 'lucide-react-native';
import { useSocket } from '@/components/SocketProvider';

const SettingItem = ({ icon: Icon, title, type = 'link', value = false, onValueChange, onPress, subtitle }: any) => (
    <TouchableOpacity 
        className="flex-row items-center py-4 border-b border-gray-100 last:border-0"
        disabled={type === 'switch'}
        onPress={onPress}
    >
        <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mr-4">
            <Icon size={20} color="#374151" />
        </View>
        <View className="flex-1">
            <Text className="font-medium text-gray-900 text-base">{title}</Text>
            {subtitle && <Text className="text-gray-500 text-xs">{subtitle}</Text>}
        </View>
        
        {type === 'switch' ? (
            <Switch value={value} onValueChange={onValueChange} />
        ) : (
            <ChevronRight size={20} color="#9ca3af" />
        )}
    </TouchableOpacity>
);

export default function SettingsScreen() {
  const [notifications, setNotifications] = React.useState(true);
  const [darkMode, setDarkMode] = React.useState(false);
  const { serverUrl, setServerUrl } = useSocket();
  const [modalVisible, setModalVisible] = React.useState(false);
  const [tempUrl, setTempUrl] = React.useState('');

  const handleOpenUrlSettings = () => {
      setTempUrl(serverUrl);
      setModalVisible(true);
  };

  const handleSaveUrl = () => {
      setServerUrl(tempUrl);
      setModalVisible(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-4">
        <View className="mt-4 mb-6">
          <Text className="text-3xl font-bold text-gray-900">Settings</Text>
        </View>

        <View className="mb-6">
            <Text className="text-sm font-bold text-gray-500 uppercase mb-2 ml-1">Preferences</Text>
            <Card className="p-0 px-4">
                <SettingItem 
                    icon={Bell} 
                    title="Push Notifications" 
                    type="switch" 
                    value={notifications}
                    onValueChange={setNotifications}
                />
                <SettingItem 
                    icon={Moon} 
                    title="Dark Mode" 
                    type="switch" 
                    value={darkMode}
                    onValueChange={setDarkMode}
                />
            </Card>
        </View>

        <View className="mb-6">
            <Text className="text-sm font-bold text-gray-500 uppercase mb-2 ml-1">Connection</Text>
            <Card className="p-0 px-4">
                <SettingItem 
                    icon={Globe} 
                    title="Server Address" 
                    subtitle={serverUrl}
                    onPress={handleOpenUrlSettings}
                />
                <SettingItem icon={Smartphone} title="Device Management" />
            </Card>
        </View>

        <View className="mb-6">
            <Text className="text-sm font-bold text-gray-500 uppercase mb-2 ml-1">Security</Text>
            <Card className="p-0 px-4">
                <SettingItem icon={Lock} title="Change Password" />
                <SettingItem icon={Lock} title="Biometric Login" />
            </Card>
        </View>

        <View className="items-center py-6">
            <Text className="text-gray-400 text-sm">Version 1.0.0 (Build 42)</Text>
        </View>

        <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
        >
            <View className="flex-1 justify-center items-center bg-black/50 p-4">
                <View className="bg-white rounded-xl w-full max-w-sm p-6">
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-xl font-bold text-gray-900">Server Address</Text>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <X size={24} color="#9ca3af" />
                        </TouchableOpacity>
                    </View>
                    <Text className="text-gray-500 mb-4">Enter the URL of your Heady Automation server.</Text>
                    
                    <TextInput
                        className="border border-gray-300 rounded-lg p-3 mb-4 text-base"
                        value={tempUrl}
                        onChangeText={setTempUrl}
                        placeholder="http://192.168.1.x:4100"
                        autoCapitalize="none"
                        autoCorrect={false}
                    />

                    <Button title="Save Configuration" onPress={handleSaveUrl} />
                </View>
            </View>
        </Modal>

      </ScrollView>
    </SafeAreaView>
  );
}
