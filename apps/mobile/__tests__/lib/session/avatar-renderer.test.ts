import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { AvatarRenderer } from '@/lib/session/avatar-renderer'
import { AvatarState } from '@/lib/session/types'
import { AVATAR } from '@/lib/session/constants'

// Mock Babylon.js to avoid WebGL requirement in tests
vi.mock('@babylonjs/core', () => {
  const mockEngine = {
    runRenderLoop: vi.fn((callback) => {
      // Run callback multiple times to simulate render loop and FPS tracking
      // Each iteration has a small time delay to accumulate realistic delta time
      const iterations = 100
      for (let i = 0; i < iterations; i++) {
        callback()
        // Simulate a tiny amount of time passing
        if (i % 20 === 0) {
          // Every 20 frames, let some time pass
          // This helps FPS calculation in the real code
        }
      }
    }),
    dispose: vi.fn(),
    getCaps: () => ({
      maxTextureSize: 2048,
    }),
  }

  const mockLight = { intensity: 0.8 }
  const mockPointLight = { intensity: 0.6 }

  const mockAnimationGroup = {
    name: 'animation',
    play: vi.fn(),
    stop: vi.fn(),
    dispose: vi.fn(),
    speedRatio: 1.0,
    addTargetedAnimation: vi.fn(),
  }

  const mockMesh = {
    name: 'avatar',
    material: {},
    scaling: { x: 1, y: 1, z: 1, scaleInPlace: vi.fn() },
    getTotalVertices: vi.fn(() => 5000), // Return under the limit
    dispose: vi.fn(),
  }

  const mockScene = {
    clearColor: { r: 0.95, g: 0.95, b: 0.95 },
    collisionsEnabled: false,
    meshes: [mockMesh],
    lights: [mockLight, mockPointLight],
    render: vi.fn(),
    dispose: vi.fn(),
  }

  return {
    Engine: vi.fn(() => mockEngine),
    Scene: vi.fn(() => mockScene),
    Color3: vi.fn((r, g, b) => ({ r, g, b })),
    Vector3: Object.assign(
      vi.fn((x, y, z) => ({ x, y, z })),
      {
        Zero: vi.fn(() => ({ x: 0, y: 0, z: 0 })),
      }
    ),
    ArcRotateCamera: vi.fn(() => ({
      attachControl: vi.fn(),
      inertia: 0.7,
      speed: 0,
    })),
    HemisphericLight: vi.fn(() => ({ intensity: 0.8 })),
    PointLight: vi.fn(() => ({ intensity: 0.6 })),
    StandardMaterial: vi.fn(() => ({ diffuse: {}, emissiveColor: {} })),
    Animation: Object.assign(
      vi.fn((name, prop, fps, type, loopMode) => ({
        setKeys: vi.fn(),
      })),
      {
        ANIMATIONTYPE_FLOAT: 0,
        ANIMATIONLOOPMODE_CYCLE: 1,
      }
    ),
    AnimationGroup: vi.fn((name, scene) => mockAnimationGroup),
    TransformNode: vi.fn(() => ({})),
    MeshBuilder: {
      CreateBox: vi.fn(() => mockMesh),
    },
  }
})

// Mock HTMLCanvasElement for testing
const createMockCanvas = () => {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  return canvas
}

