import {
  Box3,
  BufferGeometry,
  Color,
  Group,
  InstancedMesh,
  Light,
  LoadingManager,
  Material,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  NeutralToneMapping,
  Raycaster,
  Object3D,
  PerspectiveCamera,
  Quaternion,
  RectAreaLight,
  Scene,
  Skeleton,
  Sphere,
  SRGBColorSpace,
  Texture,
  Vector2,
  Vector4,
  Vector3,
  WebGLRenderer,
  WebGLRenderTarget,
} from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import type { GLTF, GLTFParser } from 'three/addons/loaders/GLTFLoader.js'
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js'
import type { Project } from '../types/project'

export type DisplayMode = 'clay' | 'rendered' | 'wireframe'

export interface MetadataTicket {
  readonly requestId: number
  readonly modelId: string
}

export interface ViewerSelectionRequest {
  readonly requestId: number
  readonly model: Pick<Project, 'id' | 'modelUrl'>
  readonly direction: 'next' | 'previous' | null
  readonly activatedAtMs: number | null
}

export type ViewerStatus = {
  readonly requestId: number
  readonly requestedId: string
  readonly displayedId: string | null
} & (
  | { state: 'loading' | 'moving' | 'ready' }
  | { state: 'error' | 'unavailable'; message: string }
)

export interface ModelViewerController {
  select(request: ViewerSelectionRequest): void
  setMetadataReady(ticket: MetadataTicket, ready: boolean): void
  setMode(mode: DisplayMode): void
  setOrbitRadius?(radius: number): void
  getOrbitRadius?(): number
  dispose(): void
}

export interface ViewerOptions {
  readonly orbitRadius?: number
}
export type ViewerChannel = Pick<ModelViewerController, 'select' | 'setMetadataReady'>

export interface ViewerCallbacks {
  onStatus(status: ViewerStatus): void
  finalize(ticket: MetadataTicket): boolean
}

export interface ViewerAcceptanceHooks {
  failPreviewValidation?(modelId: string, mode: DisplayMode): boolean
  failCandidateValidation?(modelId: string, mode: DisplayMode): boolean
  onCandidatePreparation?(): void
  onCandidateValidated?(info: { requestId: number; modelId: string }): void
  onPresentationDrawn?(info: {
    requestId: number
    displayedId: string
    timestamp: number
    position: [number, number, number]
    scale: [number, number, number]
    progress: number | null
    participants: { modelId: string; position: [number, number, number]; scale: [number, number, number]; pose: [number, number] }[]
    phase: ViewerStatus['state']
  }): void
}

const FULL_TURN = Math.PI * 2
const KEY_TURN = Math.PI / 36

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

const DITHER_DISCARD_CHUNK = `
  if (uDitherFade < 0.999) {
    vec2 ditherCoord = floor(gl_FragCoord.xy / 2.0);
    int bx = int(mod(ditherCoord.x, 8.0));
    int by = int(mod(ditherCoord.y, 8.0));
    int bayer[64] = int[64](
       0, 32,  8, 40,  2, 34, 10, 42,
      48, 16, 56, 24, 50, 18, 58, 26,
      12, 44,  4, 36, 14, 46,  6, 38,
      60, 28, 52, 20, 62, 30, 54, 22,
       3, 35, 11, 43,  1, 33,  9, 41,
      51, 19, 59, 27, 49, 17, 57, 25,
      15, 47,  7, 39, 13, 45,  5, 37,
      63, 31, 55, 23, 61, 29, 53, 21
    );
    if (uDitherFade < float(bayer[by * 8 + bx]) / 64.0) discard;
  }
`

function attachDither(material: Material, uniform: { value: number }): void {
  material.customProgramCacheKey = () => 'portfolio-dither'
  const prevOnBeforeCompile = material.onBeforeCompile
  material.onBeforeCompile = (shader, rend) => {
    prevOnBeforeCompile?.(shader, rend)
    shader.uniforms.uDitherFade = uniform
    if (!shader.fragmentShader.includes('uDitherFade')) {
      shader.fragmentShader = `uniform float uDitherFade;\n` + shader.fragmentShader
      if (shader.fragmentShader.includes('#include <dithering_fragment>')) {
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <dithering_fragment>',
          `#include <dithering_fragment>\n${DITHER_DISCARD_CHUNK}`
        )
      } else {
        const lastBrace = shader.fragmentShader.lastIndexOf('}')
        if (lastBrace !== -1) {
          shader.fragmentShader = shader.fragmentShader.slice(0, lastBrace) + DITHER_DISCARD_CHUNK + '\n}'
        }
      }
    }
  }
}

function validateContainer(data: ArrayBuffer): void {
  if (data.byteLength < 20) throw new Error('The model is not a complete GLB file.')
  const view = new DataView(data)
  if (view.getUint32(0, true) !== 0x46546c67 || view.getUint32(4, true) !== 2) {
    throw new Error('The model must be a GLB 2.0 file.')
  }
  if (view.getUint32(8, true) !== data.byteLength || data.byteLength % 4 !== 0) {
    throw new Error('The GLB file has invalid length framing.')
  }
  let offset = 12
  let binarySeen = false
  while (offset < data.byteLength) {
    if (offset + 8 > data.byteLength) throw new Error('The GLB chunk header is incomplete.')
    const length = view.getUint32(offset, true)
    const type = view.getUint32(offset + 4, true)
    if (length % 4 !== 0 || offset + 8 + length > data.byteLength) {
      throw new Error('The GLB chunk has invalid length framing.')
    }
    if (offset === 12) {
      if (type !== 0x4e4f534a || length === 0) {
        throw new Error('The GLB file is missing its JSON chunk.')
      }
    } else if (type === 0x4e4f534a) {
      throw new Error('The GLB file contains multiple JSON chunks.')
    }
    if (type === 0x004e4942) {
      if (binarySeen) throw new Error('The GLB file contains multiple binary chunks.')
      binarySeen = true
    }
    offset += 8 + length
  }
}

function validateEmbeddedResources(parser: GLTFParser): void {
  const json = parser.json as {
    buffers?: readonly { uri?: unknown }[]
    images?: readonly { uri?: unknown }[]
  }
  for (const definitions of [json.buffers, json.images]) {
    for (const definition of definitions ?? []) {
      if (
        definition.uri !== undefined &&
        (typeof definition.uri !== 'string' || !/^data:/i.test(definition.uri))
      ) {
        throw new Error('This model references external resources. Use a self-contained GLB file.')
      }
    }
  }
}

