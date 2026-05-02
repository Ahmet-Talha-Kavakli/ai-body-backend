import React, { useRef } from 'react';
import { Animated, Easing, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

const EASE_MICRO = Easing.bezier(0.4, 0, 0.2, 1);

export interface FrequentFood {
  id: string;
  name: string;
  icon: string;
  calories: number;
}

function FoodChip({ item, onPress }: { item: FrequentFood; onPress: (id: string) => void }) {
  const scale = useRef(new Animated.Value(1)).current;

  const press = () => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.93,
        duration: 100,
        easing: EASE_MICRO,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 120,
        easing: EASE_MICRO,
        useNativeDriver: true,
      }),
    ]).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(item.id);
  };

  return (
    <Pressable onPress={press}>
      <Animated.View style={[st.chip, { transform: [{ scale }] }]}>
        <View style={st.iconCircle}>
          <Text style={st.icon} allowFontScaling={false}>
            {item.icon}
          </Text>
        </View>
        <Text style={st.name} allowFontScaling={false} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={st.cal} allowFontScaling={false}>
          {item.calories} kal
        </Text>
      </Animated.View>
    </Pressable>
  );
}

interface Props {
  foods: FrequentFood[];
  onSelect?: (id: string) => void;
}

export function FrequentFoods({ foods, onSelect }: Props) {
  return (
    <FlatList
      data={foods}
      keyExtractor={(item) => item.id}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={st.list}
      renderItem={({ item }) => <FoodChip item={item} onPress={onSelect ?? (() => {})} />}
    />
  );
}

const st = StyleSheet.create({
  list: { paddingHorizontal: 16, gap: 8 },
  chip: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    width: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
    gap: 6,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F7F7FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 24 },
  name: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1C1C1E',
    textAlign: 'center',
    letterSpacing: -0.1,
  },
  cal: {
    fontSize: 10,
    color: '#8E8E93',
    fontWeight: '400',
  },
});
