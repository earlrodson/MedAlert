/**
 * Error Boundary component for React Native
 * Catches JavaScript errors in child component tree and displays fallback UI
 */

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { logger, ErrorHandler } from '@/lib/error-handling';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  context?: string;
  showRetry?: boolean;
  customMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  private maxRetries: number = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error
    ErrorHandler.logError(error, this.props.context || 'ErrorBoundary', {
      componentStack: errorInfo.componentStack,
      retryCount: this.state.retryCount,
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Update state with error info
    this.setState({
      error,
      errorInfo,
    });

    // Report to external service
    logger.fatal('Error boundary caught an error', error, {
      context: this.props.context,
      componentStack: errorInfo.componentStack,
    }, 'ErrorBoundary');
  }

  handleRetry = () => {
    if (this.state.retryCount >= this.maxRetries) {
      logger.warn('Max retry attempts reached in ErrorBoundary',
        { retryCount: this.state.retryCount, context: this.props.context },
        'ErrorBoundary');
      return;
    }

    logger.info('Retrying after error boundary trigger',
      { retryCount: this.state.retryCount + 1, context: this.props.context },
      'ErrorBoundary');

    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
    }));
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback component if provided
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      // Default error UI
      return (
        <View style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Something went wrong</Text>

            <Text style={styles.errorMessage}>
              {this.props.customMessage || ErrorHandler.createUserMessage(
                this.state.error,
                'An unexpected error occurred while rendering this component.'
              )}
            </Text>

            {__DEV__ && this.state.error && (
              <ScrollView style={styles.errorDetails}>
                <Text style={styles.errorDetailsTitle}>Error Details (Development Only):</Text>
                <Text style={styles.errorDetailsText}>
                  {this.state.error.toString()}
                </Text>
                {this.state.errorInfo && (
                  <Text style={styles.errorDetailsText}>
                    Component Stack:{'\n'}{this.state.errorInfo.componentStack}
                  </Text>
                )}
              </ScrollView>
            )}

            {this.props.showRetry && this.state.retryCount < this.maxRetries && (
              <TouchableOpacity
                style={styles.retryButton}
                onPress={this.handleRetry}
              >
                <Text style={styles.retryButtonText}>
                  Try Again {this.state.retryCount > 0 && `(${this.state.retryCount}/${this.maxRetries})`}
                </Text>
              </TouchableOpacity>
            )}

            {this.state.retryCount >= this.maxRetries && (
              <Text style={styles.maxRetriesMessage}>
                Maximum retry attempts reached. Please restart the app.
              </Text>
            )}
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

/**
 * Functional Error Boundary Hook for easier usage
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

/**
 * Async Error Boundary for handling async operations
 */
interface AsyncErrorBoundaryProps extends Props {
  onAsyncError?: (error: Error) => void;
}

interface AsyncErrorBoundaryState extends State {
  asyncError: Error | null;
}

export class AsyncErrorBoundary extends Component<AsyncErrorBoundaryProps, AsyncErrorBoundaryState> {
  constructor(props: AsyncErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      asyncError: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<AsyncErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    super.componentDidCatch?.(error, errorInfo);
  }

  handleAsyncError = (error: Error) => {
    ErrorHandler.logError(error, `${this.props.context || 'AsyncErrorBoundary'}`);

    this.setState({
      asyncError: error,
      hasError: true,
    });

    this.props.onAsyncError?.(error);
  };

  render() {
    if (this.state.hasError || this.state.asyncError) {
      const error = this.state.error || this.state.asyncError;

      // Custom fallback component if provided
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      return (
        <View style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Operation Failed</Text>

            <Text style={styles.errorMessage}>
              {this.props.customMessage || ErrorHandler.createUserMessage(
                error,
                'An error occurred during this operation.'
              )}
            </Text>

            {this.props.showRetry && (
              <TouchableOpacity
                style={styles.retryButton}
                onPress={this.handleRetry}
              >
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      );
    }

    // Inject error handler into children
    const childrenWithHandler = React.Children.map(this.props.children, child => {
      if (React.isValidElement(child)) {
        return React.cloneElement(child, {
          ...child.props,
          onError: this.handleAsyncError,
        } as any);
      }
      return child;
    });

    return <>{childrenWithHandler}</>;
  }
}

/**
 * Styles for error boundary components
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 8,
    padding: 16,
    maxWidth: 400,
    width: '100%',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#7F1D1D',
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorDetails: {
    maxHeight: 200,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    padding: 8,
    marginBottom: 16,
  },
  errorDetailsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4,
  },
  errorDetailsText: {
    fontSize: 10,
    color: '#6B7280',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  retryButton: {
    backgroundColor: '#DC2626',
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  maxRetriesMessage: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default ErrorBoundary;