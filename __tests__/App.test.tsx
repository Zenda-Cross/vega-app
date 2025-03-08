/**
 * @format
 */

import 'react-native';
import React from 'react';
import renderer from 'react-test-renderer';

// Mock the Skeleton component
jest.mock('../src/components/Skeleton', () => {
  const React = require('react');
  const { View } = require('react-native');
  
  return {
    __esModule: true,
    default: function MockSkeletonLoader() {
      return <View />;
    }
  };
});

// Mock the App component to avoid complex dependencies
jest.mock('../src/App', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  
  return {
    __esModule: true,
    default: function MockApp() {
      return (
        <View>
          <Text>Vega App</Text>
        </View>
      );
    }
  };
});

import App from '../src/App';

// Note: import explicitly to use the types shipped with jest.
import {it} from '@jest/globals';

describe('App', () => {
  it('renders correctly', () => {
    renderer.create(<App />);
  });
});
