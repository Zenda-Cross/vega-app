import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import useThemeStore from '../lib/zustand/themeStore';

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
}) => {
  const {primary} = useThemeStore();
  return (
    <View className="flex-1 justify-center items-center p-4 bg-black">
      <Text className="text-red-400 text-lg font-bold mb-4 text-center">
        Something went wrong
      </Text>
      <Text className="text-gray-400 text-sm mb-6 text-center">
        {error.message || 'An unexpected error occurred'}
      </Text>
      <TouchableOpacity
        onPress={resetError}
        className="px-6 py-3 rounded-lg"
        style={{backgroundColor: primary}}>
        <Text className="text-white font-semibold">Try Again</Text>
      </TouchableOpacity>
    </View>
  );
};

interface QueryErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
}

interface QueryErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class QueryErrorBoundary extends React.Component<
  QueryErrorBoundaryProps,
  QueryErrorBoundaryState
> {
  constructor(props: QueryErrorBoundaryProps) {
    super(props);
    this.state = {hasError: false, error: null};
  }

  static getDerivedStateFromError(error: Error): QueryErrorBoundaryState {
    return {hasError: true, error};
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('QueryErrorBoundary caught an error:', error, errorInfo);
  }

  resetError = () => {
    this.setState({hasError: false, error: null});
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || ErrorFallback;
      return (
        <FallbackComponent
          error={this.state.error}
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}
