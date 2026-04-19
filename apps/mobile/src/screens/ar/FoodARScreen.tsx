import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  Modal,
} from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { ARCameraOverlay } from '../../components/ar/ARCameraOverlay'
import { FoodDetectionCard } from '../../components/ar/FoodDetectionCard'
import { foodDetectionService } from '../../services/foodDetectionService'
import type { FoodDetectionResult } from '../../types/ar'

type RootStackParamList = {
  FoodARScreen: undefined
  FoodApprovalScreen: { detection: FoodDetectionResult; photoPath: string }
  FoodARHistoryScreen: undefined
}

type Props = NativeStackScreenProps<RootStackParamList, 'FoodARScreen'>

export function FoodARScreen({ navigation, route }: Props) {
  const [mode, setMode] = useState<'realtime' | 'photo'>('realtime')
  const [detectionStatus, setDetectionStatus] = useState<
    'detecting' | 'found' | 'not_found'
  >('detecting')
  const [currentDetection, setCurrentDetection] =
    useState<FoodDetectionResult | null>(null)
  const [fps, setFps] = useState<number>(30)
  const [showSettingsModal, setShowSettingsModal] = useState(false)

  const handleDetection = useCallback((detection: FoodDetectionResult) => {
    setCurrentDetection(detection)
    setDetectionStatus('found')
  }, [])

  const handleEditDetection = useCallback(() => {
    if (currentDetection) {
      navigation.navigate('FoodApprovalScreen', {
        detection: currentDetection,
        photoPath: currentDetection.photoPath || '',
      })
    }
  }, [currentDetection, navigation])

  const handleAddDetection = useCallback(() => {
    if (currentDetection) {
      navigation.navigate('FoodApprovalScreen', {
        detection: currentDetection,
        photoPath: currentDetection.photoPath || '',
      })
    }
  }, [currentDetection, navigation])

  const handleCancel = useCallback(() => {
    setCurrentDetection(null)
    setDetectionStatus('detecting')
  }, [])

  const handleViewHistory = useCallback(() => {
    navigation.navigate('FoodARHistoryScreen')
  }, [navigation])

  const toggleMode = () => {
    setMode(mode === 'realtime' ? 'photo' : 'realtime')
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Camera View Area */}
      <View style={styles.cameraContainer}>
        <View style={styles.cameraPlaceholder}>
          <ARCameraOverlay
            detectionStatus={detectionStatus}
            fps={mode === 'realtime' ? fps : undefined}
          />
        </View>
      </View>

      {/* Top Controls */}
      <View style={styles.topControls}>
        <TouchableOpacity
          style={styles.modeButton}
          onPress={toggleMode}
        >
          <Text style={styles.modeButtonText}>
            {mode === 'realtime' ? 'Live' : 'Photo'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => setShowSettingsModal(true)}
        >
          <Text style={styles.settingsButtonText}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Detection Info Bottom Sheet */}
      {currentDetection && (
        <View style={styles.bottomSheet}>
          <FoodDetectionCard
            detection={currentDetection}
            onEdit={handleEditDetection}
          />

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.button, styles.addButton]}
              onPress={handleAddDetection}
            >
              <Text style={styles.addButtonText}>Ekle</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.editButton]}
              onPress={handleEditDetection}
            >
              <Text style={styles.editButtonText}>Düzelt</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonText}>İptal</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Settings Modal */}
      <Modal
        visible={showSettingsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Settings</Text>

            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Camera Permissions</Text>
              <TouchableOpacity style={styles.settingButton}>
                <Text style={styles.settingButtonText}>Grant</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Clear Cache</Text>
              <TouchableOpacity style={styles.settingButton}>
                <Text style={styles.settingButtonText}>Clear</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>View History</Text>
              <TouchableOpacity
                style={styles.settingButton}
                onPress={handleViewHistory}
              >
                <Text style={styles.settingButtonText}>Open</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowSettingsModal(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  cameraPlaceholder: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topControls: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modeButton: {
    backgroundColor: 'rgba(0, 122, 255, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modeButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  settingsButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  settingsButtonText: {
    fontSize: 16,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: 32,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: '#4CAF50',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  editButton: {
    backgroundColor: '#FF9800',
  },
  editButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  cancelButton: {
    backgroundColor: '#f44336',
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  settingButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  settingButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#f44336',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
})
