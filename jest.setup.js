// Mock requestAnimationFrame
global.requestAnimationFrame = callback => setTimeout(callback, 0);

// Mock React Native's Animated
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
}));

// Mock Platform
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'android',
  select: jest.fn(obj => obj.android),
  isTV: true,
}));

// Mock Alert
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

// Mock ScrollView
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.ScrollView = jest.fn().mockImplementation(({children}) => children);
  return RN;
});

// Mock window.location
delete window.location;
window.location = { reload: jest.fn() };

// Silence the warning https://github.com/facebook/react-native/issues/11094#issuecomment-263240420
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Setup document.querySelector mock
document.querySelector = jest.fn(); 