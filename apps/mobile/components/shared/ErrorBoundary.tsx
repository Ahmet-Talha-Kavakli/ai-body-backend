import React, { Component, ReactNode } from 'react'
import { View, Text } from 'react-native'
import { Button } from './Button'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 items-center justify-center bg-white px-6">
          <Text className="mb-4 text-lg font-bold">Something went wrong</Text>
          <Text className="mb-6 text-center text-gray-600">{this.state.error?.message}</Text>
          <Button
            label="Try Again"
            onPress={() => this.setState({ hasError: false, error: null })}
          />
        </View>
      )
    }

    return this.props.children
  }
}
