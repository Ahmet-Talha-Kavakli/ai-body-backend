import React, { useRef, useState } from 'react';
import { Animated, Easing, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

const EASE_CLOSE = Easing.bezier(0.4, 0, 1, 1);
const EASE_SPRING = Easing.bezier(0.16, 1, 0.3, 1);
const DELETE_THRESHOLD = -72;
const DELETE_WIDTH = 80;

export interface Meal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  timestamp: Date;
}

interface Props {
  meal: Meal;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
}

export function FoodItem({ meal, onDelete, onEdit }: Props) {
  const translateX = useRef(new Animated.Value(0)).current;
  const rowHeight = useRef(new Animated.Value(72)).current;
  const rowOpacity = useRef(new Animated.Value(1)).current;
  const [revealed, setRevealed] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 6 && Math.abs(g.dy) < 12,
      onPanResponderMove: (_, g) => {
        const x = Math.max(g.dx, -DELETE_WIDTH - 8);
        translateX.setValue(x < 0 ? x : 0);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx < DELETE_THRESHOLD) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          Animated.spring(translateX, {
            toValue: -DELETE_WIDTH,
            useNativeDriver: true,
            tension: 80,
            friction: 12,
          }).start(() => setRevealed(true));
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 80,
            friction: 12,
          }).start(() => setRevealed(false));
        }
      },
    }),
  ).current;

  const handleDelete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Animated.parallel([
      Animated.timing(rowHeight, {
        toValue: 0,
        duration: 280,
        easing: EASE_CLOSE,
        useNativeDriver: false,
      }),
      Animated.timing(rowOpacity, {
        toValue: 0,
        duration: 200,
        easing: EASE_CLOSE,
        useNativeDriver: false,
      }),
    ]).start(() => onDelete(meal.id));
  };

  return (
    <Animated.View
      style={{ height: rowHeight, opacity: rowOpacity, overflow: 'hidden', marginBottom: 8 }}
    >
      <View style={st.wrapper}>
        {/* Delete button behind */}
        <View style={st.deleteArea}>
          <Pressable onPress={handleDelete} style={st.deleteBtn}>
            <Text style={st.deleteTxt} allowFontScaling={false}>
              Sil
            </Text>
          </Pressable>
        </View>

        {/* Swipeable row */}
        <Animated.View
          style={[st.row, { transform: [{ translateX }] }]}
          {...panResponder.panHandlers}
        >
          <Pressable onPress={() => onEdit(meal.id)} style={st.content}>
            <View style={st.left}>
              <Text style={st.name} numberOfLines={1} allowFontScaling={false}>
                {meal.name}
              </Text>
              <Text style={st.meta} allowFontScaling={false}>
                {meal.protein}g protein • {meal.calories} kcal
              </Text>
            </View>
            <Text style={st.kcal} allowFontScaling={false}>
              {meal.calories}
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const st = StyleSheet.create({
  wrapper: {
    flex: 1,
    position: 'relative',
  },
  deleteArea: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: DELETE_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#FF3B30',
  },
  deleteBtn: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  deleteTxt: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  row: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 64,
  },
  left: { flex: 1 },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
    letterSpacing: -0.2,
  },
  meta: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 3,
  },
  kcal: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FF9F0A',
    letterSpacing: -0.3,
  },
});