// Ownership stays local to one parse, including dependencies that fulfill after retirement.
type LoadResources = {
  track(value: unknown): void
  instrument(parser: GLTFParser): void
  retire(): void
}

function createLoadResources(): LoadResources {
  const geometries = new Set<BufferGeometry>()
  const materials = new Set<Material>()
  const textures = new Set<Texture>()
  const skeletons = new Set<Skeleton>()
  const closedImages = new Set<ImageBitmap>()
  const disposedGeometries = new Set<BufferGeometry>()
  const instances = new Set<InstancedMesh>()
  const disposedMaterials = new Set<Material>()
  const disposedTextures = new Set<Texture>()
  const disposedSkeletons = new Set<Skeleton>()
  let retired = false

  const disposedInstances = new Set<InstancedMesh>()
  function closeImage(image: unknown): void {
    if (Array.isArray(image)) {
      for (const entry of image) closeImage(entry)
    } else if (typeof ImageBitmap !== 'undefined' && image instanceof ImageBitmap) {
      if (!closedImages.has(image)) {
        closedImages.add(image)
        image.close()
      }
    }
  }

  function releaseTexture(texture: Texture): void {
    if (disposedTextures.has(texture)) return
    disposedTextures.add(texture)
    texture.dispose()
    closeImage(texture.source.data)
  }

  function release(): void {
    for (const geometry of geometries) {
      if (!disposedGeometries.has(geometry)) {
        disposedGeometries.add(geometry)
        geometry.dispose()
      }
    }
    for (const material of materials) {
      if (!disposedMaterials.has(material)) {
        disposedMaterials.add(material)
        material.dispose()
      }
    }
    for (const skeleton of skeletons) {
      // A bone texture may have been allocated by the first draw, after tracking.
      const texture = skeleton.boneTexture
      if (texture) {
        textures.add(texture)
        releaseTexture(texture)
        skeleton.boneTexture = null
      }
      if (!disposedSkeletons.has(skeleton)) {
        disposedSkeletons.add(skeleton)
        skeleton.dispose()
      }
    }
    for (const instance of instances) {
      if (disposedInstances.has(instance)) continue
      disposedInstances.add(instance)
      if (instance.morphTexture) {
        textures.add(instance.morphTexture)
        releaseTexture(instance.morphTexture)
        instance.morphTexture = null
      }
      instance.dispose()
    }
    for (const texture of textures) releaseTexture(texture)
  }

  function trackMaterial(material: Material): void {
    materials.add(material)
    for (const value of Object.values(material)) {
      if (value instanceof Texture) textures.add(value)
    }
  }

  function trackObject(root: Object3D): void {
    root.traverse((object) => {
      const renderable = object as Object3D & {
        geometry?: BufferGeometry
        material?: Material | Material[]
        skeleton?: Skeleton
      }
      if (renderable.geometry) geometries.add(renderable.geometry)
      if (Array.isArray(renderable.material)) {
        for (const material of renderable.material) trackMaterial(material)
      } else if (renderable.material) {
        trackMaterial(renderable.material)
      }
      if (object instanceof InstancedMesh) instances.add(object)
      if (renderable.skeleton) skeletons.add(renderable.skeleton)
    })
  }

  function track(value: unknown): void {
    if (value instanceof Object3D) trackObject(value)
    else if (value instanceof BufferGeometry) geometries.add(value)
    else if (value instanceof Material) trackMaterial(value)
    else if (value instanceof Texture) textures.add(value)
    else if (value instanceof Skeleton) skeletons.add(value)
    else if (Array.isArray(value)) {
      for (const entry of value) track(entry)
    }
    if (retired) release()
  }

  function instrument(parser: GLTFParser): void {
    const dependency = parser.getDependency.bind(parser)
    parser.getDependency = (type, index) => dependency(type, index).then((value: unknown) => {
      track(value)
      return value
    })

    const imageSource = parser.loadImageSource.bind(parser)
    parser.loadImageSource = (index, loader) => imageSource(index, loader).then((texture) => {
      track(texture)
      return texture
    })

    // Track each fulfilled primitive, not only the aggregate that can reject early.
    const loadGeometries = parser.loadGeometries.bind(parser)
    parser.loadGeometries = (primitives) => Promise.all(primitives.map((primitive) =>
      loadGeometries([primitive]).then((result) => {
        track(result)
        return result[0]
      }),
    ))

    const assignMaterial = parser.assignFinalMaterial.bind(parser)
    parser.assignFinalMaterial = (mesh) => {
      // Includes the implicit default material as well as loader-created clones.
      track(mesh)
      assignMaterial(mesh)
      track(mesh)
    }
  }

  return {
    track,
    instrument,
    retire() {
      retired = true
      release()
    },
  }
}

type LoadContext = {
  requestId: number
  modelId: string
  abort: AbortController
  manager: LoadingManager
  resources: LoadResources
  resourceError: boolean
  result: GLTF | null
  presentation: Group | null
  rotation: Group | null
  yaw: number
  pitch: number
  savedYaw: number | null
  savedPitch: number
  validated: Record<DisplayMode, 'unvalidated' | 'valid' | 'failed'>
  lastAnimationTimeMs: number
  retired: boolean
  error: string | null
  ditherFade: number
  ditherTarget: number
  ditherUniform: { value: number }
}

const contextOwners = new WeakMap<HTMLCanvasElement, WebGLRenderer>()

