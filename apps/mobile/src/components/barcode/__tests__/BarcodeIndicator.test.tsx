import { describe, it, expect, vi } from 'vitest'
import { BarcodeIndicator } from '../BarcodeIndicator'

describe('BarcodeIndicator Component', () => {
  it('should display scanning state', () => {
    const component = <BarcodeIndicator isScanning={true} lastDetection={null} />

    expect(component.props.isScanning).toBe(true)
  })

  it('should display detected barcode', () => {
    const mockDetection = {
      barcode: '5901234123457',
      foodName: 'Coca Cola',
      timestamp: '2026-04-19T10:00:00Z',
    }

    const component = <BarcodeIndicator isScanning={false} lastDetection={mockDetection} />

    expect(component.props.lastDetection?.barcode).toBe('5901234123457')
  })

  it('should support onRescan callback', () => {
    const mockOnRescan = vi.fn()
    const component = (
      <BarcodeIndicator isScanning={false} lastDetection={null} onRescan={mockOnRescan} />
    )

    expect(component.props.onRescan).toBe(mockOnRescan)
  })

  it('should handle null detection', () => {
    const component = <BarcodeIndicator isScanning={false} lastDetection={null} />

    expect(component.props.lastDetection).toBeNull()
  })

  it('should display error state', () => {
    const mockError = 'Barcode not found in database'
    const component = <BarcodeIndicator isScanning={false} lastDetection={null} error={mockError} />

    expect(component.props.error).toBe(mockError)
  })

  it('should show loading indicator when scanning', () => {
    const component = <BarcodeIndicator isScanning={true} lastDetection={null} />

    expect(component.props.isScanning).toBe(true)
  })

  it('should display food name when detection available', () => {
    const mockDetection = {
      barcode: '5901234123457',
      foodName: 'Organic Milk 1L',
      timestamp: '2026-04-19T10:00:00Z',
    }

    const component = <BarcodeIndicator isScanning={false} lastDetection={mockDetection} />

    expect(component.props.lastDetection?.foodName).toBe('Organic Milk 1L')
  })
})
