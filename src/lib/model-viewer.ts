import {
  AmbientLight,
  Box3,
  BufferGeometry,
  Color,
  DirectionalLight,
  Group,
  InstancedMesh,
  Light,
  LoadingManager,
  Material,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  NeutralToneMapping,
  Object3D,
  PerspectiveCamera,
  Quaternion,
  Raycaster,
  Scene,
  Skeleton,
  Sphere,
  SRGBColorSpace,
  Texture,
  Vector2,
  Vector3,
  Vector4,
  WebGLRenderer,
  WebGLRenderTarget,
} from 'three'
import type { GLTF, GLTFParser } from 'three/addons/loaders/GLTFLoader.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js'
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
  readonly serviceStartedAtMs?: number | null
}

export type ViewerStatus = {
  readonly requestId: number
  readonly requestedId: string
  readonly displayedId: string | null
} & ({ state: 'loading' | 'moving' | 'ready' } | { state: 'error' | 'unavailable'; message: string })

export interface ModelViewerController {
  select(request: ViewerSelectionRequest): void
  setMetadataReady(ticket: MetadataTicket, ready: boolean): void
  setMode(mode: DisplayMode): void
  setBeltSpacing?(spacing: number): void
  getBeltSpacing?(): number
  /** @deprecated Use setBeltSpacing. */
  setOrbitRadius?(radius: number): void
  /** @deprecated Use getBeltSpacing. */
  getOrbitRadius?(): number
  dispose(): void
}

export interface ViewerOptions {
  readonly beltSpacing?: number
  /** @deprecated Use beltSpacing. */
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
  onOccurrenceDisposed?(info: { instanceId: string; modelId: string; skeletonIds: string[] }): void
  onPresentationDrawn?(info: {
    requestId: number
    displayedId: string
    activatedAtMs: number | null
    serviceStartedAtMs: number | null
    timestamp: number
    position: [number, number, number]
    scale: [number, number, number]
    progress: number | null
    cameraDistance: number
    participants: {
      instanceId: string
      modelId: string
      skeletonIds: string[]
      geometryIds: string[]
      position: [number, number, number]
      scale: [number, number, number]
      pose: [number, number]
    }[]
    phase: ViewerStatus['state']
  }): void
}

const FULL_TURN = Math.PI * 2
const KEY_TURN = Math.PI / 36
// Duration is shortened when the settlement deadline is near.
const TRANSITION_DURATION_MS = 700
const SETTLEMENT_DEADLINE_MS = 1500
// Fade width as a fraction of the full visible canvas; independent of model motion.
const EDGE_DITHER_FADE_FRACTION = 0.14
// Side artworks use 75% of the centered artwork's normalized scale.
const CENTER_MODEL_SCALE = 2.2
const SIDE_MODEL_SCALE_RATIO = 0.75

function setOrbitPosition(object: Object3D, x: number, z: number): void {
  object.position.set(x, 0, z)
}

// Zero velocity and acceleration at each phase boundary soften direction changes.
function easeInOutSmooth(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10)
}

const DITHER_DISCARD_CHUNK = `
  float edgeCoverage = 1.0;
  if (uEdgeDither.w > 0.5) {
    float edgeDistance = min(gl_FragCoord.x - uEdgeDither.x, uEdgeDither.y - gl_FragCoord.x);
    edgeCoverage = smoothstep(0.0, uEdgeDither.z, edgeDistance);
  }
  float coverage = uDitherFade * edgeCoverage;
  if (coverage < 0.999) {
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
    if (coverage <= float(bayer[by * 8 + bx]) / 64.0) discard;
  }
`

