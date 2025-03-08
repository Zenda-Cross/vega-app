import React from 'react';
import { View, Text } from 'react-native';
import { render } from '@testing-library/react-native';

const SimpleComponent = () => (
  <View>
    <Text>Hello, World!</Text>
  </View>
);

describe('SimpleComponent', () => {
  it('renders correctly', () => {
    const { getByText } = render(<SimpleComponent />);
    expect(getByText('Hello, World!')).toBeTruthy();
  });
}); 