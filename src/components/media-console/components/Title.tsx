import React from 'react';
import {Text, View} from 'react-native';
import {styles} from './styles';

interface TitleProps {
  primary: string;
  secondary?: string;
  status?: string;
  scale?: number;
}

export const Title = (title: TitleProps) => {
  if (title) {
    return (
      <View style={[styles.control, _styles.title]}>
        <Text style={[styles.text, _styles.titleText, {fontSize: 18 * (title.scale ?? 1)}]} numberOfLines={1}>
          {title.primary}
        </Text>
        {title.secondary && (
          <Text
            style={[_styles.secondaryText, {color: 'hsl(0, 0%, 70%)', fontSize: 12 * (title.scale ?? 1)}]}
            numberOfLines={1}>
            {title.secondary}
          </Text>
        )}
        {title.status ? (
          <Text style={[_styles.statusText, {fontSize: 10 * (title.scale ?? 1)}]} numberOfLines={1}>
            {title.status}
          </Text>
        ) : null}
      </View>
    );
  }

  return null;
};

import {StyleSheet} from 'react-native';

const _styles = StyleSheet.create({
  title: {
    alignItems: 'flex-start',
    flex: 1,
    flexDirection: 'column',
    padding: 0,
    marginRight: 16,
    marginTop: 15,
    minHeight: 37,
  },
  titleText: {
    textAlign: 'center',
  },
  statusText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  secondaryText: {
    fontSize: 12,
  },
});
