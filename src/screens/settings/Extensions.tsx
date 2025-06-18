import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SettingsStackParamList} from '../../App';
import {
  MaterialCommunityIcons,
  MaterialIcons,
  Feather,
  AntDesign,
} from '@expo/vector-icons';
import useThemeStore from '../../lib/zustand/themeStore';
import useContentStore from '../../lib/zustand/contentStore';
import {
  extensionStorage,
  ProviderExtension,
} from '../../lib/storage/extensionStorage';
import {extensionManager} from '../../lib/services/ExtensionManager';
import {
  updateProvidersService,
  UpdateInfo,
} from '../../lib/services/UpdateProviders';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import {settingsStorage} from '../../lib/storage';
import RenderProviderFlagIcon from '../../components/RenderProviderFLagIcon';

type Props = NativeStackScreenProps<SettingsStackParamList, 'Extensions'>;

type TabType = 'installed' | 'available';

const Extensions = ({navigation}: Props) => {
  const {primary} = useThemeStore(state => state);
  const {
    provider: activeExtensionProvider,
    setProvider: setActiveExtensionProvider,
    installedProviders,
    availableProviders,
    setInstalledProviders,
    setAvailableProviders,
  } = useContentStore(state => state);
  const [activeTab, setActiveTab] = useState<TabType>(
    installedProviders?.length > 0 ? 'installed' : 'available',
  );
  const [installingProvider, setInstallingProvider] = useState<string | null>(
    null,
  );
  const [updatingProvider, setUpdatingProvider] = useState<string | null>(null);
  const [updateInfos, setUpdateInfos] = useState<UpdateInfo[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  // Load providers on component mount
  useEffect(() => {
    const initializeExtensions = async () => {
      try {
        await extensionManager.initialize();
        loadProviders();
        await checkForUpdates();

        // Try to fetch latest providers if we don't have any
        if (!availableProviders || availableProviders.length === 0) {
          await handleRefresh();
        }
      } catch (error) {
        // Still try to load from cache if initialization fails
        loadProviders();
      }
    };

    initializeExtensions();
  }, []);
  const loadProviders = () => {
    const installed = extensionStorage.getInstalledProviders() || [];
    const available = extensionStorage.getAvailableProviders() || [];
    setInstalledProviders(installed);
    setAvailableProviders(available);
  };
  const checkForUpdates = async () => {
    try {
      const updates = await updateProvidersService.checkForUpdatesManual();
      setUpdateInfos(updates);
    } catch (error) {
      console.error('Error checking for updates:', error);
    }
  };

  const handleUpdateProvider = async (provider: ProviderExtension) => {
    if (!provider || !provider.value) {
      Alert.alert('Error', 'Invalid provider data');
      return;
    }

    if (settingsStorage.isHapticFeedbackEnabled()) {
      ReactNativeHapticFeedback.trigger('effectClick', {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
      });
    }

    setUpdatingProvider(provider.value);
    try {
      const success = await updateProvidersService.updateProvider(provider);
      if (success) {
        loadProviders();
        await checkForUpdates();

        Alert.alert(
          'Success',
          `${provider.display_name} has been updated successfully!`,
        );

        // Update the active provider if it was the one being updated
        if (activeExtensionProvider?.value === provider.value) {
          setActiveExtensionProvider(provider);
        }
      } else {
        Alert.alert('Error', 'Failed to update provider. Please try again.');
      }
    } catch (error) {
      console.error('Update error:', error);
      Alert.alert('Error', 'Failed to update provider. Please try again.');
    } finally {
      setUpdatingProvider(null);
    }
  };

  const handleTabChange = (tab: TabType) => {
    if (settingsStorage.isHapticFeedbackEnabled()) {
      ReactNativeHapticFeedback.trigger('effectTick', {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
      });
    }
    setActiveTab(tab);
  };
  const handleInstallProvider = async (provider: ProviderExtension) => {
    if (!provider || !provider.value) {
      Alert.alert('Error', 'Invalid provider data');
      return;
    }

    if (settingsStorage.isHapticFeedbackEnabled()) {
      ReactNativeHapticFeedback.trigger('effectClick', {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
      });
    }

    setInstallingProvider(provider.value);
    try {
      await extensionManager.installProvider(provider);
      loadProviders();

      Alert.alert(
        'Success',
        `${provider.display_name} has been installed successfully!`,
      );
      setInstalledProviders(extensionStorage.getInstalledProviders() || []);
      if (
        !activeExtensionProvider ||
        activeExtensionProvider.value !== provider.value
      ) {
        setActiveExtensionProvider(provider);
      }
    } catch (error) {
      console.error('Installation error:', error);
      Alert.alert('Error', 'Failed to install provider. Please try again.');
    } finally {
      setInstallingProvider(null);
    }
  };
  const handleUninstallProvider = (provider: ProviderExtension) => {
    if (!provider || !provider.value) {
      Alert.alert('Error', 'Invalid provider data');
      return;
    }

    Alert.alert(
      'Uninstall Provider',
      `Are you sure you want to uninstall ${
        provider.display_name || 'this provider'
      }?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Uninstall',
          style: 'destructive',
          onPress: () => {
            extensionStorage.uninstallProvider(provider.value);
            loadProviders();
            setInstalledProviders(
              extensionStorage.getInstalledProviders() || [],
            );

            // If this was the active provider, clear it
            if (activeExtensionProvider?.value === provider?.value) {
              setActiveExtensionProvider(
                extensionStorage.getInstalledProviders()[0] || {
                  value: '',
                  display_name: '',
                  type: '',
                  version: '',
                },
              );
            }
          },
        },
      ],
    );
  };
  const handleSetActiveProvider = (provider: ProviderExtension) => {
    if (!provider || !provider.value) {
      Alert.alert('Error', 'Invalid provider data');
      return;
    }

    if (settingsStorage.isHapticFeedbackEnabled()) {
      ReactNativeHapticFeedback.trigger('effectClick', {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
      });
    }
    setActiveExtensionProvider(provider);
  };
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const providers = await extensionManager.fetchManifest(true);

      // Update available providers in storage and state
      extensionStorage.setAvailableProviders(providers);
      setAvailableProviders(providers);

      loadProviders();
      await checkForUpdates();
    } catch (error) {
      console.error('Refresh error:', error);
      Alert.alert(
        'Error',
        'Failed to refresh providers list. Please check your internet connection.',
      );
    } finally {
      setRefreshing(false);
    }
  };
  const renderProviderCard = ({item}: {item: ProviderExtension}) => {
    // Add null checks to prevent crashes
    if (!item || !item.value) {
      return null;
    }

    const isActive = activeExtensionProvider?.value === item.value;
    const isInstalled = extensionStorage.isProviderInstalled(item.value);
    const isInstalling = installingProvider === item.value;
    const isUpdating = updatingProvider === item.value;

    // Check if update is available for this provider
    const updateInfo = updateInfos.find(
      info => info.provider.value === item.value,
    );
    const hasUpdate = updateInfo?.hasUpdate || false;

    return (
      <View className="bg-tertiary rounded-xl p-4 mb-3 mx-4">
        <View className="flex-row justify-between items-center mb-3 gap-3">
          {item.icon ? (
            <Image
              source={{
                uri: item.icon,
              }}
              className="w-10 h-10 rounded-lg"
              style={{resizeMode: 'cover'}}
            />
          ) : (
            <View className="px-3">
              <RenderProviderFlagIcon type={item.type} />
            </View>
          )}
          <View className="flex-1">
            <Text className="text-white text-lg font-semibold">
              {item.display_name || 'Unknown Provider'}
            </Text>
            <Text className="text-gray-400 text-sm">
              Version {item.version || 'Unknown'} • {item.type || 'Unknown'}
              {hasUpdate && updateInfo && (
                <Text className="text-orange-400">
                  • Update ({updateInfo.newVersion})
                </Text>
              )}
            </Text>
          </View>
        </View>
        {/* Action buttons */}
        <View className="flex-row gap-2">
          {activeTab === 'installed' ? (
            <>
              {/* Set as active button */}
              <TouchableOpacity
                onPress={() => handleSetActiveProvider(item)}
                className={`flex-1 flex-row justify-center items-center py-2 px-4 rounded-lg ${
                  isActive ? 'bg-green-600' : 'bg-gray-600'
                }`}>
                <MaterialIcons
                  name={isActive ? 'check-circle' : 'radio-button-unchecked'}
                  size={16}
                  color="white"
                />
                <Text className="text-white font-medium ml-2">
                  {isActive ? 'Active' : 'Set Active'}
                </Text>
              </TouchableOpacity>

              {/* Update button - only show if update is available */}
              {hasUpdate && (
                <TouchableOpacity
                  onPress={() => handleUpdateProvider(updateInfo!.provider)}
                  disabled={isUpdating}
                  className="px-4 py-2 rounded-lg"
                  style={{
                    backgroundColor: '#F97316',
                    opacity: isUpdating ? 0.7 : 1,
                  }}>
                  {isUpdating ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <MaterialCommunityIcons
                      name="update"
                      size={16}
                      color="white"
                    />
                  )}
                </TouchableOpacity>
              )}

              {/* Uninstall button */}
              <TouchableOpacity
                onPress={() => handleUninstallProvider(item)}
                className="bg-red-600 px-4 py-2 rounded-lg">
                <MaterialCommunityIcons name="delete" size={16} color="white" />
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Install button */}
              <TouchableOpacity
                onPress={() => handleInstallProvider(item)}
                disabled={isInstalled || isInstalling}
                className="flex-1 flex-row justify-center items-center py-2 px-4 rounded-lg"
                style={{
                  backgroundColor: isInstalled ? '#6B7280' : primary,
                  opacity: isInstalling ? 0.7 : 1,
                }}>
                {isInstalling ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <MaterialCommunityIcons
                      name={isInstalled ? 'check' : 'download'}
                      size={16}
                      color="white"
                    />
                    <Text className="text-white font-medium ml-2">
                      {isInstalled ? 'Installed' : 'Install'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };
  const currentData =
    activeTab === 'installed'
      ? (installedProviders || []).filter(item => item && item.value)
      : (availableProviders || []).filter(item => item && item.value);

  return (
    <View className="flex-1 bg-black pt-10 pb-16">
      <StatusBar backgroundColor="black" barStyle="light-content" />
      {/* Header */}
      <View className="flex-row items-center justify-between p-4 border-b border-gray-800">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AntDesign name="arrowleft" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-semibold">Extensions</Text>
        <TouchableOpacity onPress={handleRefresh}>
          <Feather name="refresh-cw" size={24} color={primary} />
        </TouchableOpacity>
      </View>
      {/* Tabs */}
      <View className="flex-row bg-quaternary mx-4 mt-4 rounded-xl">
        <TouchableOpacity
          onPress={() => handleTabChange('installed')}
          className="flex-1 py-3 rounded-xl"
          style={{
            backgroundColor:
              activeTab === 'installed' ? primary : 'transparent',
          }}>
          <Text
            className={`text-center font-medium ${
              activeTab === 'installed' ? 'text-white' : 'text-gray-400'
            }`}>
            Installed ({(installedProviders || []).length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleTabChange('available')}
          className="flex-1 py-3 rounded-xl"
          style={{
            backgroundColor:
              activeTab === 'available' ? primary : 'transparent',
          }}>
          <Text
            className={`text-center font-medium ${
              activeTab === 'available' ? 'text-white' : 'text-gray-400'
            }`}>
            Available ({(availableProviders || []).length})
          </Text>
        </TouchableOpacity>
      </View>
      {/* Provider list */}
      <FlatList
        data={currentData}
        keyExtractor={(item, index) => item?.value || `provider-${index}`}
        renderItem={renderProviderCard}
        className="flex-1 mt-4"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[primary]}
            tintColor={primary}
            progressBackgroundColor="black"
          />
        }
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center py-20">
            <MaterialCommunityIcons
              name="package-variant"
              size={64}
              color="gray"
            />
            <Text className="text-gray-400 text-lg mt-4">
              {activeTab === 'installed'
                ? 'No providers installed'
                : 'No providers available'}
            </Text>
            <Text className="text-gray-500 text-sm mt-2 text-center px-8">
              {activeTab === 'installed'
                ? 'Install providers from the Available tab to get started'
                : 'Pull to refresh to check for available providers'}
            </Text>
          </View>
        }
      />
    </View>
  );
};

export default Extensions;
