import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
} from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { FoodDetectionResult } from '../../types/ar'

type RootStackParamList = {
  FoodARHistoryScreen: undefined
  FoodARScreen: undefined
}

type Props = NativeStackScreenProps<
  RootStackParamList,
  'FoodARHistoryScreen'
>

// Mock history data - in real app, this would come from database
const MOCK_HISTORY: FoodDetectionResult[] = [
  {
    id: '1',
    detectedFoodName: 'Apple',
    confidence: 95,
    nutrition: {
      calories: 52,
      proteinG: 0.3,
      carbsG: 14,
      fatG: 0.2,
      fiberG: 2.4,
    },
    source: 'gpt4_vision',
    portionSize: 100,
    portionUnit: 'g',
    photoPath: '/path/to/photo1.jpg',
    detectedAt: '2026-04-19T15:30:00Z',
    synced: true,
  },
  {
    id: '2',
    detectedFoodName: 'Banana',
    confidence: 88,
    nutrition: {
      calories: 89,
      proteinG: 1.1,
      carbsG: 23,
      fatG: 0.3,
      fiberG: 2.6,
    },
    source: 'usda',
    portionSize: 118,
    portionUnit: 'g',
    photoPath: '/path/to/photo2.jpg',
    detectedAt: '2026-04-19T14:20:00Z',
    synced: true,
  },
  {
    id: '3',
    detectedFoodName: 'Pasta',
    confidence: 92,
    nutrition: {
      calories: 200,
      proteinG: 8,
      carbsG: 40,
      fatG: 1.5,
      fiberG: 2,
    },
    source: 'gpt4_vision',
    portionSize: 100,
    portionUnit: 'g',
    photoPath: '/path/to/photo3.jpg',
    detectedAt: '2026-04-19T12:45:00Z',
    synced: true,
  },
]

export function FoodARHistoryScreen({ navigation, route }: Props) {
  const [history, setHistory] = useState<FoodDetectionResult[]>(MOCK_HISTORY)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'confidence'>(
    'recent'
  )

  const filteredHistory = history.filter((item) =>
    item.detectedFoodName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const sortedHistory = [...filteredHistory].sort((a, b) => {
    if (sortBy === 'recent') {
      return (
        new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime()
      )
    } else if (sortBy === 'name') {
      return a.detectedFoodName.localeCompare(b.detectedFoodName)
    } else {
      // confidence
      return b.confidence - a.confidence
    }
  })

  const handleItemPress = useCallback(
    (detection: FoodDetectionResult) => {
      // Navigate to detail view or back to AR with pre-filled data
      navigation.goBack()
    },
    [navigation]
  )

  const handleClearHistory = () => {
    Alert.alert('Clear History', 'Are you sure you want to clear all history?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Clear',
        onPress: () => setHistory([]),
        style: 'destructive',
      },
    ])
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    }
  }

  const renderHistoryItem = ({ item }: { item: FoodDetectionResult }) => (
    <TouchableOpacity
      style={styles.historyItem}
      onPress={() => handleItemPress(item)}
    >
      <View style={styles.itemThumbnail}>
        <Image
          source={{ uri: `file://${item.photoPath}` }}
          style={styles.thumbnail}
        />
      </View>

      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemName}>{item.detectedFoodName}</Text>
          <Text style={styles.itemConfidence}>
            {Math.round(item.confidence)}%
          </Text>
        </View>

        <Text style={styles.itemNutrition}>
          {Math.round(item.nutrition.calories)} cal · P:
          {item.nutrition.proteinG.toFixed(1)}g C:
          {item.nutrition.carbsG.toFixed(1)}g F:{item.nutrition.fatG.toFixed(1)}
          g
        </Text>

        <Text style={styles.itemTimestamp}>{formatDate(item.detectedAt)}</Text>
      </View>
    </TouchableOpacity>
  )

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No detection history yet</Text>
      <Text style={styles.emptySubtext}>
        Start scanning foods in AR mode to build your history
      </Text>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Detection History</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by food name..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>

      {/* Sort Options */}
      <View style={styles.sortContainer}>
        {(['recent', 'name', 'confidence'] as const).map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.sortButton,
              sortBy === option && styles.sortButtonActive,
            ]}
            onPress={() => setSortBy(option)}
          >
            <Text
              style={[
                styles.sortButtonText,
                sortBy === option && styles.sortButtonTextActive,
              ]}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* History List */}
      <FlatList
        data={sortedHistory}
        renderItem={renderHistoryItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={sortedHistory.length === 0 && styles.emptyList}
      />

      {/* Clear History Button */}
      {history.length > 0 && (
        <View style={styles.footerContainer}>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClearHistory}
          >
            <Text style={styles.clearButtonText}>Clear All History</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#f9f9f9',
  },
  sortContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sortButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  sortButtonActive: {
    backgroundColor: '#007AFF',
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  sortButtonTextActive: {
    color: '#fff',
  },
  historyItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  itemThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    overflow: 'hidden',
    marginRight: 12,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  itemConfidence: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2e7d32',
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  itemNutrition: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  itemTimestamp: {
    fontSize: 11,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
  },
  footerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  clearButton: {
    backgroundColor: '#f44336',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
})
