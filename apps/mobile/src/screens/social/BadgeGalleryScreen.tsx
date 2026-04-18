import React, { useEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SectionList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native'
import { useBadgeStore } from '@/store/badgeStore'
import { BadgeIcon } from '@/components/social/BadgeIcon'
import type { Badge } from '@/types/social-social'

interface BadgeSectionData {
  title: string
  data: Badge[]
}

export function BadgeGalleryScreen() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const badges = useBadgeStore((s) => s.badges)
  const userBadges = useBadgeStore((s) => s.userBadges)
  const isBadgeUnlocked = useBadgeStore((s) => s.isBadgeUnlocked)
  const getProgress = useBadgeStore((s) => s.getProgress)

  const categories = useMemo(() => {
    const cats = new Set(badges.map((b) => b.category))
    return Array.from(cats)
  }, [badges])

  const sections = useMemo(() => {
    return categories
      .map((category) => ({
        title: category.charAt(0).toUpperCase() + category.slice(1),
        data: badges.filter((b) => b.category === category),
      }))
      .filter((section) => section.data.length > 0)
  }, [categories, badges])

  const stats = useMemo(() => {
    const totalBadges = badges.length
    const unlockedCount = userBadges.length
    const progressPercentage =
      totalBadges > 0 ? Math.round((unlockedCount / totalBadges) * 100) : 0

    return {
      total: totalBadges,
      unlocked: unlockedCount,
      percentage: progressPercentage,
    }
  }, [badges, userBadges])

  const filteredSections = useMemo(() => {
    if (!selectedCategory) return sections
    return sections.filter((s) => s.title.toLowerCase() === selectedCategory)
  }, [sections, selectedCategory])

  const renderBadgeItem = ({ item: badge }: { item: Badge }) => {
    const unlocked = isBadgeUnlocked(badge.id)
    const progress = getProgress(badge.id)

    return (
      <View style={styles.badgeItemContainer}>
        <BadgeIcon
          badge={badge}
          size="medium"
          locked={!unlocked}
          progress={progress}
          showProgress={unlocked && progress < 100}
        />
        <Text
          style={[
            styles.badgeName,
            { color: unlocked ? '#333' : '#999' },
          ]}
          numberOfLines={2}
        >
          {badge.name}
        </Text>
        <Text style={styles.badgeRarity}>{badge.rarity}</Text>
      </View>
    )
  }

  const renderSectionHeader = ({ section }: { section: BadgeSectionData }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <Text style={styles.sectionCount}>
        {section.data.filter((b) => isBadgeUnlocked(b.id)).length}/
        {section.data.length}
      </Text>
    </View>
  )

  const renderCategoryFilter = () => (
    <View style={styles.filterContainer}>
      <TouchableOpacity
        style={[
          styles.filterButton,
          selectedCategory === null && styles.filterButtonActive,
        ]}
        onPress={() => setSelectedCategory(null)}
      >
        <Text
          style={[
            styles.filterText,
            selectedCategory === null && styles.filterTextActive,
          ]}
        >
          All
        </Text>
      </TouchableOpacity>

      {categories.map((category) => (
        <TouchableOpacity
          key={category}
          style={[
            styles.filterButton,
            selectedCategory === category && styles.filterButtonActive,
          ]}
          onPress={() => setSelectedCategory(category)}
        >
          <Text
            style={[
              styles.filterText,
              selectedCategory === category && styles.filterTextActive,
            ]}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  )

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.title}>Badge Gallery</Text>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{stats.unlocked}</Text>
          <Text style={styles.statLabel}>Unlocked</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statValue}>{stats.percentage}%</Text>
          <Text style={styles.statLabel}>Progress</Text>
        </View>
      </View>

      {renderCategoryFilter()}
    </View>
  )

  if (badges.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <ActivityIndicator size="large" color="#2B82F7" />
        <Text style={styles.emptyText}>Loading badges...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <SectionList
        sections={filteredSections}
        keyExtractor={(item, index) => item.id + index}
        renderItem={renderBadgeItem}
        renderSectionHeader={renderSectionHeader}
        ListHeaderComponent={renderHeader}
        numColumns={3}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.contentContainer}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  headerContainer: {
    padding: 16,
    paddingBottom: 0,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2B82F7',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  filterButtonActive: {
    backgroundColor: '#2B82F7',
  },
  filterText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9F9F9',
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  sectionCount: {
    fontSize: 14,
    color: '#999',
  },
  columnWrapper: {
    paddingHorizontal: 16,
    gap: 12,
  },
  badgeItemContainer: {
    flex: 1 / 3,
    alignItems: 'center',
    marginVertical: 8,
  },
  badgeName: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  badgeRarity: {
    marginTop: 4,
    fontSize: 10,
    color: '#999',
    textTransform: 'capitalize',
  },
})
