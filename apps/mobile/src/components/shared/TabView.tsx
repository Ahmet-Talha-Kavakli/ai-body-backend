import React, { useState } from 'react'
import { View, Pressable, Text, ScrollView } from 'react-native'

interface TabViewProps {
  tabs: Array<{ label: string; content: React.ReactNode }>
}

export function TabView({ tabs }: TabViewProps) {
  const [activeTab, setActiveTab] = useState(0)

  return (
    <View className="flex-1">
      <ScrollView horizontal scrollEventThrottle={16} className="border-b border-gray-200 bg-white">
        {tabs.map((tab, index) => (
          <Pressable
            key={index}
            onPress={() => setActiveTab(index)}
            className={`border-b-2 px-4 py-3 ${
              activeTab === index ? 'border-blue-600' : 'border-transparent'
            }`}
          >
            <Text
              className={`font-semibold ${activeTab === index ? 'text-blue-600' : 'text-gray-600'}`}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView className="flex-1">{tabs[activeTab].content}</ScrollView>
    </View>
  )
}
