import React from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList } from 'react-native';
import TVFocusableView from './TVFocusableView';
import usePlatform from '../hooks/usePlatform';

interface TVHomeLayoutProps {
  categories: Array<{
    id: string;
    title: string;
    items: Array<{
      id: string;
      title: string;
      poster?: string;
      onPress: () => void;
    }>;
  }>;
  onCategoryFocus?: (categoryId: string) => void;
  onItemFocus?: (itemId: string, categoryId: string) => void;
}

/**
 * A TV-optimized layout for the home screen.
 * Designed for easy D-pad navigation with rows of content categories.
 */
const TVHomeLayout: React.FC<TVHomeLayoutProps> = ({
  categories,
  onCategoryFocus,
  onItemFocus,
}) => {
  const { isTV, width } = usePlatform();

  // If not on TV, don't render this component
  if (!isTV) {
    return null;
  }

  return (
    <ScrollView style={styles.container}>
      {categories.map((category) => (
        <View key={category.id} style={styles.categoryContainer}>
          <TVFocusableView
            style={styles.categoryTitle}
            onFocus={() => onCategoryFocus?.(category.id)}
          >
            <Text style={styles.categoryTitleText}>{category.title}</Text>
          </TVFocusableView>
          
          <FlatList
            data={category.items}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TVFocusableView
                style={styles.itemContainer}
                onPress={item.onPress}
                onFocus={() => onItemFocus?.(item.id, category.id)}
              >
                {item.poster ? (
                  <View style={styles.posterContainer}>
                    {/* Image component would go here */}
                    <View style={styles.poster} />
                  </View>
                ) : null}
                <Text style={styles.itemTitle} numberOfLines={2}>
                  {item.title}
                </Text>
              </TVFocusableView>
            )}
            style={styles.itemsRow}
          />
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  categoryContainer: {
    marginBottom: 40,
  },
  categoryTitle: {
    marginLeft: 20,
    marginBottom: 10,
  },
  categoryTitleText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  itemsRow: {
    paddingLeft: 20,
  },
  itemContainer: {
    width: 180,
    marginRight: 15,
  },
  posterContainer: {
    width: 180,
    height: 270,
    backgroundColor: '#333',
    borderRadius: 8,
    marginBottom: 8,
  },
  poster: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  itemTitle: {
    color: '#FFF',
    fontSize: 16,
  },
});

export default TVHomeLayout; 