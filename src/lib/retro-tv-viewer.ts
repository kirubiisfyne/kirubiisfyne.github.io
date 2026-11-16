import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import controllerUrl from '../../gltf/NESController/NESController.glb?url'
import { gameViewerMotion } from '../data/game-viewer-motion'
import { tvTransform } from '../data/tv-transform'
import { tvDependencies, tvModelUrl } from './retro-tv-assets'

export type TvStatus = 'loading' | 'ready' | 'unavailable'

// Strict Mode can immediately reclaim the same canvas after cleanup.
const contextOwners = new WeakMap<HTMLCanvasElement, THREE.WebGLRenderer>()

export function createRetroTvViewer(
  canvas: HTMLCanvasElement,
  onStatus: (state: TvStatus) => void,
  onControllerStatus: (state: TvStatus) => void,
  onControls: (previous: THREE.Vector2, next: THREE.Vector2) => void,
  onNavigate: (direction: -1 | 1) => void,
) {
  const layer = canvas.parentElement
  const stage = layer?.parentElement
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
  contextOwners.set(canvas, renderer)
  renderer.setClearColor(0, 0)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(38.5800924, 1, 0.0001, 10)
  const referenceCameraRotation = new THREE.Quaternion(0.63854478, -0.0693278, -0.08272904, 0.76197778)
  const cameraUp = new THREE.Vector3(0, 1, 0).applyQuaternion(referenceCameraRotation)
  scene.add(new THREE.HemisphereLight(0xffffff, 0x596683, 1.2))
  // Shared camera-relative key, fill, and rim illuminate both authored models.
  for (const [position, intensity] of [
    [[-4, 6, 8], 3],
    [[5, 2, 4], 1.4],
    [[2, 5, -7], 2],
  ] as const) {
    const light = new THREE.DirectionalLight(0xffffff, intensity)
    light.position.set(position[0], position[1], position[2]).applyQuaternion(referenceCameraRotation)
    scene.add(light)
  }
  const manager = new THREE.LoadingManager()
  manager.setURLModifier((url) => tvDependencies[decodeURIComponent(url.split('/').pop()?.split('?')[0] ?? '')] ?? url)
  const loader = new GLTFLoader(manager)
  const textureLoader = new THREE.TextureLoader()
  const textures = new Map<string, THREE.Texture>()
  let screen: THREE.MeshStandardMaterial | null = null
  let originalMap: THREE.Texture | null = null
  let originalBaseMap: THREE.Texture | null = null
  let desiredUrl: string | null = null
  let desiredRotation: 0 | 180 = 0
  const uvCenter = new THREE.Vector2(0.5, 0.5)
  let request = 0
  let disposed = false
  let contextUnavailable = false
  let root: THREE.Object3D | null = null
  let tilt: THREE.Group | null = null
  let controller: THREE.Group | null = null
  let controllerMotion: THREE.Group | null = null
  let dpad: THREE.Object3D | null = null
  const controllerBase = new THREE.Vector3()
  const tvCenter = new THREE.Vector3()
  let tvUnit = 0.01
  const updateControls = () => {
    if (!dpad || !controller || contextUnavailable) return
    controller.updateMatrixWorld(true)
    const project = (x: number) => {
      const point = dpad!.localToWorld(new THREE.Vector3(x, 0, 0)).project(camera)
      return new THREE.Vector2((point.x + 1) / 2, (1 - point.y) / 2)
    }
    onControls(project(-0.27), project(0.27))
  }
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  const floatIntensity = Number.isFinite(gameViewerMotion.floatIntensity) ? Math.max(0, gameViewerMotion.floatIntensity) : 0
  const floatSpeed = Number.isFinite(gameViewerMotion.floatSpeed) ? Math.max(0, gameViewerMotion.floatSpeed) : 0
  const pressTilt = Number.isFinite(gameViewerMotion.pressTiltDegrees) ? THREE.MathUtils.degToRad(gameViewerMotion.pressTiltDegrees) : 0
  const pressDuration = Number.isFinite(gameViewerMotion.pressDurationMs) ? Math.max(0, gameViewerMotion.pressDurationMs) : 0
  let motionFrame: number | null = null
  let lastFrame = 0
  let floatTime = 0
  let pressElapsed: number | null = null
  let pressDirection: -1 | 1 = 1
  let pressFrom = 0
  const draw = () => {
    if (disposed || contextUnavailable) return
    renderer.render(scene, camera)
    updateControls()
  }
  const noiseFrame = { value: 0 }
  const noiseImage = { value: 0 }
  let noiseTimer: number | null = null
  let visible = false
  const updateNoise = () => {
    if (noiseTimer !== null) window.clearInterval(noiseTimer)
    noiseTimer = null
    if (!screen || disposed || contextUnavailable || !visible || document.hidden || reducedMotion.matches) return
    noiseTimer = window.setInterval(() => {
      noiseFrame.value += 1
      draw()
    }, 100)
  }
  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting
    updateNoise()
    if (visible) scheduleMotion()
    else { cancelMotion(); pressElapsed = null }
  })
  intersection.observe(stage ?? canvas)
  const cancelMotion = () => {
    if (motionFrame !== null) cancelAnimationFrame(motionFrame)
    motionFrame = null
    lastFrame = 0
  }
  const animateMotion = (time: number) => {
    motionFrame = null
    if (disposed || contextUnavailable || reducedMotion.matches || document.hidden || !visible) return
    const elapsed = lastFrame ? Math.min(time - lastFrame, 64) : 0
    lastFrame = time
    // Keep the raycast target steady while a pointer gesture is held.
    if (!press) floatTime += elapsed / 1000
    const phase = floatTime * floatSpeed * Math.PI * 2
    if (tilt) tilt.position.copy(cameraUp).multiplyScalar(Math.sin(phase) * floatIntensity * tvUnit)
    if (controller) controller.position.copy(controllerBase).addScaledVector(cameraUp, Math.sin(phase + 1.2) * floatIntensity * tvUnit)
    if (controllerMotion) {
      if (pressElapsed !== null && !press) pressElapsed += elapsed
      const progress = pressElapsed === null || !pressDuration ? 1 : Math.min(pressElapsed / pressDuration, 1)
      // The motion group uses the FBX/Blender basis, so local Y matches Blender's Y axis.
      // Quintic ease-in-out on each half gives zero velocity and acceleration
      // at rest and at the turn, avoiding a sharp reversal.
      const travel = progress < 0.5 ? progress * 2 : (1 - progress) * 2
      const eased = travel * travel * travel * (travel * (travel * 6 - 15) + 10)
      const target = pressDirection * pressTilt
      controllerMotion.rotation.y = progress < 0.5 ? THREE.MathUtils.lerp(pressFrom, target, eased) : target * eased
      if (progress >= 1) pressElapsed = null
    }
    draw()
    if ((floatSpeed > 0 && floatIntensity > 0 && (tilt || controller)) || pressElapsed !== null) {
      motionFrame = requestAnimationFrame(animateMotion)
    } else lastFrame = 0
  }
  const scheduleMotion = () => {
    if (motionFrame === null && !disposed && !contextUnavailable && !reducedMotion.matches && !document.hidden && visible) {
      motionFrame = requestAnimationFrame(animateMotion)
    }
  }
  const resetMotion = () => {
    pressElapsed = null
    if (tilt) tilt.position.set(0, 0, 0)
    if (controller) controller.position.copy(controllerBase)
    if (controllerMotion) controllerMotion.rotation.y = 0
    draw()
  }
  const onMotionPreference = () => {
    updateNoise()
    if (reducedMotion.matches) { cancelMotion(); resetMotion() }
    else scheduleMotion()
  }
  const onVisibility = () => {
    updateNoise()
    if (document.hidden) { cancelMotion(); pressElapsed = null }
    else { draw(); scheduleMotion() }
  }
  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()
  let press: { id: number; x: number; y: number; direction: -1 | 1 } | null = null
  const directionAt = (event: PointerEvent): -1 | 1 | null => {
    if (!dpad || !controller || disposed || contextUnavailable) return null
    const bounds = canvas.getBoundingClientRect()
    if (!bounds.width || !bounds.height) return null
    pointer.set((event.clientX - bounds.left) / bounds.width * 2 - 1, 1 - (event.clientY - bounds.top) / bounds.height * 2)
    controller.updateMatrixWorld(true)
    raycaster.setFromCamera(pointer, camera)
    const hit = raycaster.intersectObject(dpad, true)[0]
    if (!hit) return null
    const local = dpad.worldToLocal(hit.point.clone())
    if (Math.abs(local.x) < 0.12 || Math.abs(local.x) <= Math.abs(local.y)) return null
    return local.x < 0 ? -1 : 1
  }
  const isInteractiveTarget = (event: PointerEvent) => event.target instanceof Element &&
    Boolean(event.target.closest('a, button, input, select, textarea, [contenteditable="true"]'))
  const pointerDown = (event: PointerEvent) => {
    if (event.button !== 0 || isInteractiveTarget(event)) return
    const direction = directionAt(event)
    press = direction === null ? null : { id: event.pointerId, x: event.clientX, y: event.clientY, direction }
  }
  const pointerUp = (event: PointerEvent) => {
    const started = press
    press = null
    if (!started || started.id !== event.pointerId || isInteractiveTarget(event) || Math.hypot(event.clientX - started.x, event.clientY - started.y) > 8) return
    if (directionAt(event) === started.direction) onNavigate(started.direction)
  }
  const cancelPress = () => { press = null }
  // The expanded canvas is behind page content; listen without intercepting its controls or scrolling.
  window.addEventListener('pointerdown', pointerDown)
  window.addEventListener('pointerup', pointerUp)
  window.addEventListener('pointercancel', cancelPress)
  window.addEventListener('blur', cancelPress)
  document.addEventListener('visibilitychange', onVisibility)
  reducedMotion.addEventListener('change', onMotionPreference)
  const resize = () => {
    if (!layer || !stage) return
    const stageRect = stage.getBoundingClientRect()
    const bodyRect = document.body.getBoundingClientRect()
    const stageCssWidth = parseFloat(getComputedStyle(stage).width)
    if (!(stageRect.width > 0 && stageRect.height > 0 && bodyRect.width > 0 && stageCssWidth > 0)) return
    const cssScale = stageRect.width / stageCssWidth
    const expandedWidth = bodyRect.width / cssScale
    const configuredHeight = parseFloat(getComputedStyle(stage).getPropertyValue('--game-canvas-height-scale'))
    const heightScale = Number.isFinite(configuredHeight) && configuredHeight > 0 ? Math.min(configuredHeight, 4) : 1
    const expandedHeight = expandedWidth * stageRect.height / stageRect.width * heightScale
    layer.style.width = `${expandedWidth}px`
    layer.style.height = `${expandedHeight}px`
    layer.style.left = `${(bodyRect.left - stageRect.left) / cssScale}px`
    layer.style.top = `${(stageRect.height / cssScale - expandedHeight) / 2}px`
    const bounds = canvas.getBoundingClientRect()
    if (!bounds.width || !bounds.height) return
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setSize(bounds.width, bounds.height, false)
    camera.aspect = bounds.width / bounds.height
    // Preserve the original composition size while the canvas extends behind the UI.
    camera.zoom = Math.min(1.9, Math.max(1, stageRect.width / stageRect.height * 1.25))
    const vertical = THREE.MathUtils.degToRad(38.5800924 / 2)
    camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(vertical) * bounds.height / stageRect.height))
    // FBX cameras use a different forward axis. This quaternion includes the
    // -90° local-Y conversion and is expressed in the TV mesh's frame.
    camera.position.set(-0.4117362 * tvUnit, -3.6865014 * tvUnit, 0.5075737 * tvUnit).sub(tvCenter)
    camera.quaternion.copy(referenceCameraRotation)
    camera.near = tvUnit * 0.01
    camera.far = tvUnit * 1000
    camera.updateProjectionMatrix()
    draw()
  }
  const observer = new ResizeObserver(resize)
  const styleObserver = new MutationObserver(resize)
  if (stage) {
    observer.observe(stage)
    styleObserver.observe(stage, { attributes: true, attributeFilter: ['style', 'class'] })
  }
  observer.observe(document.body)
  window.addEventListener('resize', resize)
  resize()
  const disposeObject = (object: THREE.Object3D) => {
    const materials = new Set<THREE.Material>()
    const maps = new Set<THREE.Texture>()
    object.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return
      node.geometry.dispose()
      for (const material of Array.isArray(node.material) ? node.material : [node.material]) materials.add(material)
    })
    for (const material of materials) {
      for (const value of Object.values(material)) if (value instanceof THREE.Texture) maps.add(value)
      material.dispose()
    }
    maps.forEach((texture) => texture.dispose())
  }
  // Relative transform extracted from GameViewer.fbx in the TV mesh's coordinate frame.
  const layoutController = () => {
    if (!controller) return
    controllerBase.set(0.2906699 * tvUnit, -2.4269748 * tvUnit, 0.01 * tvUnit)
      .addScaledVector(cameraUp, 0.12 * tvUnit)
      .sub(tvCenter)
    controller.position.copy(controllerBase)
    controller.quaternion.set(0.37714888, 0.03937235, 0.09607612, 0.92031403)
    controller.scale.setScalar(tvUnit / 6.5)
  }
  new GLTFLoader().load(controllerUrl, (gltf) => {
    if (disposed || contextUnavailable) { disposeObject(gltf.scene); return }
    controller = new THREE.Group()
    // FBX export uses Z-up geometry; restore that basis for the glTF scene.
    gltf.scene.rotation.x = Math.PI / 2
    controllerMotion = new THREE.Group()
    controllerMotion.add(gltf.scene)
    controller.add(controllerMotion)
    // Draw the foreground controller after the TV's depth-independent screen layer.
    controller.traverse((object) => { if (object instanceof THREE.Mesh) object.renderOrder = 2 })
    // The Plane child is the controller's cross-shaped D-pad in the supplied export.
    dpad = gltf.scene.getObjectByName('Plane') ?? null
    layoutController()
    scene.add(controller)
    resize()
    onControllerStatus(dpad ? 'ready' : 'unavailable')
    scheduleMotion()
  }, undefined, () => { if (!disposed) onControllerStatus('unavailable') })
  const setImage = (url: string | null, rotation: 0 | 180 = 0) => {
    desiredUrl = url
    desiredRotation = rotation
    const token = ++request
    if (disposed || contextUnavailable || !screen || !originalMap) return
    const material = screen
    const original = originalMap
    // Show full static while changing channels or when no image is available.
    noiseImage.value = 0
    material.emissiveMap = null
    material.emissive.setRGB(0, 0, 0)
    material.needsUpdate = true
    draw()
    if (!url) return
    onStatus('loading')
    const apply = (texture: THREE.Texture) => {
      if (disposed || contextUnavailable || token !== request) {
        if (textures.get(url) !== texture) texture.dispose()
        return
      }
      texture.channel = original.channel
      texture.mapping = original.mapping
      texture.wrapS = original.wrapS
      texture.wrapT = original.wrapT
      texture.flipY = original.flipY
      texture.colorSpace = original.colorSpace
      texture.offset.copy(original.offset)
      texture.repeat.copy(original.repeat)
      texture.center.copy(rotation === 180 ? uvCenter : original.center)
      texture.rotation = original.rotation + THREE.MathUtils.degToRad(rotation)
      texture.matrixAutoUpdate = rotation === 180 ? true : original.matrixAutoUpdate
      if (texture.matrixAutoUpdate) texture.updateMatrix()
      else texture.matrix.copy(original.matrix)
      texture.needsUpdate = true
      textures.set(url, texture)
      noiseImage.value = 1
      material.emissive.setRGB(1, 1, 1)
      material.emissiveMap = texture
      material.needsUpdate = true
      draw()
      onStatus('ready')
    }
    const cached = textures.get(url)
    if (cached) apply(cached)
    else textureLoader.load(url, apply, undefined, () => { if (!disposed && token === request) onStatus('unavailable') })
  }
  const contextLost = (event: Event) => {
    event.preventDefault()
    if (disposed) return
    contextUnavailable = true
    onControllerStatus('unavailable')
    updateNoise()
    cancelMotion()
    request++
    onStatus('unavailable')
  }
  canvas.addEventListener('webglcontextlost', contextLost)
  loader.load(tvModelUrl, (gltf) => {
    if (disposed || contextUnavailable) { disposeObject(gltf.scene); return }
    const model = gltf.scene
    // Match the FBX geometry basis before applying its camera and layout.
    model.rotation.x = Math.PI / 2
    model.traverse((node) => {
      if (!(node instanceof THREE.Mesh) || !node.name.startsWith('Image')) return
      const material = Array.isArray(node.material) ? node.material.find((item) => item.name === 'm_Screen') : node.material
      if (material?.name !== 'm_Screen' || !(material instanceof THREE.MeshStandardMaterial)) return
      // The exported opaque TV body is slightly in front of the image mesh.
      // Draw only the authored screen image over it, without changing the source mesh.
      screen = material.clone()
      originalBaseMap = screen.map
      screen.map = null
      // The game image is emissive; a white diffuse surface washes it out under the lights.
      screen.color.setRGB(0, 0, 0)
      // Generate colored static independently of the removed authored noise texture.
      screen.onBeforeCompile = (shader) => {
        shader.uniforms.noiseFrame = noiseFrame
        shader.uniforms.noiseImage = noiseImage
        shader.vertexShader = shader.vertexShader.replace('#include <common>', `#include <common>
          varying vec2 vStaticUv;
        `).replace('#include <uv_vertex>', `#include <uv_vertex>
          vStaticUv = uv;
        `)
        shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `#include <common>
          uniform float noiseFrame;
          uniform float noiseImage;
          varying vec2 vStaticUv;
          float staticHash(vec2 cell) {
            return fract(sin(dot(cell, vec2(12.9898, 78.233))) * 43758.5453);
          }
        `).replace('#include <opaque_fragment>', `
          vec2 grainCell = floor(vStaticUv * 180.0) + noiseFrame * vec2(17.0, 29.0);
          vec3 grain = vec3(staticHash(grainCell), staticHash(grainCell + 31.7), staticHash(grainCell + 73.1));
          vec3 staticColor = vec3(0.12) + grain * 0.55;
          vec3 lightenedImage = mix(outgoingLight, max(outgoingLight, grain), 0.12);
          outgoingLight = mix(staticColor, lightenedImage, noiseImage);
          #include <opaque_fragment>
        `)
      }
      screen.depthTest = false
      node.material = screen
      // Flip within the existing UV island, keeping its crop while orienting the artwork.
      const originalGeometry = node.geometry
      node.geometry = originalGeometry.clone()
      originalGeometry.dispose()
      const uv = node.geometry.getAttribute('uv')
      if (uv) {
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
        for (let i = 0; i < uv.count; i++) {
          minX = Math.min(minX, uv.getX(i)); maxX = Math.max(maxX, uv.getX(i))
          minY = Math.min(minY, uv.getY(i)); maxY = Math.max(maxY, uv.getY(i))
        }
        uvCenter.set((minX + maxX) / 2, (minY + maxY) / 2)
        for (let i = 0; i < uv.count; i++) uv.setXY(i, minX + maxX - uv.getX(i), minY + maxY - uv.getY(i))
        uv.needsUpdate = true
      }
      node.renderOrder = 1
    })
    if (!screen || !(screen as THREE.MeshStandardMaterial).emissiveMap) {
      disposeObject(model); onStatus('unavailable'); return
    }
    originalMap = (screen as THREE.MeshStandardMaterial).emissiveMap
    updateNoise()
    const bounds = new THREE.Box3().setFromObject(model)
    const center = bounds.getCenter(new THREE.Vector3())
    tvCenter.copy(center)
    // The glTF scene wraps the authored RootNode (scale 0.01); the scene itself is unit scale.
    tvUnit = model.getObjectByName('RootNode')?.scale.x ?? 0.01
    model.position.sub(center)
    tilt = new THREE.Group()
    tilt.add(model)
    const group = new THREE.Group()
    group.add(tilt)
    group.position.set(...tvTransform.position)
    group.rotation.set(...tvTransform.rotation.map(THREE.MathUtils.degToRad) as [number, number, number], 'XYZ')
    group.scale.set(...tvTransform.scale)
    root = group
    scene.add(group)
    layoutController()
    resize()
    setImage(desiredUrl, desiredRotation)
    scheduleMotion()
  }, undefined, () => { if (!disposed) onStatus('unavailable') })
  return {
    setImage,
    nudge(direction: -1 | 1) {
      if (!controllerMotion || reducedMotion.matches || !visible || document.hidden || disposed || contextUnavailable || !pressDuration || !pressTilt) return
      pressDirection = direction
      pressFrom = controllerMotion.rotation.y
      pressElapsed = 0
      scheduleMotion()
    },
    dispose() {
      disposed = true
      request++
      observer.disconnect()
      styleObserver.disconnect()
      intersection.disconnect()
      updateNoise()
      cancelMotion()
      window.removeEventListener('pointerdown', pointerDown)
      window.removeEventListener('pointerup', pointerUp)
      window.removeEventListener('pointercancel', cancelPress)
      window.removeEventListener('blur', cancelPress)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVisibility)
      reducedMotion.removeEventListener('change', onMotionPreference)
      canvas.removeEventListener('webglcontextlost', contextLost)
      if (root) disposeObject(root)
      if (controller) disposeObject(controller)
      originalMap?.dispose()
      originalBaseMap?.dispose()
      textures.forEach((texture) => texture.dispose())
      renderer.dispose()
      queueMicrotask(() => {
        if (contextOwners.get(canvas) !== renderer) return
        contextOwners.delete(canvas)
        if (!renderer.getContext().isContextLost()) renderer.forceContextLoss()
      })
    },
  }
}