function attachDither(material: Material, uniform: { value: number }, edge: { value: Vector4 }): void {
  material.customProgramCacheKey = () => 'portfolio-dither-edge-v1'
  const prevOnBeforeCompile = material.onBeforeCompile
  material.onBeforeCompile = (shader, rend) => {
    prevOnBeforeCompile?.(shader, rend)
    shader.uniforms.uDitherFade = uniform
    shader.uniforms.uEdgeDither = edge
    if (!shader.fragmentShader.includes('uDitherFade')) {
      shader.fragmentShader = `uniform float uDitherFade;\nuniform vec4 uEdgeDither;\n${shader.fragmentShader}`
      if (shader.fragmentShader.includes('#include <dithering_fragment>')) {
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <dithering_fragment>',
          `#include <dithering_fragment>\n${DITHER_DISCARD_CHUNK}`
        )
      } else {
        const lastBrace = shader.fragmentShader.lastIndexOf('}')
        if (lastBrace !== -1) {
          shader.fragmentShader = `${shader.fragmentShader.slice(0, lastBrace)}${DITHER_DISCARD_CHUNK}\n}`
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
      if (definition.uri !== undefined && (typeof definition.uri !== 'string' || !/^data:/i.test(definition.uri))) {
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
    parser.getDependency = (type, index) =>
      dependency(type, index).then((value: unknown) => {
        track(value)
        return value
      })

    const imageSource = parser.loadImageSource.bind(parser)
    parser.loadImageSource = (index, loader) =>
      imageSource(index, loader).then((texture) => {
        track(texture)
        return texture
      })

    // Track each fulfilled primitive, not only the aggregate that can reject early.
    const loadGeometries = parser.loadGeometries.bind(parser)
    parser.loadGeometries = (primitives) =>
      Promise.all(
        primitives.map((primitive) =>
          loadGeometries([primitive]).then((result) => {
            track(result)
            return result[0]
          })
        )
      )

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
  zRotation: number
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

export function createModelViewer(
  canvas: HTMLCanvasElement,
  projects: readonly Pick<Project, 'id' | 'modelUrl' | 'zRotation'>[],
  callbacks: ViewerCallbacks,
  acceptance?: ViewerAcceptanceHooks,
  options?: ViewerOptions
): ModelViewerController {
  const rawGl = canvas.getContext('webgl2', { alpha: true, antialias: true })
  if (!rawGl) throw new Error('WebGL 2 is unavailable in this browser.')
  const gl = rawGl
  let renderer: WebGLRenderer
  try {
    renderer = new WebGLRenderer({ canvas, context: gl, alpha: true, antialias: true })
    renderer.outputColorSpace = SRGBColorSpace
    renderer.toneMapping = NeutralToneMapping
    renderer.toneMappingExposure = 1
    renderer.setClearColor(0x000000, 0)
    renderer.debug.onShaderError = () => {
      throw new Error('The model could not be drawn by this graphics device.')
    }
  } catch (error) {
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    throw error
  }
  contextOwners.set(canvas, renderer)
  const scene = new Scene()
  const baseCameraFov = 35
  const camera = new PerspectiveCamera(baseCameraFov, 1, 0.1, 10)
  const stage = canvas.parentElement
  const pointerSurface = stage ?? canvas
  const ambient = new AmbientLight(0xffffff, 1.2)
  const key = new DirectionalLight(0xffffff, 1.3)
  key.position.set(2, 2, 4)
  const fill = new DirectionalLight(0xffffff, 1.3)
  fill.position.set(-2, 2, 4)
  const back = new DirectionalLight(0xffffff, 0.5)
  back.position.set(0, 1, -4)
  scene.add(ambient, key, fill, back)
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
    center: { x: 0, z: 0, scale: CENTER_MODEL_SCALE },
    left: { x: -4.6, z: 0, scale: CENTER_MODEL_SCALE * SIDE_MODEL_SCALE_RATIO },
    right: { x: 4.6, z: 0, scale: CENTER_MODEL_SCALE * SIDE_MODEL_SCALE_RATIO },
  }
  let beltSpacing = options?.beltSpacing
  let orbitRadius = options?.orbitRadius
  let resolvedBeltSpacing = 1
  const sharedDitherUniform = { value: 1.0 }
  // Left/right fade bounds and width are in physical drawing-buffer pixels.
  const edgeDitherUniform = { value: new Vector4(0, 0, 1, 0) }
  function setSlot(load: LoadContext, slot: Slot): void {
    if (!load.presentation) return
    const transform = slotTransforms[slot]
    setOrbitPosition(load.presentation, transform.x, transform.z)
    load.presentation.scale.setScalar(transform.scale)
  }
  let metadataReady = false
  let phase: ViewerStatus['state'] = 'loading'
  let frame: number | null = null
  let moving = false
  let moveStartedAtAnimationMs = 0
  let moveDurationMs = 0
  let moveDirection = 0
  type Occurrence = { load: LoadContext; presentation: Group; rotation: Group; clone: boolean; slot: number }
  type TransitionParticipant = Occurrence & { yaw: number; pitch: number }
  let participants: TransitionParticipant[] = []
  let restOccurrences: Occurrence[] = []
  type OccurrenceCopy = {
    presentation: Group
    rotation: Group
    skeletons: Set<Skeleton>
    instances: Set<InstancedMesh>
  }
  const copies = new Map<LoadContext, OccurrenceCopy[]>()

  function discardCopy(load: LoadContext, copy?: OccurrenceCopy): void {
    const pool = copies.get(load)
    if (!pool) return
    const removed = copy ? [copy] : [...pool]
    for (const item of removed) {
      const index = pool.indexOf(item)
      if (index < 0) continue
      pool.splice(index, 1)
      item.presentation.removeFromParent()
      for (const skeleton of item.skeletons) skeleton.dispose()
      for (const instance of item.instances) instance.dispose()
      if (import.meta.env.MODE === 'acceptance') {
        acceptance?.onOccurrenceDisposed?.({
          instanceId: item.presentation.uuid,
          modelId: load.modelId,
          skeletonIds: Array.from(item.skeletons, (skeleton) => skeleton.uuid),
        })
      }
    }
    if (pool.length === 0) copies.delete(load)
  }

  function occurrence(load: LoadContext, slot: number, duplicateIndex: number): Occurrence | null {
    if (!load.presentation || !load.rotation || !alive(load)) return null
    if (duplicateIndex === 0) return { load, presentation: load.presentation, rotation: load.rotation, clone: false, slot }
    let pool = copies.get(load)
    if (!pool) {
      pool = []
      copies.set(load, pool)
    }
    let copy = pool[duplicateIndex - 1]
    if (!copy) {
      const presentation = cloneSkeleton(load.presentation) as Group
      const rotation = presentation.children[0] as Group
      const skeletons = new Set<Skeleton>()
      const instances = new Set<InstancedMesh>()
      presentation.traverse((object) => {
        const skeleton = (object as Object3D & { skeleton?: Skeleton }).skeleton
        if (skeleton) skeletons.add(skeleton)
        if (object instanceof InstancedMesh) instances.add(object)
      })
      copy = { presentation, rotation, skeletons, instances }
      pool.push(copy)
      scene.add(presentation)
    }
    copy.rotation.quaternion.identity()
    return { load, presentation: copy.presentation, rotation: copy.rotation, clone: true, slot }
  }

  function hideOccurrences(): void {
    for (const load of catalog.values()) if (load.presentation) load.presentation.visible = false
    for (const pool of copies.values()) for (const copy of pool) copy.presentation.visible = false
  }

  function pruneCopies(used: Occurrence[]): void {
    const keep = new Set(used.filter((item) => item.clone).map((item) => item.presentation))
    for (const [load, pool] of copies) {
      for (const copy of [...pool]) if (!keep.has(copy.presentation)) discardCopy(load, copy)
    }
  }
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
    if (motionPreference.matches || (returnDeltaYaw === 0 && returnDeltaPitch === 0))
      restoreInspection(load, returnStartedAtMs)
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
    if (state === 'error' || state === 'unavailable')
      callbacks.onStatus({ ...identity, state, message: message ?? 'The model is unavailable.' })
    else callbacks.onStatus({ ...identity, state })
  }

  function endGesture(): void {
    const id = pointerId
    pointerId = null
    if (id !== null) releaseController(id)
    if (id !== null && pointerSurface.hasPointerCapture(id)) pointerSurface.releasePointerCapture(id)
  }

  function retire(load: LoadContext): void {
    if (load.retired) return
    load.retired = true
    load.abort.abort()
    load.manager.abort()
    discardCopy(load)
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
        attachDither(clay, sharedDitherUniform, edgeDitherUniform)
      }
      scene.overrideMaterial = clay
    } else {
      if (!wireframe) {
        wireframe = new MeshBasicMaterial({ color: 0xebebeb, wireframe: true })
        attachDither(wireframe, sharedDitherUniform, edgeDitherUniform)
      }
      scene.overrideMaterial = wireframe
    }
  }

  function measure(): boolean {
    if (!measureDirty) return width > 0 && height > 0
    measureDirty = false
    const stageRect = stage?.getBoundingClientRect()
    const bodyRect = document.body.getBoundingClientRect()
    if (!stage || !stageRect || !(stageRect.width > 0 && stageRect.height > 0 && bodyRect.width > 0)) return false
    const stageCssWidth = parseFloat(getComputedStyle(stage).width)
    if (!(stageCssWidth > 0)) return false
    const cssScale = stageRect.width / stageCssWidth
    const expandedWidth = bodyRect.width / cssScale
    const expandedHeight = expandedWidth * stageRect.height / stageRect.width
    canvas.style.width = `${expandedWidth}px`
    canvas.style.height = `${expandedHeight}px`
    canvas.style.left = `${(bodyRect.left - stageRect.left) / cssScale}px`
    canvas.style.top = `${(stageRect.height / cssScale - expandedHeight) / 2}px`
    const rect = canvas.getBoundingClientRect()
    width = rect.width
    height = rect.height
    if (!(width > 0 && height > 0)) return false
    const css = getComputedStyle(canvas)
    const values = [beltSpacing, parseFloat(css.getPropertyValue('--carousel-belt-spacing')), orbitRadius,
      parseFloat(css.getPropertyValue('--orbit-radius')), parseFloat(css.getPropertyValue('--carousel-orbit-radius'))]
    const rawOrbit = values.find((value): value is number => value !== undefined && Number.isFinite(value) && value > 0) ?? 1
    resolvedBeltSpacing = rawOrbit
    // On narrow screens (mobile), scale the effective orbit with available width
    // so previews never collide with navigation buttons even with a large orbit setting.
    const maxOrbitForWidth = 1.0 + 1.5 * Math.max(0, Math.min(1, (stageRect.width - 375) / 500))
    const effectiveOrbit = Math.min(rawOrbit, maxOrbitForWidth)
    const responsiveSpacing = 2.5 + 0.5 * Math.max(0, Math.min(1, (stageRect.width - 375) / 500))
    const sideOffset = responsiveSpacing * effectiveOrbit
    slotTransforms.left.x = -sideOffset
    slotTransforms.right.x = sideOffset
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    const verticalHalfFov = (baseCameraFov * Math.PI) / 360
    const horizontalHalfFov = Math.atan(Math.tan(verticalHalfFov) * camera.aspect)
    const minimumFraming = 1 + 0.4 * Math.max(0, Math.min(1, (stageRect.width - 375) / 500))
    const framing = Math.max(effectiveOrbit, minimumFraming)
    const desktopFit = 1 + 0.18 * Math.max(0, Math.min(1, (stageRect.width - 600) / 400))
    const distance = desktopFit * Math.max(
      1 + (1.6 * framing) / (Math.tan(horizontalHalfFov) * 0.9),
      1 + (1.0 * framing) / (Math.tan(verticalHalfFov) * 0.9)
    )
    camera.fov = (2 * Math.atan(Math.tan(verticalHalfFov) * height / stageRect.height) * 180) / Math.PI
    camera.position.set(0, 0, distance)
    camera.near = Math.max(0.01, distance - 2.2)
    camera.far = distance + 5.0
    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix()
    return true
  }
  function eligible(): boolean {
    return (
      !disposed &&
      !released &&
      document.visibilityState !== 'hidden' &&
      intersecting &&
      focused &&
      width > 0 &&
      height > 0
    )
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
    const states = [
      ...Array.from(catalog.values()).flatMap((entry) => entry.presentation ? [entry.presentation] : []),
      ...Array.from(copies.values()).flatMap((pool) => pool.map((copy) => copy.presentation)),
    ].map((presentation) => ({ presentation, visible: presentation.visible }))
    const position = load.presentation.position.clone()
    const scale = load.presentation.scale.clone()
    const savedFade = load.ditherUniform.value
    const savedEdgeEnabled = edgeDitherUniform.value.w
    edgeDitherUniform.value.w = 0
    load.ditherUniform.value = 1.0
    sharedDitherUniform.value = 1.0
    try {
      if (import.meta.env.MODE === 'acceptance' && preview && acceptance?.failPreviewValidation?.(load.modelId, mode)) {
        throw new Error('Preview validation failed.')
      }
      if (
        import.meta.env.MODE === 'acceptance' &&
        !preview &&
        load === candidate &&
        acceptance?.failCandidateValidation?.(load.modelId, mode)
      ) {
        throw new Error('Candidate validation failed.')
      }
      for (const { presentation } of states) presentation.visible = presentation === load.presentation
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
      edgeDitherUniform.value.w = savedEdgeEnabled
      for (const { presentation, visible } of states) presentation.visible = visible
      scene.overrideMaterial = override
      renderer.setRenderTarget(target)
      renderer.setViewport(savedViewport)
      renderer.setScissor(savedScissor)
      renderer.setScissorTest(scissorTest)
      renderer.setClearColor(savedClearColor, clearAlpha)
      renderer.autoClear = autoClear
    }
  }

  function loadAt(center: LoadContext, slot: number): LoadContext | undefined {
    const index = projects.findIndex((project) => project.id === center.modelId)
    if (index < 0 || projects.length === 0) return undefined
    const target = projects[(index + slot % projects.length + projects.length) % projects.length]
    return target ? catalog.get(target.id) : undefined
  }

  function buildOccurrences(center: LoadContext, slots: number[], destination?: LoadContext): Occurrence[] {
    const used = new Map<LoadContext, number>()
    const result: Occurrence[] = []
    for (const slot of slots) {
      const load = loadAt(center, slot)
      if (!load?.presentation || !alive(load)) continue
      if (load !== center && load !== destination && !validate(load, true)) continue
      const count = used.get(load) ?? 0
      const item = occurrence(load, slot, count)
      if (!item) continue
      used.set(load, count + 1)
      result.push(item)
    }
    return result
  }

  function setBeltTransform(presentation: Group, position: number): void {
    const sideWeight = Math.min(1, Math.abs(position))
    const scale = 1 - (1 - SIDE_MODEL_SCALE_RATIO) * sideWeight
    presentation.position.set(position * slotTransforms.right.x, 0, 0)
    presentation.scale.setScalar(slotTransforms.center.scale * scale)
  }

  function restStage(center: LoadContext): void {
    for (const load of catalog.values()) load.ditherTarget = 1.0
    const slots = projects.length > 1 ? [0, -1, 1] : [0]
    const next = buildOccurrences(center, slots)
    hideOccurrences()
    for (const item of next) {
      item.presentation.visible = true
      setBeltTransform(item.presentation, item.slot)
      if (item.slot !== 0) {
        if (item.clone) item.rotation.quaternion.identity()
        else {
          item.load.yaw = 0
          item.load.pitch = 0
          applyRotation(item.load)
        }
      }
    }
    restOccurrences = next
    pruneCopies(next)
  }

  function drawBelt(): void {
    const previousScissor = renderer.getScissor(new Vector4())
    const previousScissorTest = renderer.getScissorTest()
    const spacing = slotTransforms.right.x
    // Keep the entering occurrence outside the aperture until its fragments
    // reach the gradual edge fade.
    const aperture = Math.max(spacing, 2 * spacing - CENTER_MODEL_SCALE / 2)
    const edge = new Vector3(aperture, 0, 0).project(camera).x
    const left = Math.max(0, Math.floor((1 - edge) * width / 2))
    const right = Math.min(width, Math.ceil((1 + edge) * width / 2))
    const physicalScale = gl.drawingBufferWidth / width
    const fadeWidth = Math.max(1, Math.min(width * EDGE_DITHER_FADE_FRACTION, (right - left) / 2))
    edgeDitherUniform.value.set(left * physicalScale, right * physicalScale, fadeWidth * physicalScale, 1)
    try {
      renderer.setScissorTest(false)
      renderer.clear()
      renderer.setScissor(left, 0, Math.max(0, right - left), height)
      renderer.setScissorTest(true)
      render()
      if (gl.isContextLost() || gl.getError() !== gl.NO_ERROR) {
        throw new Error('The model could not be drawn by this graphics device.')
      }
    } finally {
      renderer.setScissor(previousScissor)
      renderer.setScissorTest(previousScissorTest)
      edgeDitherUniform.value.w = 1
    }
  }

  function drawStage(center: LoadContext, progress: number | null, report = true): void {
    sharedDitherUniform.value = center.ditherUniform.value
    try {
      drawBelt()
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
          for (const copy of copies.get(load) ?? []) copy.presentation.visible = false
          removed = true
        }
      }
      if (!removed) throw error
      drawBelt()
    }
    if (report) reportStage(center, progress)
  }

  function reportStage(center: LoadContext, progress: number | null): void {
    if (import.meta.env.MODE === 'acceptance' && acceptance?.onPresentationDrawn && center.presentation && selection) {
      const p = center.presentation
      const visible = moving && progress !== null ? participants : restOccurrences
      acceptance.onPresentationDrawn({
        requestId: selection.request.requestId,
        displayedId: center.modelId,
        activatedAtMs: selection.request.activatedAtMs,
        serviceStartedAtMs: selection.request.serviceStartedAtMs ?? null,
        timestamp: performance.now(),
        position: [p.position.x, p.position.y, p.position.z],
        scale: [p.scale.x, p.scale.y, p.scale.z],
        phase,
        progress,
        cameraDistance: camera.position.z,
        participants: visible.filter((item) => item.presentation.visible).map((item) => {
          const skeletonIds = new Set<string>()
          const geometryIds = new Set<string>()
          item.presentation.traverse((object) => {
            const mesh = object as Object3D & { skeleton?: Skeleton; geometry?: BufferGeometry }
            if (mesh.skeleton) skeletonIds.add(mesh.skeleton.uuid)
            if (mesh.geometry) geometryIds.add(mesh.geometry.uuid)
          })
          return {
            instanceId: item.presentation.uuid,
            modelId: item.load.modelId,
            skeletonIds: [...skeletonIds],
            geometryIds: [...geometryIds],
            position: [item.presentation.position.x, item.presentation.position.y, item.presentation.position.z] as [number, number, number],
            scale: [item.presentation.scale.x, item.presentation.scale.y, item.presentation.scale.z] as [number, number, number],
            pose: (item.clone ? [0, 0] : [item.load.yaw, item.load.pitch]) as [number, number],
          }
        }),
      })
    }
  }

  function snapshotMovement(fromCenter: LoadContext, toCenter: LoadContext): void {
    const slots = [0, moveDirection, -moveDirection, 2 * moveDirection]
    participants = buildOccurrences(fromCenter, slots, toCenter).map((item) => ({
      ...item,
      yaw: item.clone ? 0 : item.load.yaw,
      pitch: item.clone ? 0 : item.load.pitch,
    }))
    pruneCopies(participants)
  }

  function moveStage(progress: number): void {
    const e = Math.max(0, Math.min(1, progress))
    hideOccurrences()
    for (const part of participants) {
      const { load, presentation } = part
      if (!alive(load) || (load !== candidate && !validate(load, true))) continue
      presentation.visible = true
      const position = part.slot - moveDirection * e
      setBeltTransform(presentation, position)
      if (part.slot === 0 && !part.clone) {
        load.yaw = part.yaw + shortestDelta(part.yaw, 0) * e
        load.pitch = part.pitch + shortestDelta(part.pitch, 0) * e
        applyRotation(load)
      } else if (part.clone) {
        part.rotation.quaternion.identity()
      } else {
        load.yaw = 0
        load.pitch = 0
        applyRotation(load)
      }
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
      const ditherStep = motionPreference.matches ? 1.0 : dt / 250
      for (const entry of catalog.values()) {
        if (entry.ditherFade < entry.ditherTarget) {
          entry.ditherFade = Math.min(entry.ditherTarget, entry.ditherFade + ditherStep)
          entry.ditherUniform.value = motionPreference.matches ? 1.0 : entry.ditherFade
          if (entry.ditherFade < entry.ditherTarget) ditherActive = true
        } else if (entry.ditherFade > entry.ditherTarget) {
          entry.ditherFade = Math.max(entry.ditherTarget, entry.ditherFade - ditherStep)
          entry.ditherUniform.value = motionPreference.matches ? 0.0 : entry.ditherFade
          if (entry.ditherFade > entry.ditherTarget) ditherActive = true
          if (entry.ditherFade === 0 && !participants.some((p) => p.load === entry)) {
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
        const hasMovement =
          displayed && displayed !== candidate && selection.request.direction !== null && !motionPreference.matches
        if (hasMovement) {
          if (!moving) {
            moving = true
            clearInspection()
            moveDirection = selection.request.direction === 'next' ? 1 : -1
            // Leave time for the final validated draw, metadata commit and
            // compositor presentation, rather than spending the budget on motion.
            const requestedDuration = Math.max(0, TRANSITION_DURATION_MS)
            const remainingMs = selection.deadlineAtMs !== null
              ? selection.deadlineAtMs - performance.now() - 175
              : requestedDuration
            moveDurationMs = Math.max(0, Math.min(requestedDuration, remainingMs))
            moveStartedAtAnimationMs = animationNow
            candidate.yaw = 0
            candidate.pitch = 0
            candidate.savedYaw = null
            candidate.savedPitch = 0
            applyRotation(candidate)
            snapshotMovement(displayed!, candidate)
            emit('moving')
          }
          const elapsed = Math.max(0, animationNow - moveStartedAtAnimationMs)
          const progress = moveDurationMs <= 0 ? 1 : Math.min(1, elapsed / moveDurationMs)
          if (progress < 1) {
            moveStage(easeInOutSmooth(progress))
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
          if (document.activeElement === canvas && !canvas.hasAttribute('data-pointer-focus'))
            acquireController('keyboard')
        } else {
          metadataReady = false
          moving = false
          participants = []
          if (displayed) {
            restStage(displayed)
            drawStage(displayed, null)
          } else clearSurface()
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
            displayed.yaw += ((animationNow - displayed.lastAnimationTimeMs) * FULL_TURN) / 24_000
            applyRotation(displayed)
          }
        }
        restStage(displayed)
        drawStage(displayed, null)
      }
      if (displayed) displayed.lastAnimationTimeMs = animationNow
      if (
        phase === 'ready' &&
        activeControllers.size === 0 &&
        (returning || (!motionPreference.matches && displayed?.savedYaw === null))
      )
        invalidate()
    } catch (error) {
      if (gl.isContextLost()) stopRenderer('The graphics context was lost. Reload the page to view models again.')
      else fail(load, error)
    }
  }

  function invalidate(): void {
    if (!disposed && !released && frame === null && (candidate?.presentation || displayed?.presentation))
      frame = requestAnimationFrame(draw)
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
    if (displayed && motionPreference.matches && activeControllers.size === 0)
      restoreInspection(displayed, animationNow)
    if (eligible()) invalidate()
    else cancelFrame()
  }

  function rotate(): void {
    if (!displayed || phase !== 'ready') return
    applyRotation(displayed)
    invalidate()
  }

  function pointerDown(event: PointerEvent): void {
    if (!event.isPrimary || event.button !== 0 || pointerId !== null || phase !== 'ready' || !displayed || !measure())
      return
    const rect = canvas.getBoundingClientRect()
    pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, 1 - ((event.clientY - rect.top) / rect.height) * 2)
    scene.updateMatrixWorld(true)
    raycaster.setFromCamera(pointer, camera)
    const visible = restOccurrences.filter((item) => item.presentation.visible)
    const hits = raycaster.intersectObjects(visible.map((item) => item.presentation), true)
    if (hits.length) {
      let object: Object3D | null = hits[0].object
      while (object?.parent && object.parent !== scene) object = object.parent
      if (object !== displayed.presentation) return
    }
    canvas.dataset.pointerFocus = ''
    canvas.focus({ preventScroll: true })
    event.preventDefault()
    pointerSurface.setPointerCapture(event.pointerId)
    pointerId = event.pointerId
    acquireController(event.pointerId)
    pointerX = event.clientX
    pointerY = event.clientY
  }

  function pointerMove(event: PointerEvent): void {
    if (event.pointerId !== pointerId || !displayed || !(width > 0 && height > 0)) return
    if ((event.buttons & 1) === 0) {
      endGesture()
      return
    }
    event.preventDefault()
    displayed.yaw += ((event.clientX - pointerX) * FULL_TURN) / width
    displayed.pitch += ((event.clientY - pointerY) * FULL_TURN) / height
    pointerX = event.clientX
    pointerY = event.clientY
    rotate()
  }

  function pointerEnd(event: PointerEvent): void {
    if (event.pointerId === pointerId) endGesture()
  }

  function clearPointerFocus(): void {
    delete canvas.dataset.pointerFocus
  }

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
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight' && event.key !== 'ArrowUp' && event.key !== 'ArrowDown')
      return
    acquireController('keyboard')
    switch (event.key) {
      case 'ArrowLeft':
        displayed.yaw -= KEY_TURN
        break
      case 'ArrowRight':
        displayed.yaw += KEY_TURN
        break
      case 'ArrowUp':
        displayed.pitch -= KEY_TURN
        break
      case 'ArrowDown':
        displayed.pitch += KEY_TURN
        break
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
    pointerSurface.removeEventListener('pointerdown', pointerDown)
    pointerSurface.removeEventListener('pointermove', pointerMove)
    pointerSurface.removeEventListener('pointerup', pointerEnd)
    pointerSurface.removeEventListener('pointercancel', pointerEnd)
    pointerSurface.removeEventListener('lostpointercapture', pointerEnd)
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
      if (!alive(load)) {
        load.resources.retire()
        return
      }
      load.result = result
      if (load.resourceError) throw new Error('An embedded model resource could not be decoded.')
      if (!result.scene) throw new Error('The model does not contain a displayable scene.')
      result.scene.traverse((object) => {
        if (object instanceof Light) object.visible = false
        if (object instanceof Mesh && object.material) {
          const raw = object.material as Material | Material[]
          const mats = Array.isArray(raw) ? raw : [raw]
          for (const m of mats) attachDither(m, load.ditherUniform, edgeDitherUniform)
        }
      })
      result.scene.updateMatrixWorld(true)
      bounds.setFromObject(result.scene, true)
      bounds.getBoundingSphere(sphere)
      if (
        bounds.isEmpty() ||
        !Number.isFinite(sphere.radius) ||
        sphere.radius <= 0 ||
        !Number.isFinite(sphere.center.x) ||
        !Number.isFinite(sphere.center.y) ||
        !Number.isFinite(sphere.center.z)
      ) {
        throw new Error('The model does not contain finite, nonempty geometry.')
      }
      const presentation = new Group()
      const rotation = new Group()
      const normalization = new Group()
      const centering = new Group()
      normalization.scale.setScalar(1 / sphere.radius)
      // Authored roll belongs inside inspection so turntable/return preserve it.
      normalization.rotation.z = (load.zRotation * Math.PI) / 180
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
  if (stage) observer.observe(stage)
  observer.observe(document.body)
  const intersection = new IntersectionObserver((entries) => {
    intersecting = entries[0]?.isIntersecting ?? false
    animationTime(performance.now())
    if (eligible()) invalidate()
    else cancelFrame()
  })
  intersection.observe(canvas)
  motionPreference.addEventListener('change', visibility)
  document.addEventListener('visibilitychange', visibility)
  pointerSurface.addEventListener('pointerdown', pointerDown)
  pointerSurface.addEventListener('pointermove', pointerMove)
  pointerSurface.addEventListener('pointerup', pointerEnd)
  pointerSurface.addEventListener('pointercancel', pointerEnd)
  pointerSurface.addEventListener('lostpointercapture', pointerEnd)
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
      modelId: project.id,
      zRotation: project.zRotation ?? 0,
      abort: new AbortController(),
      manager,
      resources: createLoadResources(),
      resourceError: false,
      result: null,
      presentation: null,
      rotation: null,
      yaw: 0,
      pitch: 0,
      savedYaw: null,
      savedPitch: 0,
      validated: { rendered: 'unvalidated', clay: 'unvalidated', wireframe: 'unvalidated' },
      lastAnimationTimeMs: animationElapsedMs,
      retired: false,
      error: null,
      ditherFade: 0,
      ditherTarget: 1,
      ditherUniform: { value: 0 },
    }
    manager.onError = () => {
      load.resourceError = true
    }
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
      const deadlineOrigin = request.serviceStartedAtMs ?? request.activatedAtMs
      selection = { request, deadlineAtMs: deadlineOrigin === null ? null : deadlineOrigin + SETTLEMENT_DEADLINE_MS }
      ticket = { requestId: request.requestId, modelId: request.model.id }
      metadataReady = false
      if (terminalError) {
        emit('unavailable', terminalError)
        return
      }
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
    setBeltSpacing(spacing: number) {
      if (!Number.isFinite(spacing) || spacing <= 0) return
      beltSpacing = spacing
      measureDirty = true
      measure()
      invalidate()
    },
    getBeltSpacing() {
      return resolvedBeltSpacing
    },
    setOrbitRadius(radius: number) {
      if (!Number.isFinite(radius) || radius <= 0) return
      orbitRadius = radius
      measureDirty = true
      measure()
      invalidate()
    },
    getOrbitRadius() {
      return resolvedBeltSpacing
    },
    dispose() {
      if (disposed) return
      disposed = true
      releaseRuntime()
    },
  }
}