export function createModelViewer(canvas: HTMLCanvasElement, projects: readonly Pick<Project, 'id' | 'modelUrl'>[], callbacks: ViewerCallbacks, acceptance?: ViewerAcceptanceHooks, options?: ViewerOptions): ModelViewerController {
  const rawGl = canvas.getContext('webgl2', { alpha: true, antialias: true })
  if (!rawGl) throw new Error('WebGL 2 is unavailable in this browser.')
  const gl = rawGl
  let renderer: WebGLRenderer
  try {
    RectAreaLightUniformsLib.init()
    renderer = new WebGLRenderer({ canvas, context: gl, alpha: true, antialias: true })
    renderer.outputColorSpace = SRGBColorSpace
    renderer.toneMapping = NeutralToneMapping
    renderer.toneMappingExposure = 1
    renderer.setClearColor(0x000000, 0)
    renderer.debug.onShaderError = () => { throw new Error('The model could not be drawn by this graphics device.') }
  } catch (error) {
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    throw error
  }
  contextOwners.set(canvas, renderer)
  const scene = new Scene()
  const camera = new PerspectiveCamera(35, 1, 0.1, 10)
  const key = new RectAreaLight(0xffffff, 8, 3, 4)
  key.position.set(3, 3, 4)
  key.lookAt(0, 0, 0)
  const fill = new RectAreaLight(0xffffff, 3, 4, 4)
  fill.position.set(-3, 1, 2)
  fill.lookAt(0, 0, 0)
  const rim = new RectAreaLight(0xffffff, 10, 2, 3)
  rim.position.set(2, 2, -3)
  rim.lookAt(0, 0, 0)
  scene.add(key, fill, rim)
  const bounds = new Box3()
  const sphere = new Sphere()
  const validationTarget = new WebGLRenderTarget(64, 64)
  const savedViewport = new Vector4()
  const savedScissor = new Vector4()
  const savedClearColor = new Color()
  const raycaster = new Raycaster()
  const pointer = new Vector2()
  const xAxis = new Vector3(1, 0, 0)
  const yAxis = new Vector3(0, 1, 0)
  const qX = new Quaternion()
  const qY = new Quaternion()
  const previousTouchAction = canvas.style.touchAction
  canvas.style.touchAction = 'none'

  let disposed = false
  let released = false
  let terminalError: string | null = null
  let selection: { request: ViewerSelectionRequest; deadlineAtMs: number | null } | null = null
  let ticket: MetadataTicket | null = null
  let displayed: LoadContext | null = null
  let candidate: LoadContext | null = null
  const catalog = new Map<string, LoadContext>()
  type Slot = 'center' | 'left' | 'right'
  const slotTransforms: Record<Slot, { x: number; z: number; scale: number }> = {
    center: { x: 0, z: 0, scale: 1 },
    left: { x: -1.6, z: -1.2, scale: 0.62 },
    right: { x: 1.6, z: -1.2, scale: 0.62 },
  }
  let orbitRadius = options?.orbitRadius ?? 1.0
  const sharedDitherUniform = { value: 1.0 }

  function assignments(center: LoadContext): Map<LoadContext, Slot> {
    const slots = new Map<LoadContext, Slot>([[center, 'center']])
    const index = projects.findIndex(project => project.id === center.modelId)
    if (index < 0 || projects.length < 2) return slots
    const right = catalog.get(projects[(index + 1) % projects.length].id)
    if (right && right !== center) slots.set(right, 'right')
    if (projects.length > 2) {
      const left = catalog.get(projects[(index + projects.length - 1) % projects.length].id)
      if (left && left !== center && left !== right) slots.set(left, 'left')
    }
    return slots
  }

  function setSlot(load: LoadContext, slot: Slot): void {
    if (!load.presentation) return
    const transform = slotTransforms[slot]
    load.presentation.position.set(transform.x, 0, transform.z)
    load.presentation.scale.setScalar(transform.scale)
  }
  let metadataReady = false
  let phase: ViewerStatus['state'] = 'loading'
  let frame: number | null = null
  let moving = false
  let moveStartedAtAnimationMs = 0
  let moveDurationMs = 0
  let moveDirection = 0
  type TransitionParticipant = {
    load: LoadContext
    from: { x: number; z: number; scale: number }
    to: { x: number; z: number; scale: number }
    startSlot: Slot | undefined
    endSlot: Slot | undefined
    yaw: number
    pitch: number
  }
  let participants: TransitionParticipant[] = []
  let width = 0
  let height = 0
  let measureDirty = true
  let animationElapsedMs = 0
  let segmentStartedAtMs: number | null = null
  let intersecting = true
  let focused = document.hasFocus()
  const motionPreference = matchMedia('(prefers-reduced-motion: reduce)')
  let mode: DisplayMode = 'rendered'
  let clay: MeshStandardMaterial | null = null
  let wireframe: MeshBasicMaterial | null = null
  let lastDrawTimeMs: number | null = null
  let pointerId: number | null = null
  let pointerX = 0
  let pointerY = 0

  const activeControllers = new Set<number | 'keyboard'>()
  let returning = false
  let returnStartedAtMs = 0
  let returnFromYaw = 0
  let returnFromPitch = 0
  let returnDeltaYaw = 0
  let returnDeltaPitch = 0

  function applyRotation(load: LoadContext): void {
    if (!load.rotation) return
    load.yaw %= FULL_TURN
    load.pitch %= FULL_TURN
    qX.setFromAxisAngle(xAxis, load.pitch)
    qY.setFromAxisAngle(yAxis, load.yaw)
    load.rotation.quaternion.copy(qX).multiply(qY)
  }

  function restoreInspection(load: LoadContext, animationNow: number): void {
    if (load.savedYaw === null) return
    load.yaw = load.savedYaw
    load.pitch = load.savedPitch
    load.savedYaw = null
    returning = false
    load.lastAnimationTimeMs = animationNow
    applyRotation(load)
  }

  function shortestDelta(from: number, to: number): number {
    const difference = to - from
    const delta = Math.atan2(Math.sin(difference), Math.cos(difference))
    return Math.abs(Math.abs(delta) - Math.PI) < 1e-12 ? Math.PI : delta
  }

  function beginReturn(): void {
    const load = displayed
    if (!load || load.savedYaw === null || activeControllers.size !== 0 || phase !== 'ready') return
    returnStartedAtMs = animationTime(performance.now())
    returnFromYaw = load.yaw
    returnFromPitch = load.pitch
    returnDeltaYaw = shortestDelta(load.yaw, load.savedYaw)
    returnDeltaPitch = shortestDelta(load.pitch, load.savedPitch)
    returning = true
    if (motionPreference.matches || (returnDeltaYaw === 0 && returnDeltaPitch === 0)) restoreInspection(load, returnStartedAtMs)
    if (eligible()) invalidate()
  }

  function acquireController(key: number | 'keyboard'): void {
    const load = displayed
    if (!load || phase !== 'ready' || activeControllers.has(key)) return
    if (load.savedYaw === null) {
      load.savedYaw = load.yaw
      load.savedPitch = load.pitch
    }
    returning = false
    load.lastAnimationTimeMs = animationTime(performance.now())
    activeControllers.add(key)
  }

  function releaseController(key: number | 'keyboard'): void {
    if (!activeControllers.delete(key)) return
    if (activeControllers.size === 0) beginReturn()
  }

  function clearInspection(): void {
    returning = false
    activeControllers.clear()
    endGesture()
  }

  function alive(load: LoadContext): boolean {
    return !disposed && !released && !terminalError && !load.retired
  }

  function emit(state: ViewerStatus['state'], message?: string): void {
    phase = state
    if (!selection) return
    const identity = {
      requestId: selection.request.requestId,
      requestedId: selection.request.model.id,
      displayedId: displayed?.modelId ?? null,
    }
    if (state === 'error' || state === 'unavailable') callbacks.onStatus({ ...identity, state, message: message ?? 'The model is unavailable.' })
    else callbacks.onStatus({ ...identity, state })
  }

  function endGesture(): void {
    const id = pointerId
    pointerId = null
    if (id !== null) releaseController(id)
    if (id !== null && canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id)
  }

  function retire(load: LoadContext): void {
    if (load.retired) return
    load.retired = true
    load.abort.abort()
    load.manager.abort()
    load.presentation?.removeFromParent()
    load.presentation = null
    load.rotation = null
    if (load.result) load.resources.track(load.result.scenes)
    load.resources.retire()
    load.result = null
  }

  function cancelFrame(): void {
    if (frame !== null) cancelAnimationFrame(frame)
    frame = null
  }

  function clearSurface(): void {
    if (!released && !gl.isContextLost()) renderer.clear()
  }

  function fail(load: LoadContext, error: unknown): void {
    if (!alive(load)) return
    load.error = error instanceof Error ? error.message : 'The model could not be loaded.'
    const selected = candidate === load || displayed === load
    retire(load)
    if (!selected) return
    cancelFrame()
    clearInspection()
    if (candidate?.presentation) candidate.presentation.visible = false
    if (displayed?.presentation) displayed.presentation.visible = false
    candidate = null
    displayed = null
    moving = false
    clearSurface()
    emit('error', load.error)
  }

  function applyMode(): void {
    if (mode === 'rendered') scene.overrideMaterial = null
    else if (mode === 'clay') {
      if (!clay) {
        clay = new MeshStandardMaterial({ color: 0xbcbcbc, roughness: 0.85, metalness: 0 })
        attachDither(clay, sharedDitherUniform)
      }
      scene.overrideMaterial = clay
    } else {
      if (!wireframe) {
        wireframe = new MeshBasicMaterial({ color: 0xebebeb, wireframe: true })
        attachDither(wireframe, sharedDitherUniform)
      }
      scene.overrideMaterial = wireframe
    }
  }

  function measure(): boolean {
    if (!measureDirty) return width > 0 && height > 0
    measureDirty = false
    const rect = canvas.getBoundingClientRect()
    width = rect.width
    height = rect.height
    if (!(width > 0 && height > 0)) return false
    const cssVar = getComputedStyle(canvas).getPropertyValue('--orbit-radius') ||
                   getComputedStyle(canvas).getPropertyValue('--carousel-orbit-radius')
    const parsedCss = parseFloat(cssVar)
    const rawOrbit = Number.isFinite(parsedCss) && parsedCss > 0 ? parsedCss : orbitRadius
    // On narrow screens (mobile), scale the effective orbit with available width
    // so previews never collide with navigation buttons even with a large orbit setting.
    const maxOrbitForWidth = 1.0 + 1.5 * Math.max(0, Math.min(1, (width - 375) / 500))
    const effectiveOrbit = Math.min(rawOrbit, maxOrbitForWidth)
    const baseSideOffset = 1.1 + 0.5 * Math.max(0, Math.min(1, (width - 335) / 400))
    const sideOffset = baseSideOffset * effectiveOrbit
    const depth = 1.2 * effectiveOrbit
    const rearDepth = 2.4 * effectiveOrbit
    slotTransforms.left.x = -sideOffset
    slotTransforms.left.z = -depth
    slotTransforms.right.x = sideOffset
    slotTransforms.right.z = -depth
    for (const part of participants) {
      part.from.x = part.startSlot ? slotTransforms[part.startSlot].x : moveDirection * sideOffset
      part.from.z = part.startSlot ? slotTransforms[part.startSlot].z : -rearDepth
      part.to.x = part.endSlot ? slotTransforms[part.endSlot].x : -moveDirection * sideOffset
      part.to.z = part.endSlot ? slotTransforms[part.endSlot].z : -rearDepth
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    const verticalHalfFov = camera.fov * Math.PI / 360
    const horizontalHalfFov = Math.atan(Math.tan(verticalHalfFov) * camera.aspect)
    const distance = Math.max(1 + (2.22 * effectiveOrbit) / (Math.tan(horizontalHalfFov) * 0.82),
      1 + (1.0 * effectiveOrbit) / (Math.tan(verticalHalfFov) * 0.9))
    camera.position.set(0, 0, distance)
    camera.near = Math.max(0.01, distance - 1.1)
    camera.far = distance + rearDepth + 1.2
    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix()
    return true
  }
  function eligible(): boolean {
    return !disposed && !released && document.visibilityState !== 'hidden' && intersecting && focused && width > 0 && height > 0
  }

  function animationTime(now: number): number {
    if (segmentStartedAtMs !== null) animationElapsedMs += now - segmentStartedAtMs
    segmentStartedAtMs = eligible() ? now : null
    return animationElapsedMs
  }

  function render(validate = false): void {
    renderer.render(scene, camera)
    if (gl.isContextLost()) throw new Error('The graphics context was lost.')
    if (validate && (gl.getError() !== gl.NO_ERROR || renderer.info.render.calls === 0)) {
      throw new Error('The model could not be drawn by this graphics device.')
    }
  }

  function validate(load: LoadContext, preview = false): boolean {
    if (!load.presentation || load.validated[mode] === 'failed') return false
    if (load.validated[mode] === 'valid') return true
    const target = renderer.getRenderTarget()
    renderer.getViewport(savedViewport)
    renderer.getScissor(savedScissor)
    const scissorTest = renderer.getScissorTest()
    renderer.getClearColor(savedClearColor)
    const clearAlpha = renderer.getClearAlpha()
    const autoClear = renderer.autoClear
    const override = scene.overrideMaterial
    const states = Array.from(catalog.values(), entry => ({
      entry,
      visible: entry.presentation?.visible ?? false,
    }))
    const position = load.presentation.position.clone()
    const scale = load.presentation.scale.clone()
    const savedFade = load.ditherUniform.value
    load.ditherUniform.value = 1.0
    sharedDitherUniform.value = 1.0
    try {
      if (import.meta.env.MODE === 'acceptance' && preview && acceptance?.failPreviewValidation?.(load.modelId, mode)) {
        throw new Error('Preview validation failed.')
      }
      if (import.meta.env.MODE === 'acceptance' && !preview && load === candidate && acceptance?.failCandidateValidation?.(load.modelId, mode)) {
        throw new Error('Candidate validation failed.')
      }
      for (const { entry } of states) if (entry.presentation) entry.presentation.visible = entry === load
      setSlot(load, 'center')
      renderer.setRenderTarget(validationTarget)
      renderer.setViewport(0, 0, 64, 64)
      renderer.setScissor(0, 0, 64, 64)
      renderer.setScissorTest(false)
      renderer.autoClear = true
      applyMode()
      render(true)
      load.validated[mode] = 'valid'
      return true
    } catch (error) {
      if (gl.isContextLost()) throw error
      load.validated[mode] = 'failed'
      return false
    } finally {
      load.presentation.position.copy(position)
      load.presentation.scale.copy(scale)
      load.ditherUniform.value = savedFade
      for (const { entry, visible } of states) if (entry.presentation) entry.presentation.visible = visible
      scene.overrideMaterial = override
      renderer.setRenderTarget(target)
      renderer.setViewport(savedViewport)
      renderer.setScissor(savedScissor)
      renderer.setScissorTest(scissorTest)
      renderer.setClearColor(savedClearColor, clearAlpha)
      renderer.autoClear = autoClear
    }
  }

  function restStage(center: LoadContext): void {
    const slots = assignments(center)
    for (const load of catalog.values()) {
      load.ditherTarget = 1.0
      const presentation = load.presentation
      if (!presentation) continue
      const slot = slots.get(load)
      presentation.visible = !!slot && alive(load) && (load === center || validate(load, true))
      if (!presentation.visible || !slot) continue
      setSlot(load, slot)
      if (load !== center) {
        load.yaw = 0
        load.pitch = 0
        applyRotation(load)
      }
    }
  }

  function drawStage(center: LoadContext, progress: number | null, report = true): void {
    sharedDitherUniform.value = center.ditherUniform.value
    try {
      render(true)
    } catch (error) {
      if (gl.isContextLost()) throw error
      // A combined draw cannot identify the failing object. Revalidate each
      // visible participant separately before attributing the failure.
      let removed = false
      for (const load of catalog.values()) {
        if (!load.presentation?.visible) continue
        load.validated[mode] = 'unvalidated'
        if (!validate(load, load !== center)) {
          if (load === center) throw error
          load.presentation.visible = false
          removed = true
        }
      }
      if (!removed) throw error
      render(true)
    }
    if (report) reportStage(center, progress)
  }

  function reportStage(center: LoadContext, progress: number | null): void {
    if (import.meta.env.MODE === 'acceptance' && acceptance?.onPresentationDrawn && center.presentation && selection) {
      const p = center.presentation
      acceptance.onPresentationDrawn({
        requestId: selection.request.requestId, displayedId: center.modelId, timestamp: performance.now(),
        position: [p.position.x, p.position.y, p.position.z],
        scale: [p.scale.x, p.scale.y, p.scale.z], phase, progress,
        participants: Array.from(catalog.values()).filter(load => load.presentation?.visible).map(load => {
          const object = load.presentation!
          return { modelId: load.modelId, position: [object.position.x, object.position.y, object.position.z] as [number, number, number],
            scale: [object.scale.x, object.scale.y, object.scale.z] as [number, number, number], pose: [load.yaw, load.pitch] as [number, number] }
        }),
      })
    }
  }

  function snapshotMovement(fromCenter: LoadContext, toCenter: LoadContext): void {
    const start = assignments(fromCenter)
    const end = assignments(toCenter)
    const entries = new Set([...start.keys(), ...end.keys()])
    participants = []
    const sideOffset = slotTransforms.right.x
    const rearDepth = Math.abs(slotTransforms.right.z) * 2
    for (const load of entries) {
      if (!load.presentation || !alive(load) || (load !== toCenter && load !== fromCenter && !validate(load, true))) continue
      const startSlot = start.get(load)
      const endSlot = end.get(load)
      const from = startSlot ? slotTransforms[startSlot] : { x: moveDirection * sideOffset, z: -rearDepth, scale: 0.62 }
      const to = endSlot ? slotTransforms[endSlot] : { x: -moveDirection * sideOffset, z: -rearDepth, scale: 0.62 }
      participants.push({ load, from: { ...from }, to: { ...to }, startSlot, endSlot, yaw: load.yaw, pitch: load.pitch })
    }
  }

  function moveStage(progress: number): void {
    const e = easeInOutCubic(progress)
    for (const load of catalog.values()) if (load.presentation) load.presentation.visible = false
    const sideX = slotTransforms.right.x
    const depthZ = Math.abs(slotTransforms.right.z)
    const rearZ = depthZ * 2

    for (const part of participants) {
      const { load, from, to } = part
      const presentation = load.presentation
      if (!presentation || !alive(load) || (load !== candidate && !validate(load, true))) continue

      let x = from.x + (to.x - from.x) * e
      let z = from.z + (to.z - from.z) * e

      if (projects.length === 2 && ((moveDirection === 1 && load === displayed) ||
          (moveDirection === -1 && load === candidate))) {
        if (moveDirection === 1) {
          const theta = (3 * Math.PI / 2) * e
          x = -sideX * Math.sin(theta)
          z = -(rearZ / 2) * (1 - Math.cos(theta))
        } else {
          const phi = (3 * Math.PI / 2) * (1 - e)
          x = -sideX * Math.sin(phi)
          z = -(rearZ / 2) * (1 - Math.cos(phi))
        }
      } else if (projects.length === 2 && ((moveDirection === 1 && load === candidate) ||
                 (moveDirection === -1 && load === displayed))) {
        if (moveDirection === 1) {
          const theta = (Math.PI / 2) * (1 - e)
          x = sideX * Math.sin(theta)
          z = -depthZ * (1 - Math.cos(theta))
        } else {
          const theta = (Math.PI / 2) * e
          x = sideX * Math.sin(theta)
          z = -depthZ * (1 - Math.cos(theta))
        }
      } else if (projects.length === 3 && part.startSlot && part.endSlot &&
          part.startSlot !== 'center' && part.endSlot !== 'center') {
        const dir = moveDirection === 1 ? -1 : 1
        x = dir * sideX * Math.cos(Math.PI * e)
        z = -depthZ - (rearZ - depthZ) * Math.sin(Math.PI * e)
      } else if (!part.startSlot || !part.endSlot) {
        z -= (rearZ - depthZ) * 0.4 * Math.sin(Math.PI * e)
        if (!part.startSlot && part.endSlot) {
          load.ditherUniform.value = motionPreference.matches ? 1.0 : e
        } else if (part.startSlot && !part.endSlot) {
          load.ditherUniform.value = motionPreference.matches ? 0.0 : (1.0 - e)
        }
      } else if (part.startSlot === 'center' || part.endSlot === 'center') {
        const arcDir = to.x > from.x ? 1 : -1
        const theta = (Math.PI / 2) * e
        if (part.startSlot === 'center') {
          x = arcDir * sideX * Math.sin(theta)
          z = -depthZ * (1 - Math.cos(theta))
        } else {
          x = arcDir * -sideX * Math.sin((Math.PI / 2) * (1 - e))
          z = -depthZ * (1 - Math.cos((Math.PI / 2) * (1 - e)))
        }
      }

      presentation.visible = true
      presentation.position.set(x, 0, z)
      presentation.scale.setScalar(from.scale + (to.scale - from.scale) * e)

      if (load === displayed) {
        load.yaw = part.yaw + shortestDelta(part.yaw, 0) * e
        load.pitch = part.pitch + shortestDelta(part.pitch, 0) * e
      } else {
        load.yaw = 0
        load.pitch = 0
      }
      applyRotation(load)
    }
  }

  function draw(): void {
    frame = null
    if (disposed || released || !selection) return
    const load = candidate?.presentation ? candidate : displayed
    if (!load?.presentation || !alive(load)) return
    try {
      measure()
      const animationNow = animationTime(performance.now())
      if (!eligible()) return
      const dt = lastDrawTimeMs !== null ? Math.min(100, animationNow - lastDrawTimeMs) : 16.67
      lastDrawTimeMs = animationNow
      let ditherActive = false
      const ditherStep = motionPreference.matches ? 1.0 : (dt / 250)
      for (const entry of catalog.values()) {
        if (entry.ditherFade < entry.ditherTarget) {
          entry.ditherFade = Math.min(entry.ditherTarget, entry.ditherFade + ditherStep)
          entry.ditherUniform.value = motionPreference.matches ? 1.0 : entry.ditherFade
          if (entry.ditherFade < entry.ditherTarget) ditherActive = true
        } else if (entry.ditherFade > entry.ditherTarget) {
          entry.ditherFade = Math.max(entry.ditherTarget, entry.ditherFade - ditherStep)
          entry.ditherUniform.value = motionPreference.matches ? 0.0 : entry.ditherFade
          if (entry.ditherFade > entry.ditherTarget) ditherActive = true
          if (entry.ditherFade === 0 && !participants.some(p => p.load === entry)) {
            if (entry.presentation) entry.presentation.visible = false
          }
        }
      }
      if (ditherActive) invalidate()
      if (candidate?.presentation && candidate.validated[mode] !== 'valid') {
        if (!validate(candidate)) throw new Error('The model could not be drawn by this graphics device.')
        if (import.meta.env.MODE === 'acceptance' && acceptance?.onCandidateValidated) {
          acceptance.onCandidateValidated({ requestId: candidate.requestId, modelId: candidate.modelId })
        }
        if (import.meta.env.MODE === 'acceptance') acceptance?.onCandidatePreparation?.()
      }
      if (displayed && displayed !== candidate && displayed.validated[mode] !== 'valid' && !validate(displayed)) {
        fail(displayed, new Error('The model could not be drawn by this graphics device.'))
        return
      }
      if (candidate?.presentation && metadataReady && ticket) {
        const hasMovement = displayed && displayed !== candidate && selection.request.direction !== null && !motionPreference.matches
        if (hasMovement) {
          if (!moving) {
            moving = true
            clearInspection()
            moveDirection = selection.request.direction === 'next' ? 1 : -1
            // Leave time for the final validated draw, metadata commit and
            // compositor presentation, rather than spending the budget on motion.
            const remainingMs = selection.deadlineAtMs !== null ? selection.deadlineAtMs - performance.now() - 175 : 240
            moveDurationMs = Math.max(0, Math.min(240, remainingMs))
            moveStartedAtAnimationMs = animationNow
            candidate.yaw = 0
            candidate.pitch = 0
            candidate.savedYaw = null
            candidate.savedPitch = 0
            applyRotation(candidate)
            snapshotMovement(displayed!, candidate)
            emit('moving')
          }
          const progress = moveDurationMs <= 0 ? 1 : Math.min(1, (animationNow - moveStartedAtAnimationMs) / moveDurationMs)
          if (progress < 1) {
            moveStage(progress)
            drawStage(candidate, progress)
            invalidate()
            return
          }
        }
        candidate.yaw = 0
        candidate.pitch = 0
        applyRotation(candidate)
        candidate.ditherFade = 1.0
        candidate.ditherTarget = 1.0
        candidate.ditherUniform.value = 1.0
        restStage(candidate)
        drawStage(candidate, null, false)
        if (callbacks.finalize(ticket)) {
          displayed = candidate
          candidate = null
          moving = false
          participants = []
          emit('ready')
          reportStage(displayed, null)
          if (document.activeElement === canvas && !canvas.hasAttribute('data-pointer-focus')) acquireController('keyboard')
        } else {
          metadataReady = false
          moving = false
          participants = []
          if (displayed) { restStage(displayed); drawStage(displayed, null) }
          else clearSurface()
        }
      } else if (displayed) {
        if (phase === 'ready') {
          if (returning) {
            const progress = Math.min((animationNow - returnStartedAtMs) / 350, 1)
            if (motionPreference.matches || progress >= 1) restoreInspection(displayed, animationNow)
            else {
              const eased = progress * progress * (3 - 2 * progress)
              displayed.yaw = returnFromYaw + returnDeltaYaw * eased
              displayed.pitch = returnFromPitch + returnDeltaPitch * eased
              applyRotation(displayed)
            }
          } else if (activeControllers.size === 0 && displayed.savedYaw === null && !motionPreference.matches) {
            displayed.yaw += (animationNow - displayed.lastAnimationTimeMs) * FULL_TURN / 24_000
            applyRotation(displayed)
          }
        }
        restStage(displayed)
        drawStage(displayed, null)
      }
      if (displayed) displayed.lastAnimationTimeMs = animationNow
      if (phase === 'ready' && activeControllers.size === 0 && (returning || (!motionPreference.matches && displayed?.savedYaw === null))) invalidate()
    } catch (error) {
      if (gl.isContextLost()) stopRenderer('The graphics context was lost. Reload the page to view models again.')
      else fail(load, error)
    }
  }

  function invalidate(): void {
    if (!disposed && !released && frame === null && (candidate?.presentation || displayed?.presentation)) frame = requestAnimationFrame(draw)
  }

  function resize(): void {
    measureDirty = true
    measure()
    animationTime(performance.now())
    invalidate()
  }

  function visibility(event?: Event): void {
    focused = document.hasFocus()
    const animationNow = animationTime(performance.now())
    if (displayed && event?.type === 'change') displayed.lastAnimationTimeMs = animationNow
    if (displayed && motionPreference.matches && activeControllers.size === 0) restoreInspection(displayed, animationNow)
    if (eligible()) invalidate()
    else cancelFrame()
  }

  function rotate(): void {
    if (!displayed || phase !== 'ready') return
    applyRotation(displayed)
    invalidate()
  }

  function pointerDown(event: PointerEvent): void {
    if (!event.isPrimary || event.button !== 0 || pointerId !== null || phase !== 'ready' || !displayed || !measure()) return
    const rect = canvas.getBoundingClientRect()
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, 1 - (event.clientY - rect.top) / rect.height * 2)
    scene.updateMatrixWorld(true)
    raycaster.setFromCamera(pointer, camera)
    const visible = Array.from(catalog.values()).filter(load => load.presentation?.visible)
    const hits = raycaster.intersectObjects(visible.map(load => load.presentation!), true)
    if (hits.length) {
      let object: Object3D | null = hits[0].object
      while (object?.parent && object.parent !== scene) object = object.parent
      if (object !== displayed.presentation) return
    }
    canvas.dataset.pointerFocus = ''
    canvas.focus({ preventScroll: true })
    event.preventDefault()
    canvas.setPointerCapture(event.pointerId)
    pointerId = event.pointerId
    acquireController(event.pointerId)
    pointerX = event.clientX
    pointerY = event.clientY
  }

  function pointerMove(event: PointerEvent): void {
    if (event.pointerId !== pointerId || !displayed || !(width > 0 && height > 0)) return
    if ((event.buttons & 1) === 0) { endGesture(); return }
    event.preventDefault()
    displayed.yaw += (event.clientX - pointerX) * FULL_TURN / width
    displayed.pitch += (event.clientY - pointerY) * FULL_TURN / height
    pointerX = event.clientX
    pointerY = event.clientY
    rotate()
  }

  function pointerEnd(event: PointerEvent): void {
    if (event.pointerId === pointerId) endGesture()
  }

  function clearPointerFocus(): void { delete canvas.dataset.pointerFocus }

  function canvasFocus(): void {
    if (!canvas.hasAttribute('data-pointer-focus')) acquireController('keyboard')
  }

  function canvasBlur(): void {
    clearPointerFocus()
    releaseController('keyboard')
  }

  function keyboardModality(event: KeyboardEvent): void {
    if (event.key === 'Tab') clearPointerFocus()
  }

  function keyDown(event: KeyboardEvent): void {
    if (document.activeElement !== canvas || phase !== 'ready' || !displayed) return
    clearPointerFocus()
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight' && event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
    acquireController('keyboard')
    switch (event.key) {
      case 'ArrowLeft': displayed.yaw -= KEY_TURN; break
      case 'ArrowRight': displayed.yaw += KEY_TURN; break
      case 'ArrowUp': displayed.pitch -= KEY_TURN; break
      case 'ArrowDown': displayed.pitch += KEY_TURN; break
    }
    event.preventDefault()
    rotate()
  }

  function windowBlur(): void {
    focused = false
    animationTime(performance.now())
    const wasInspecting = activeControllers.size > 0
    activeControllers.clear()
    endGesture()
    if (wasInspecting) beginReturn()
    cancelFrame()
  }

  function releaseRuntime(): void {
    if (released) return
    released = true
    cancelFrame()
    clearInspection()
    observer.disconnect()
    intersection.disconnect()
    motionPreference.removeEventListener('change', visibility)
    document.removeEventListener('visibilitychange', visibility)
    document.removeEventListener('keydown', keyboardModality, true)
    canvas.removeEventListener('pointerdown', pointerDown)
    canvas.removeEventListener('pointermove', pointerMove)
    canvas.removeEventListener('pointerup', pointerEnd)
    canvas.removeEventListener('pointercancel', pointerEnd)
    canvas.removeEventListener('lostpointercapture', pointerEnd)
    canvas.removeEventListener('keydown', keyDown)
    canvas.removeEventListener('focus', canvasFocus)
    canvas.removeEventListener('blur', canvasBlur)
    canvas.removeEventListener('webglcontextlost', contextLost)
    window.removeEventListener('blur', windowBlur)
    window.removeEventListener('focus', visibility)
    window.removeEventListener('resize', resize)
    canvas.style.touchAction = previousTouchAction
    clearPointerFocus()
    scene.overrideMaterial = null
    for (const load of catalog.values()) retire(load)
    candidate = null
    displayed = null
    clay?.dispose()
    wireframe?.dispose()
    validationTarget.dispose()
    renderer.dispose()
    queueMicrotask(() => {
      if (contextOwners.get(canvas) !== renderer) return
      contextOwners.delete(canvas)
      if (!gl.isContextLost()) renderer.forceContextLoss()
    })
  }

  function stopRenderer(message: string): void {
    if (disposed || terminalError) return
    terminalError = message
    releaseRuntime()
    emit('unavailable', message)
  }

  function contextLost(event: Event): void {
    event.preventDefault()
    stopRenderer('The graphics context was lost. Reload the page to view models again.')
  }

  async function loadModel(load: LoadContext, url: string): Promise<void> {
    try {
      const response = await fetch(url, { signal: load.abort.signal })
      if (!alive(load)) return
      if (!response.ok) throw new Error(`The model could not be fetched (HTTP ${response.status}).`)
      const data = await response.arrayBuffer()
      if (!alive(load)) return
      validateContainer(data)
      const loader = new GLTFLoader(load.manager)
      loader.register((parser) => {
        load.resources.instrument(parser)
        return {
          name: 'PortfolioEmbeddedResources',
          beforeRoot: async () => {
            if (!alive(load)) throw new Error('The model selection has changed.')
            validateEmbeddedResources(parser)
          },
        }
      })
      const result = await loader.parseAsync(data, '')
      load.resources.track(result.scenes)
      if (!alive(load)) { load.resources.retire(); return }
      load.result = result
      if (load.resourceError) throw new Error('An embedded model resource could not be decoded.')
      if (!result.scene) throw new Error('The model does not contain a displayable scene.')
      result.scene.traverse((object) => {
        if (object instanceof Light) object.visible = false
        if (object instanceof Mesh && object.material) {
          const raw = object.material as Material | Material[]
          const mats = Array.isArray(raw) ? raw : [raw]
          for (const m of mats) attachDither(m, load.ditherUniform)
        }
      })
      result.scene.updateMatrixWorld(true)
      bounds.setFromObject(result.scene, true)
      bounds.getBoundingSphere(sphere)
      if (bounds.isEmpty() || !Number.isFinite(sphere.radius) || sphere.radius <= 0 ||
          !Number.isFinite(sphere.center.x) || !Number.isFinite(sphere.center.y) || !Number.isFinite(sphere.center.z)) {
        throw new Error('The model does not contain finite, nonempty geometry.')
      }
      const presentation = new Group()
      const rotation = new Group()
      const normalization = new Group()
      const centering = new Group()
      normalization.scale.setScalar(1 / sphere.radius)
      centering.position.copy(sphere.center).negate()
      centering.add(result.scene)
      normalization.add(centering)
      rotation.add(normalization)
      presentation.add(rotation)
      load.presentation = presentation
      load.rotation = rotation
      presentation.visible = false
      scene.add(presentation)
      applyMode()
      invalidate()
    } catch (error) {
      if (alive(load)) fail(load, error)
      else load.resources.retire()
    }
  }

  const observer = new ResizeObserver(resize)
  observer.observe(canvas)
  const intersection = new IntersectionObserver((entries) => {
    intersecting = entries[0]?.isIntersecting ?? false
    animationTime(performance.now())
    if (eligible()) invalidate()
    else cancelFrame()
  })
  intersection.observe(canvas)
  motionPreference.addEventListener('change', visibility)
  document.addEventListener('visibilitychange', visibility)
  canvas.addEventListener('pointerdown', pointerDown)
  canvas.addEventListener('pointermove', pointerMove)
  canvas.addEventListener('pointerup', pointerEnd)
  canvas.addEventListener('pointercancel', pointerEnd)
  canvas.addEventListener('lostpointercapture', pointerEnd)
  canvas.addEventListener('keydown', keyDown)
  canvas.addEventListener('focus', canvasFocus)
  canvas.addEventListener('blur', canvasBlur)
  document.addEventListener('keydown', keyboardModality, true)
  canvas.addEventListener('webglcontextlost', contextLost)
  window.addEventListener('blur', windowBlur)
  window.addEventListener('focus', visibility)
  window.addEventListener('resize', resize)

  for (const project of projects) {
    if (catalog.has(project.id)) continue
    const manager = new LoadingManager()
    const load: LoadContext = {
      requestId: 0,
      modelId: project.id, abort: new AbortController(), manager, resources: createLoadResources(),
      resourceError: false, result: null, presentation: null, rotation: null,
      yaw: 0, pitch: 0, savedYaw: null, savedPitch: 0,
      validated: { rendered: 'unvalidated', clay: 'unvalidated', wireframe: 'unvalidated' }, lastAnimationTimeMs: animationElapsedMs, retired: false, error: null,
      ditherFade: 0, ditherTarget: 1, ditherUniform: { value: 0 },
    }
    manager.onError = () => { load.resourceError = true }
    manager.setURLModifier((url) => {
      if (!/^data:|^blob:/i.test(url)) {
        load.resourceError = true
        throw new Error('External model resources are not permitted.')
      }
      return url
    })
    catalog.set(project.id, load)
    void loadModel(load, project.modelUrl)
  }

  return {
    select(request) {
      if (disposed || phase === 'moving' || (selection && request.requestId <= selection.request.requestId)) return
      cancelFrame()
      clearInspection()
      if (candidate && candidate !== displayed && candidate.presentation) {
        candidate.presentation.visible = false
        candidate.presentation.position.set(0, 0, 0)
        candidate.presentation.scale.set(1, 1, 1)
      }
      if (displayed?.presentation) {
        displayed.presentation.visible = true
        displayed.presentation.position.set(0, 0, 0)
        displayed.presentation.scale.set(1, 1, 1)
      }
      moving = false
      candidate = null
      selection = { request, deadlineAtMs: request.activatedAtMs === null ? null : request.activatedAtMs + 500 }
      ticket = { requestId: request.requestId, modelId: request.model.id }
      metadataReady = false
      if (terminalError) { emit('unavailable', terminalError); return }
      emit('loading')
      if (displayed?.modelId === request.model.id) {
        displayed.requestId = request.requestId
        displayed.validated[mode] = 'unvalidated'
        candidate = displayed
        invalidate()
        return
      }
      const load = catalog.get(request.model.id)
      if (!load || load.error) {
        if (displayed?.presentation) displayed.presentation.visible = false
        displayed = null
        clearSurface()
        emit('error', load?.error ?? 'The model is not in the catalog.')
        return
      }
      load.requestId = request.requestId
      load.validated[mode] = 'unvalidated'
      load.yaw = 0
      load.pitch = 0
      load.savedYaw = null
      load.savedPitch = 0
      applyRotation(load)
      candidate = load
      invalidate()
    },
    setMetadataReady(proof, ready) {
      if (disposed || !ticket || proof.requestId !== ticket.requestId || proof.modelId !== ticket.modelId) return
      metadataReady = ready
      if (ready) invalidate()
    },
    setMode(nextMode) {
      if (disposed || released || mode === nextMode) return
      mode = nextMode
      applyMode()
      invalidate()
    },
    setOrbitRadius(radius: number) {
      if (!Number.isFinite(radius) || radius <= 0) return
      orbitRadius = radius
      measureDirty = true
      measure()
      invalidate()
    },
    getOrbitRadius() {
      return orbitRadius
    },
    dispose() {
      if (disposed) return
      disposed = true
      releaseRuntime()
    },
  }
}
