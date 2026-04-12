// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { PTCharacter3D } from '../PTCharacter3D'

vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="r3f-canvas">{children}</div>
  ),
  useFrame: vi.fn(),
}))

describe('PTCharacter3D', () => {
  const defaultParams = {
    bmi: 22,
    muscleLevel: 0,
    heightNorm: 1.0,
    gender: 'male' as const,
    fitnessLevel: 'beginner' as const,
    updatedAt: '',
  }

  it('renders without crashing with default params', () => {
    const { getByTestId } = render(
      <PTCharacter3D morphParams={defaultParams} exerciseSlug="idle" isActive={false} />
    )
    expect(getByTestId('r3f-canvas')).toBeTruthy()
  })

  it('accepts isActive=true without crashing', () => {
    const { getByTestId } = render(
      <PTCharacter3D morphParams={defaultParams} exerciseSlug="squat" isActive={true} />
    )
    expect(getByTestId('r3f-canvas')).toBeTruthy()
  })
})