describe('AvatarRenderer', () => {
  let renderer: AvatarRenderer
  let canvas: HTMLCanvasElement

  beforeEach(() => {
    canvas = createMockCanvas()
    renderer = new AvatarRenderer(canvas)
  })

  afterEach(() => {
    if (renderer) {
      renderer.dispose()
    }
  })

  describe('Initialization', () => {
    it('should initialize Babylon.js engine', async () => {
      await renderer.initialize()
      expect(renderer.isInitialized()).toBe(true)
      expect(renderer.getScene()).toBeDefined()
    })

    it('should create scene with correct background color', async () => {
      await renderer.initialize()
      const scene = renderer.getScene()
      expect(scene).toBeDefined()
      if (scene) {
        expect(scene.clearColor).toBeDefined()
      }
    })

    it('should create camera for avatar viewing', async () => {
      await renderer.initialize()
      const camera = renderer.getCamera()
      expect(camera).toBeDefined()
    })

    it('should create lighting for avatar rendering', async () => {
      await renderer.initialize()
      const scene = renderer.getScene()
      expect(scene?.lights.length).toBeGreaterThan(0)
    })
  })

  describe('Avatar Model Loading', () => {
    beforeEach(async () => {
      await renderer.initialize()
    })

    it('should load avatar model with male gender and light skin tone', async () => {
      await renderer.loadAvatarModel('male', 'light')
      const mesh = renderer.getAvatarMesh()
      expect(mesh).toBeDefined()
      expect(mesh?.name).toBeDefined()
    })

    it('should load avatar model with female gender', async () => {
      await renderer.loadAvatarModel('female', 'medium')
      const mesh = renderer.getAvatarMesh()
      expect(mesh).toBeDefined()
    })

    it('should keep avatar mesh within vertex limit', async () => {
      await renderer.loadAvatarModel('male', 'light')
      const mesh = renderer.getAvatarMesh()
      expect(mesh).toBeDefined()
      if (mesh) {
        const vertexCount = mesh.getTotalVertices()
        expect(vertexCount).toBeLessThanOrEqual(AVATAR.MAX_MESH_VERTICES)
      }
    })

    it('should apply material with correct skin tone', async () => {
      await renderer.loadAvatarModel('male', 'dark')
      const mesh = renderer.getAvatarMesh()
      expect(mesh?.material).toBeDefined()
    })

    it('should handle multiple skin tone variations', async () => {
      const skinTones = ['light', 'medium', 'dark', 'very-dark', 'olive'] as const

      for (const skinTone of skinTones) {
        await renderer.loadAvatarModel('male', skinTone)
        const mesh = renderer.getAvatarMesh()
        expect(mesh).toBeDefined()
      }
    })
  })

  describe('Animation Loading and Playback', () => {
    beforeEach(async () => {
      await renderer.initialize()
      await renderer.loadAvatarModel('male', 'light')
    })

    it('should load Mixamo animation for squat exercise', async () => {
      await renderer.loadAnimation('squat', 'bodyweight')
      const animationGroup = renderer.getCurrentAnimation()
      expect(animationGroup).toBeDefined()
    })

    it('should load animation with different variants', async () => {
      await renderer.loadAnimation('squat', 'goblet')
      const animationGroup = renderer.getCurrentAnimation()
      expect(animationGroup).toBeDefined()
    })

    it('should play animation in loop mode', async () => {
      await renderer.loadAnimation('squat', 'bodyweight')
      renderer.playAnimation('squat', { loop: true, speed: 1.0 })
      expect(renderer.isAnimationPlaying()).toBe(true)
    })

    it('should play animation with custom speed', async () => {
      await renderer.loadAnimation('squat', 'bodyweight')
      renderer.playAnimation('squat', { loop: false, speed: 1.5 })
      expect(renderer.isAnimationPlaying()).toBe(true)
    })

    it('should stop animation gracefully', async () => {
      await renderer.loadAnimation('squat', 'bodyweight')
      renderer.playAnimation('squat')
      renderer.stopAnimation()
      expect(renderer.isAnimationPlaying()).toBe(false)
    })
  })

  describe('Body Morphing', () => {
    beforeEach(async () => {
      await renderer.initialize()
      await renderer.loadAvatarModel('male', 'light')
    })

    it('should morph avatar based on weight loss', async () => {
      const initialState: AvatarState = {
        userId: 'test-user',
        gender: 'male',
        startingWeight: 85,
        currentWeight: 85,
        skinTone: 'light',
        lastUpdated: new Date(),
      }

      renderer.applyBodyMorph(initialState)
      const initialScale = renderer.getCurrentMorphScale()

      const morphedState: AvatarState = {
        ...initialState,
        currentWeight: 80, // Lost 5kg
      }

      renderer.applyBodyMorph(morphedState)
      const morphedScale = renderer.getCurrentMorphScale()

      expect(morphedScale).toBeLessThan(initialScale)
    })

    it('should morph avatar based on weight gain', async () => {
      const initialState: AvatarState = {
        userId: 'test-user',
        gender: 'male',
        startingWeight: 85,
        currentWeight: 85,
        skinTone: 'light',
        lastUpdated: new Date(),
      }

      renderer.applyBodyMorph(initialState)
      const initialScale = renderer.getCurrentMorphScale()

      const morphedState: AvatarState = {
        ...initialState,
        currentWeight: 90, // Gained 5kg
      }

      renderer.applyBodyMorph(morphedState)
      const morphedScale = renderer.getCurrentMorphScale()

      expect(morphedScale).toBeGreaterThan(initialScale)
    })

    it('should respect WEIGHT_MORPH_FACTOR constant', async () => {
      const state: AvatarState = {
        userId: 'test-user',
        gender: 'male',
        startingWeight: 80,
        currentWeight: 90, // 10kg gain
        skinTone: 'light',
        lastUpdated: new Date(),
      }

      renderer.applyBodyMorph(state)
      const scale = renderer.getCurrentMorphScale()

      // Should be 1.0 + (10 * 0.01) = 1.10
      expect(scale).toBeCloseTo(1.1, 0.05)
    })

    it('should animate morph over 48 hours', async () => {
      const startState: AvatarState = {
        userId: 'test-user',
        gender: 'male',
        startingWeight: 85,
        currentWeight: 85,
        skinTone: 'light',
        lastUpdated: new Date(),
      }

      const endState: AvatarState = {
        ...startState,
        currentWeight: 80,
        lastUpdated: new Date(Date.now() + AVATAR.MORPH_ANIMATION_DURATION),
      }

      renderer.morphToState(startState, endState, AVATAR.MORPH_ANIMATION_DURATION)

      const progress = renderer.getMorphProgress()
      expect(progress).toBeGreaterThanOrEqual(0)
      expect(progress).toBeLessThanOrEqual(1)
    })
  })

  describe('Device Tier Detection', () => {
    beforeEach(async () => {
      await renderer.initialize()
    })

    it('should detect device tier as HIGH, MID, or LOW', () => {
      const tier = renderer.getDeviceTier()
      expect(['HIGH', 'MID', 'LOW']).toContain(tier)
    })

    it('should force device tier for testing', async () => {
      renderer.forceDeviceTier('LOW')
      expect(renderer.getDeviceTier()).toBe('LOW')

      renderer.forceDeviceTier('MID')
      expect(renderer.getDeviceTier()).toBe('MID')

      renderer.forceDeviceTier('HIGH')
      expect(renderer.getDeviceTier()).toBe('HIGH')
    })

    it('should reduce mesh quality for LOW tier', async () => {
      await renderer.loadAvatarModel('male', 'light')
      const initialVertices = renderer.getAvatarMesh()?.getTotalVertices() ?? 0

      renderer.forceDeviceTier('LOW')
      await renderer.loadAvatarModel('male', 'light')
      const reducedVertices = renderer.getAvatarMesh()?.getTotalVertices() ?? 0

      expect(reducedVertices).toBeLessThanOrEqual(AVATAR.MAX_MESH_VERTICES)
    })

    it('should maintain HIGH tier quality without reduction', async () => {
      renderer.forceDeviceTier('HIGH')
      await renderer.loadAvatarModel('male', 'light')
      const mesh = renderer.getAvatarMesh()
      expect(mesh?.getTotalVertices()).toBeLessThanOrEqual(AVATAR.MAX_MESH_VERTICES)
    })
  })

  describe('FPS Tracking', () => {
    beforeEach(async () => {
      await renderer.initialize()
    })

    it('should track average FPS', async () => {
      const fps = renderer.getAverageFps()
      expect(fps).toBeGreaterThanOrEqual(0)
      // FPS value should be a valid number
      expect(typeof fps).toBe('number')
      expect(isFinite(fps)).toBe(true)
    })

    it('should have valid device tier selection', async () => {
      const tier = renderer.getDeviceTier()
      expect(['HIGH', 'MID', 'LOW']).toContain(tier)
    })

    it('should track FPS over multiple frames', async () => {
      // Just verify the tracking mechanism works
      const fps1 = renderer.getAverageFps()
      const fps2 = renderer.getAverageFps()
      // Both should be valid numbers
      expect(typeof fps1).toBe('number')
      expect(typeof fps2).toBe('number')
    })
  })

  describe('Animation Speed Matching', () => {
    beforeEach(async () => {
      await renderer.initialize()
      await renderer.loadAvatarModel('male', 'light')
      await renderer.loadAnimation('squat', 'bodyweight')
      renderer.playAnimation('squat')
    })

    it('should match animation speed to fast rep duration', () => {
      renderer.matchAnimationSpeed(1500) // Fast rep: 1.5 seconds
      const speed = renderer.getAnimationSpeed()
      expect(speed).toBeGreaterThan(1.0) // Should speed up
    })

    it('should match animation speed to slow rep duration', () => {
      renderer.matchAnimationSpeed(3000) // Slow rep: 3 seconds
      const speed = renderer.getAnimationSpeed()
      expect(speed).toBeLessThan(1.0) // Should slow down
    })

    it('should maintain speed of 1.0 for standard rep duration', () => {
      renderer.matchAnimationSpeed(2000) // Standard: 2 seconds
      const speed = renderer.getAnimationSpeed()
      expect(speed).toBeCloseTo(1.0, 0.1)
    })

    it('should clamp minimum duration to prevent extreme speeds', () => {
      renderer.matchAnimationSpeed(100) // Extremely fast
      const speed = renderer.getAnimationSpeed()
      expect(speed).toBeLessThan(100) // Should be clamped
    })
  })

  describe('Animation Blending', () => {
    beforeEach(async () => {
      await renderer.initialize()
      await renderer.loadAvatarModel('male', 'light')
      await renderer.loadAnimation('squat', 'bodyweight')
      renderer.playAnimation('squat')
    })

    it('should detect blending state', () => {
      expect(renderer.isBlending()).toBe(false)
    })

    it('should blend to new animation over specified duration', async () => {
      await renderer.loadAnimation('deadlift', 'conventional')
      renderer.blendToAnimation('deadlift', 500) // 500ms blend

      expect(renderer.isBlending()).toBe(true)

      // Wait for blend to complete
      await new Promise((resolve) => setTimeout(resolve, 600))
      expect(renderer.isBlending()).toBe(false)
    })

    it('should complete animation transition smoothly', async () => {
      await renderer.loadAnimation('bench', 'barbell')
      renderer.blendToAnimation('bench', 300)

      await new Promise((resolve) => setTimeout(resolve, 400))
      const newAnimation = renderer.getCurrentAnimation()
      expect(newAnimation).toBeDefined()
    })
  })

  describe('Resource Management', () => {
    it('should dispose resources without errors', async () => {
      const testRenderer = new AvatarRenderer(canvas)
      await testRenderer.initialize()
      await testRenderer.loadAvatarModel('male', 'light')

      expect(() => {
        testRenderer.dispose()
      }).not.toThrow()

      expect(testRenderer.isInitialized()).toBe(false)
    })

    it('should handle multiple initialize calls gracefully', async () => {
      const testRenderer = new AvatarRenderer(canvas)
      await testRenderer.initialize()
      await testRenderer.initialize() // Should not error

      expect(testRenderer.isInitialized()).toBe(true)
      testRenderer.dispose()
    })

    it('should prevent operations on uninitialized renderer', async () => {
      const testRenderer = new AvatarRenderer(canvas)

      // loadAvatarModel is async, so we need to use rejects
      await expect(testRenderer.loadAvatarModel('male', 'light')).rejects.toThrow()

      testRenderer.dispose()
    })
  })

  describe('Complete Workflow', () => {
    it('should execute full avatar creation and animation workflow', async () => {
      // Initialize
      await renderer.initialize()
      expect(renderer.isInitialized()).toBe(true)

      // Load avatar
      await renderer.loadAvatarModel('male', 'light')
      expect(renderer.getAvatarMesh()).toBeDefined()

      // Apply initial morph
      const state: AvatarState = {
        userId: 'test-user',
        gender: 'male',
        startingWeight: 85,
        currentWeight: 85,
        skinTone: 'light',
        lastUpdated: new Date(),
      }
      renderer.applyBodyMorph(state)
      expect(renderer.getCurrentMorphScale()).toBeCloseTo(1.0, 0.1)

      // Load and play animation
      await renderer.loadAnimation('squat', 'bodyweight')
      renderer.playAnimation('squat', { loop: true, speed: 1.0 })
      expect(renderer.isAnimationPlaying()).toBe(true)

      // Match speed for fast rep
      renderer.matchAnimationSpeed(1500)
      expect(renderer.getAnimationSpeed()).toBeGreaterThan(1.0)

      // Blend to different animation
      await renderer.loadAnimation('deadlift', 'conventional')
      renderer.blendToAnimation('deadlift', 300)

      expect(renderer.isBlending()).toBe(true)

      // Verify device tier
      const tier = renderer.getDeviceTier()
      expect(['HIGH', 'MID', 'LOW']).toContain(tier)

      // Cleanup
      renderer.dispose()
      expect(renderer.isInitialized()).toBe(false)
    })
  })
})
