import React from 'react'
import { Pressable, Text } from 'react-native'
import { clsx } from 'nativewind'

interface ButtonProps {
  label: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
}: ButtonProps) {
  const baseClasses = 'rounded-lg font-bold justify-center items-center flex-row'

  const variantClasses = {
    primary: 'bg-blue-600',
    secondary: 'bg-gray-200',
    danger: 'bg-red-500',
  }

  const sizeClasses = {
    sm: 'px-3 py-2',
    md: 'px-4 py-3',
    lg: 'px-6 py-4',
  }

  const textColorClasses = {
    primary: 'text-white',
    secondary: 'text-black',
    danger: 'text-white',
  }

  return (
    <Pressable
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        disabled && 'opacity-50'
      )}
      onPress={onPress}
      disabled={disabled || loading}
    >
      <Text className={clsx('text-center font-bold', textColorClasses[variant])}>
        {loading ? '...' : label}
      </Text>
    </Pressable>
  )
}
