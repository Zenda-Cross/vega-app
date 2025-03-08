module.exports = {
  preset: 'react-native',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|@react-native-community|react-native-mmkv-storage|nativewind|react-native-fs|react-native-linear-gradient|react-native-reanimated|zustand)/)',
  ],
  setupFiles: ['./jest.setup.js'],
  testEnvironment: 'jsdom',
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.[jt]sx?$',
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/__mocks__/fileMock.js',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^react-native-mmkv-storage$': '<rootDir>/__mocks__/react-native-mmkv-storage.js',
    '^react-native-fs$': '<rootDir>/__mocks__/react-native-fs.js',
    '^react-native-linear-gradient$': '<rootDir>/__mocks__/react-native-linear-gradient.js',
    '^react-native-reanimated$': '<rootDir>/__mocks__/react-native-reanimated.js',
    '^zustand$': '<rootDir>/__mocks__/zustand.js',
    '^nativewind$': 'react-native',
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
};
