/**
 * NutritionHost — Beslenme tab ana host'u.
 *
 * Modal stack tabanlı navigation:
 *   - TodayScreen: ana sayfa (her zaman görünür)
 *   - AddOptionsSheet: + tıklayınca
 *   - SearchScreen: tam ekran modal
 *   - AiCameraScreen: tam ekran modal
 *   - BarcodeScreen: tam ekran modal
 *   - QuickAddSheet, CustomFoodSheet: bottom sheet modal
 *   - MealDetailSheet: bottom sheet modal (öğün kartına tıklayınca)
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, DeviceEventEmitter, Modal, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import {
  useFonts,
  Sora_400Regular,
  Sora_500Medium,
  Sora_600SemiBold,
  Sora_700Bold,
  Sora_800ExtraBold,
} from '@expo-google-fonts/sora';

import { N } from './theme';
import TodayScreen from './screens/TodayScreen';
import SearchScreen from './screens/SearchScreen';
import AiCameraScreen from './screens/AiCameraScreen';
import BarcodeScreen from './screens/BarcodeScreen';
import { AddOptionsSheet } from './sheets/AddOptionsSheet';
import { QuickAddSheet } from './sheets/QuickAddSheet';
import { CustomFoodSheet } from './sheets/CustomFoodSheet';
import { CreateRecipeSheet } from './sheets/CreateRecipeSheet';
import { MealDetailSheet } from './sheets/MealDetailSheet';
import { useNutritionToday } from './hooks/useNutritionToday';
import KitchenScreen from '../kitchen/screens/KitchenScreen';
import type { MealType } from './api/types';

type Modal_ =
  | { kind: 'none' }
  | { kind: 'add_options'; mealType: MealType }
  | { kind: 'search'; mealType: MealType }
  | { kind: 'ai_camera'; mealType: MealType }
  | { kind: 'barcode'; mealType: MealType }
  | { kind: 'quick_add'; mealType: MealType }
  | { kind: 'custom_food'; mealType: MealType }
  | { kind: 'recipe' }
  | { kind: 'meal_detail'; mealType: MealType }
  | { kind: 'kitchen' };

export default function NutritionHost() {
  const [modal, setModal] = useState<Modal_>({ kind: 'none' });
  const { data, refresh, removeMealOptimistic } = useNutritionToday();

  // Tab focus alındığında sessiz refresh (asistan'da yemek eklenmiş olabilir)
  useFocusEffect(
    useCallback(() => {
      refresh(true);
    }, [refresh]),
  );

  // Asistan tab'ında AI mealLog yarattığında anlık refresh
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('nutrition:dirty', () => {
      refresh(true);
    });
    return () => sub.remove();
  }, [refresh]);
  const todayRefreshRef = useRef<(() => void) | null>(null);
  const todayOptimisticRemoveRef = useRef<((id: string) => void) | null>(null);

  const [fontsLoaded] = useFonts({
    Sora_400Regular,
    Sora_500Medium,
    Sora_600SemiBold,
    Sora_700Bold,
    Sora_800ExtraBold,
  });

  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: N.bg.page,
        }}
      >
        <ActivityIndicator color={N.accent.primary} />
      </View>
    );
  }

  const close = () => setModal({ kind: 'none' });

  const onAdded = () => {
    // TodayScreen'in kendi hook'unu refresh et (ayrı instance)
    todayRefreshRef.current?.();
    refresh();
    close();
  };

  return (
    <View style={{ flex: 1 }}>
      <TodayScreen
        onAddMeal={(mealType) => setModal({ kind: 'add_options', mealType })}
        onMealPress={(mealType) => setModal({ kind: 'meal_detail', mealType })}
        onOpenKitchen={() => setModal({ kind: 'kitchen' })}
        refreshRef={todayRefreshRef}
        optimisticRemoveRef={todayOptimisticRemoveRef}
      />

      {/* Add options sheet */}
      <AddOptionsSheet
        visible={modal.kind === 'add_options'}
        mealType={modal.kind === 'add_options' ? modal.mealType : null}
        onClose={close}
        onSelect={(action) => {
          if (modal.kind !== 'add_options') return;
          const mt = modal.mealType;
          // Önce mevcut sheet'i kapat, animasyon bitince yenisini aç
          setModal({ kind: 'none' });
          setTimeout(() => {
            switch (action) {
              case 'search':
                setModal({ kind: 'search', mealType: mt });
                break;
              case 'ai_photo':
                setModal({ kind: 'ai_camera', mealType: mt });
                break;
              case 'barcode':
                setModal({ kind: 'barcode', mealType: mt });
                break;
              case 'quick_add':
                setModal({ kind: 'quick_add', mealType: mt });
                break;
              case 'custom_food':
                setModal({ kind: 'custom_food', mealType: mt });
                break;
              case 'recipe':
                setModal({ kind: 'recipe' });
                break;
            }
          }, 320);
        }}
      />

      {/* Full-screen modals */}
      <Modal
        visible={modal.kind === 'search'}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={close}
      >
        {modal.kind === 'search' && (
          <SearchScreen
            mealType={modal.mealType}
            onClose={close}
            onAdded={onAdded}
            onOpenAiCamera={() => setModal({ kind: 'ai_camera', mealType: modal.mealType })}
            onOpenBarcode={() => setModal({ kind: 'barcode', mealType: modal.mealType })}
          />
        )}
      </Modal>

      <Modal
        visible={modal.kind === 'ai_camera'}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={close}
      >
        {modal.kind === 'ai_camera' && (
          <AiCameraScreen mealType={modal.mealType} onClose={close} onAdded={onAdded} />
        )}
      </Modal>

      <Modal
        visible={modal.kind === 'barcode'}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={close}
      >
        {modal.kind === 'barcode' && (
          <BarcodeScreen mealType={modal.mealType} onClose={close} onAdded={onAdded} />
        )}
      </Modal>

      {/* Bottom sheets */}
      <QuickAddSheet
        visible={modal.kind === 'quick_add'}
        mealType={modal.kind === 'quick_add' ? modal.mealType : 'snack'}
        onClose={close}
        onAdded={onAdded}
      />

      <CustomFoodSheet
        visible={modal.kind === 'custom_food'}
        mealType={modal.kind === 'custom_food' ? modal.mealType : 'snack'}
        onClose={close}
        onAdded={onAdded}
      />

      <CreateRecipeSheet
        visible={modal.kind === 'recipe'}
        onClose={close}
        onSaved={() => {
          todayRefreshRef.current?.();
          close();
        }}
      />

      <KitchenScreen visible={modal.kind === 'kitchen'} onClose={close} />

      <MealDetailSheet
        visible={modal.kind === 'meal_detail'}
        mealType={modal.kind === 'meal_detail' ? modal.mealType : 'snack'}
        meals={modal.kind === 'meal_detail' && data ? data.meals[modal.mealType] : []}
        goalKcal={
          modal.kind === 'meal_detail' && data?.goal
            ? Math.round(
                data.goal.calories *
                  (modal.mealType === 'breakfast'
                    ? 0.25
                    : modal.mealType === 'lunch'
                      ? 0.35
                      : modal.mealType === 'dinner'
                        ? 0.3
                        : 0.1),
              )
            : undefined
        }
        onClose={close}
        onAddMore={() => {
          if (modal.kind !== 'meal_detail') return;
          const mt = modal.mealType;
          setModal({ kind: 'none' });
          setTimeout(() => setModal({ kind: 'add_options', mealType: mt }), 300);
        }}
        onChanged={() => {
          (todayRefreshRef.current as any)?.(true);
          refresh(true);
        }}
        onOptimisticRemove={(id) => {
          todayOptimisticRemoveRef.current?.(id);
          removeMealOptimistic(id);
        }}
      />
    </View>
  );
}
