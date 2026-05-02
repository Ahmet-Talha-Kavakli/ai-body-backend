import { useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import { font, SLEEP } from './theme';

export default function NextButton({
  label,
  onPress,
  disabled,
  variant = 'primary',
  icon,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'ghost';
  icon?: 'arrow.right' | 'moon.fill' | 'checkmark';
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const isPrimary = variant === 'primary';

  const handlePress = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable
      onPressIn={() =>
        Animated.spring(scale, {
          toValue: 0.97,
          useNativeDriver: true,
          tension: 400,
          friction: 14,
        }).start()
      }
      onPressOut={() =>
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 300,
          friction: 12,
        }).start()
      }
      onPress={handlePress}
      disabled={disabled}
    >
      <Animated.View
        style={{
          transform: [{ scale }],
          backgroundColor: isPrimary ? SLEEP.accent : 'transparent',
          borderRadius: 18,
          paddingVertical: 18,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 8,
          minHeight: 60,
          opacity: disabled ? 0.45 : 1,
        }}
      >
        {icon && (
          <SymbolView
            name={icon}
            size={icon === 'moon.fill' ? 18 : 16}
            tintColor={isPrimary ? '#fff' : SLEEP.accent}
            fallback={<View />}
          />
        )}
        <Text
          style={{
            fontFamily: font.bold,
            fontSize: 17,
            color: isPrimary ? '#fff' : SLEEP.accent,
            letterSpacing: -0.2,
          }}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}
