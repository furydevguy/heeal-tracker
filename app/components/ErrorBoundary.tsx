import React from 'react';
import { Pressable, Text, View } from 'react-native';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ 
          flex: 1, 
          justifyContent: 'center', 
          alignItems: 'center', 
          padding: 20,
          backgroundColor: '#ffffff'
        }}>
          <Text style={{ 
            fontSize: 18, 
            fontWeight: 'bold', 
            color: '#ff0000',
            marginBottom: 10,
            textAlign: 'center'
          }}>
            Something went wrong
          </Text>
          <Text style={{ 
            fontSize: 14, 
            color: '#666666',
            marginBottom: 20,
            textAlign: 'center'
          }}>
            {this.state.error?.message || 'Unknown error occurred'}
          </Text>
          <Pressable
            onPress={() => this.setState({ hasError: false, error: null })}
            style={{
              backgroundColor: '#007AFF',
              padding: 12,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: 'white', fontWeight: 'bold' }}>Try Again</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}
