import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import useWatchHistoryStore from '../lib/zustand/watchHistrory';
import { MMKV } from '../lib/Mmkv';
import { useNavigation } from '@react-navigation/native';
import useThemeStore from '../lib/zustand/themeStore';

const ContinueWatching = () => {
    const { primary } = useThemeStore(state => state);
    const navigation = useNavigation();
    const { history } = useWatchHistoryStore(state => state);
    const [progressData, setProgressData] = useState<Record<string, number>>({});

    // Get screen width for calculating item size
    const screenWidth = Dimensions.get('window').width;
    // Use smaller width to match other UI elements (approximately 28% of screen width)
    const itemWidth = screenWidth * 0.28;

    // Filter out duplicates and get the most recent items
    const recentItems = React.useMemo(() => {
        const seen = new Set();
        const items = history
            .filter(item => {
                if (seen.has(item.link)) {
                    return false;
                }
                seen.add(item.link);
                return true;
            })
            .slice(0, 10); // Limit to 10 items

        return items;
    }, [history]);

    // Only show if we have items
    if (recentItems.length === 0) {
        return null;
    }

    // Load progress data
    useEffect(() => {
        const loadProgressData = () => {
            const progressMap: Record<string, number> = {};

            recentItems.forEach(item => {
                try {
                    // Try to get dedicated watch history progress
                    const historyKey = item.infoUrl || item.link;
                    const historyProgressKey = `watch_history_progress_${historyKey}`;
                    const storedProgress = MMKV.getString(historyProgressKey);

                    if (storedProgress) {
                        const parsed = JSON.parse(storedProgress);
                        if (parsed.percentage) {
                            progressMap[item.link] = Math.min(Math.max(parsed.percentage, 0), 100);
                        } else if (parsed.currentTime && parsed.duration) {
                            const percentage = (parsed.currentTime / parsed.duration) * 100;
                            progressMap[item.link] = Math.min(Math.max(percentage, 0), 100);
                        }
                    } else if (item.currentTime && item.duration) {
                        const percentage = (item.currentTime / item.duration) * 100;
                        progressMap[item.link] = Math.min(Math.max(percentage, 0), 100);
                    }
                } catch (e) {
                    console.error('Error processing progress for item:', item.title, e);
                }
            });

            setProgressData(progressMap);
        };

        loadProgressData();
    }, [recentItems]);

    const handleNavigateToInfo = (item: any) => {
        try {
            // Parse the link if it's a JSON string
            let linkData = item.link;
            if (typeof item.link === 'string' && item.link.startsWith('{')) {
                try {
                    linkData = JSON.parse(item.link);
                } catch (e) {
                    console.error('Failed to parse link:', e);
                }
            }

            // Navigate to Info screen
            navigation.navigate('Info', {
                link: linkData,
                provider: item.provider || 'multiStream',
                poster: item.image || '',
            });
        } catch (error) {
            console.error('Navigation error:', error);
        }
    };

    return (
        <View className="mt-3 mb-4">
            <Text className="text-white text-xl font-semibold px-4 mb-3">
                Continue Watching
            </Text>

            <FlatList
                data={recentItems}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.link}
                contentContainerStyle={{ paddingHorizontal: 12 }}
                renderItem={({ item }) => {
                    const progress = progressData[item.link] || 0;

                    // Skip items that are completed
                    if (progress >= 98) return null;

                    return (
                        <TouchableOpacity
                            activeOpacity={0.8}
                            className="mx-2"
                            style={{ width: itemWidth }}
                            onPress={() => handleNavigateToInfo(item)}
                        >
                            <View className="relative">
                                {/* Poster Image */}
                                <Image
                                    source={{ uri: item.image }}
                                    className="w-full aspect-[2/3] rounded-lg"
                                />

                                {/* Progress Bar */}
                                <View
                                    className="absolute bottom-0 left-0 right-0 h-1"
                                    style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                                >
                                    <View
                                        style={{
                                            position: 'absolute',
                                            left: 0,
                                            top: 0,
                                            height: '100%',
                                            width: `${progress}%`,
                                            backgroundColor: primary,
                                        }}
                                    />
                                </View>

                                {/* Episode indication for TV shows */}
                                {item.episodeTitle && (
                                    <View
                                        className="absolute top-1 right-1 px-1 rounded-sm"
                                        style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
                                    >
                                        <Text className="text-white text-[10px]">
                                            {item.episodeTitle}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            <Text numberOfLines={1} className="text-white text-xs mt-1">
                                {item.title}
                            </Text>
                        </TouchableOpacity>
                    );
                }}
            />
        </View>
    );
};

export default ContinueWatching;
