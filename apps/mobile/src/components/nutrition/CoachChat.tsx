import React, { useRef, useEffect } from 'react'
import { View, FlatList, Text, StyleSheet } from 'react-native'

interface CoachMessage {
  role: 'user' | 'assistant'
  content: string
}

interface CoachChatProps {
  messages: CoachMessage[]
  isLoading: boolean
}

export function CoachChat({ messages, isLoading }: CoachChatProps) {
  const flatListRef = useRef<FlatList>(null)

  useEffect(() => {
    // Auto-scroll to end when new messages arrive
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true })
      }, 100)
    }
  }, [messages])

  const renderMessage = ({ item, index }: { item: CoachMessage; index: number }) => {
    const isUser = item.role === 'user'
    return (
      <View
        key={index}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.assistantMessageContainer,
        ]}
      >
        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          <Text
            style={[
              styles.messageText,
              isUser ? styles.userMessageText : styles.assistantMessageText,
            ]}
          >
            {item.content}
          </Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container} testID="coach-chat">
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item, index) => `${index}`}
        contentContainerStyle={styles.messagesList}
        scrollEnabled={true}
      />
      {isLoading && (
        <View style={styles.typingContainer} testID="typing-indicator">
          <View style={styles.typingDot} />
          <View style={styles.typingDot} />
          <View style={styles.typingDot} />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  messagesList: {
    flexGrow: 1,
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  messageContainer: {
    marginVertical: 8,
    flexDirection: 'row',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  assistantMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  userBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#E5E5EA',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 21,
  },
  userMessageText: {
    color: '#fff',
  },
  assistantMessageText: {
    color: '#000',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 16,
    gap: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#999',
  },
})
