import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

const EASE_SPRING = Easing.bezier(0.16, 1, 0.3, 1);
const EASE_MICRO = Easing.bezier(0.4, 0, 0.2, 1);
const ACCENT = '#FF9F0A';

export interface MealTime {
  id: string;
  name: string;
  icon: string;
  meals: Array<any>;
  totalKcal?: number;
}

interface Props {
  activeMealTime: string;
  onMealTimeChange: (id: string) => void;
  mealTimes: MealTime[];
}

function Tab({ mt, isActive, onPress }: { mt: MealTime; isActive: boolean; onPress: () => void }) {
  const bg = useRef(new Animated.Value(isActive ? 1 : 0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(bg, {
      toValue: isActive ? 1 : 0,
      duration: 220,
      easing: EASE_SPRING,
      useNativeDriver: false,
    }).start();
  }, [isActive]);

  const backgroundColor = bg.interpolate({
    inputRange: [0, 1],
    outputRange: ['#F2F2F7', '#FFFFFF'],
  });

  const press = () => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.95,
        duration: 80,
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
    Haptics.selectionAsync();
    onPress();
  };

  return (
    <Pressable onPress={press}>
      <Animated.View
        style={[st.tab, { backgroundColor, transform: [{ scale }] }, isActive && st.tabActive]}
      >
        <Text style={st.tabIcon} allowFontScaling={false}>
          {mt.icon}
        </Text>
        <Text style={[st.tabLabel, isActive && st.tabLabelActive]} allowFontScaling={false}>
          {mt.name}
        </Text>
        {mt.meals.length > 0 && (
          <View style={[st.badge, isActive && st.badgeActive]}>
            <Text style={[st.badgeText, isActive && st.badgeTextActive]} allowFontScaling={false}>
              {mt.meals.length}
            </Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

export function MealTimeTabs({ activeMealTime, onMealTimeChange, mealTimes }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.list}>
      {mealTimes.map((mt) => (
        <Tab
          key={mt.id}
          mt={mt}
          isActive={activeMealTime === mt.id}
          onPress={() => onMealTimeChange(mt.id)}
        />
      ))}
    </ScrollView>
  );
}

const st = StyleSheet.create({
  list: { paddingHorizontal: 16, gap: 8, paddingBottom: 2 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    gap: 6,
  },
  tabActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  tabIcon: { fontSize: 15 },
  tabLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
    letterSpacing: -0.1,
  },
  tabLabelActive: {
    fontWeight: '700',
    color: ACCENT,
  },
  badge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeActive: { backgroundColor: ACCENT },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8E8E93',
  },
  badgeTextActive: { color: '#FFFFFF' },
});
