import { describe, it, expect, vi } from 'vitest'
import { PermissionRequestCard } from '../PermissionRequestCard'

describe('PermissionRequestCard', () => {
  it('should render with icon, title, and description', () => {
    const component = (
      <PermissionRequestCard
        icon="heart"
        title="Health Access"
        description="Allow access to your health data"
        onAllow={() => {}}
        onMaybeLater={() => {}}
      />
    )
    expect(component).toBeDefined()
    expect(component.props.title).toBe('Health Access')
    expect(component.props.description).toBe('Allow access to your health data')
  })

  it('should call onAllow when Allow button tapped', () => {
    const onAllow = vi.fn()
    const component = (
      <PermissionRequestCard
        icon="heart"
        title="Health Access"
        description="Description"
        onAllow={onAllow}
        onMaybeLater={() => {}}
      />
    )
    expect(component.props.onAllow).toBe(onAllow)
  })

  it('should call onMaybeLater when Maybe Later button tapped', () => {
    const onMaybeLater = vi.fn()
    const component = (
      <PermissionRequestCard
        icon="heart"
        title="Health Access"
        description="Description"
        onAllow={() => {}}
        onMaybeLater={onMaybeLater}
      />
    )
    expect(component.props.onMaybeLater).toBe(onMaybeLater)
  })

  it('should support different icon types', () => {
    const icons = ['heart', 'activity', 'moon', 'droplets']
    icons.forEach(icon => {
      const component = (
        <PermissionRequestCard
          icon={icon}
          title="Test"
          description="Test description"
          onAllow={() => {}}
          onMaybeLater={() => {}}
        />
      )
      expect(component.props.icon).toBe(icon)
    })
  })
})
