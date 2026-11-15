import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { tvTransform } from '../data/tv-transform'
import { tvDependencies, tvModelUrl } from './retro-tv-assets'

export type TvStatus = 'loading' | 'ready' | 'unavailable'

// Strict Mode can immediately reclaim the same canvas after cleanup.
const contextOwners = new WeakMap<HTMLCanvasElement, THREE.WebGLRenderer>()

export function createRetroTvViewer(canvas: HTMLCanvasElement, onStatus: (state: TvStatus) => void) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
  contextOwners.set(canvas, renderer)
  renderer.setClearColor(0, 0)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 1000)
  scene.add(new THREE.HemisphereLight(0xffffff, 0x596683, 2.2))
  const light = new THREE.DirectionalLight(0xffffff, 2.5)
  light.position.set(3, 5, 6)
  scene.add(light)
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
  const halfSize = new THREE.Vector3(1, 1, 1)
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  const targetTilt = new THREE.Vector2()
  let motionFrame: number | null = null
  let lastFrame = 0
  const draw = () => { if (!disposed && !contextUnavailable) renderer.render(scene, camera) }
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
  })
  intersection.observe(canvas)
  const cancelMotion = () => {
    if (motionFrame !== null) cancelAnimationFrame(motionFrame)
    motionFrame = null
    lastFrame = 0
  }
  const animateTilt = (time: number) => {
    motionFrame = null
    if (!tilt || disposed || contextUnavailable || reducedMotion.matches || document.hidden) return
    const elapsed = lastFrame ? Math.min(time - lastFrame, 64) : 16
    lastFrame = time
    const blend = 1 - Math.exp(-elapsed / 140)
    tilt.rotation.x += (targetTilt.x - tilt.rotation.x) * blend
    tilt.rotation.y += (targetTilt.y - tilt.rotation.y) * blend
    if (Math.abs(targetTilt.x - tilt.rotation.x) < 0.0001 && Math.abs(targetTilt.y - tilt.rotation.y) < 0.0001) {
      tilt.rotation.x = targetTilt.x
      tilt.rotation.y = targetTilt.y
      lastFrame = 0
    } else motionFrame = requestAnimationFrame(animateTilt)
    draw()
  }
  const scheduleMotion = () => {
    if (tilt && motionFrame === null && !disposed && !contextUnavailable && !reducedMotion.matches && !document.hidden) {
      motionFrame = requestAnimationFrame(animateTilt)
    }
  }
  const resetTilt = () => { targetTilt.set(0, 0); scheduleMotion() }
  const onPointerMove = (event: PointerEvent) => {
    if (event.pointerType === 'touch' || reducedMotion.matches || document.hidden) return
    const x = THREE.MathUtils.clamp(event.clientX / Math.max(window.innerWidth, 1) * 2 - 1, -1, 1)
    const y = THREE.MathUtils.clamp(event.clientY / Math.max(window.innerHeight, 1) * 2 - 1, -1, 1)
    targetTilt.set(y * 0.045, x * 0.07)
    scheduleMotion()
  }
  const onPointerOut = (event: PointerEvent) => { if (!event.relatedTarget) resetTilt() }
  const onMotionPreference = () => {
    updateNoise()
    if (reducedMotion.matches) {
      cancelMotion()
      targetTilt.set(0, 0)
      if (tilt) { tilt.rotation.set(0, 0, 0); draw() }
    }
  }
  const onVisibility = () => {
    updateNoise()
    if (document.hidden) {
      cancelMotion()
      targetTilt.set(0, 0)
      if (tilt) tilt.rotation.set(0, 0, 0)
    } else draw()
  }
  window.addEventListener('pointermove', onPointerMove, { passive: true })
  window.addEventListener('pointerout', onPointerOut)
  window.addEventListener('blur', resetTilt)
  document.addEventListener('visibilitychange', onVisibility)
  reducedMotion.addEventListener('change', onMotionPreference)
  const resize = () => {
    const bounds = canvas.getBoundingClientRect()
    if (!bounds.width || !bounds.height) return
    renderer.setSize(bounds.width, bounds.height, false)
    camera.aspect = bounds.width / bounds.height
    const vertical = THREE.MathUtils.degToRad(camera.fov / 2)
    const horizontal = Math.atan(Math.tan(vertical) * camera.aspect)
    // Fit the default model to 80% of canvas height, while preserving side margins on narrow screens.
    const heightDistance = halfSize.y / (0.8 * Math.tan(vertical))
    const widthDistance = halfSize.x / (0.9 * Math.tan(horizontal))
    camera.position.set(0, 0, Math.max(heightDistance, widthDistance) + halfSize.z)
    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix()
    draw()
  }
  const observer = new ResizeObserver(resize)
  observer.observe(canvas)
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
    updateNoise()
    cancelMotion()
    request++
    onStatus('unavailable')
  }
  canvas.addEventListener('webglcontextlost', contextLost)
  loader.load(tvModelUrl, (gltf) => {
    if (disposed || contextUnavailable) { disposeObject(gltf.scene); return }
    const model = gltf.scene
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
    halfSize.copy(bounds.getSize(new THREE.Vector3())).multiplyScalar(0.5)
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
    resize()
    setImage(desiredUrl, desiredRotation)
    scheduleMotion()
  }, undefined, () => { if (!disposed) onStatus('unavailable') })
  return {
    setImage,
    dispose() {
      disposed = true
      request++
      observer.disconnect()
      intersection.disconnect()
      updateNoise()
      cancelMotion()
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerout', onPointerOut)
      window.removeEventListener('blur', resetTilt)
      document.removeEventListener('visibilitychange', onVisibility)
      reducedMotion.removeEventListener('change', onMotionPreference)
      canvas.removeEventListener('webglcontextlost', contextLost)
      if (root) disposeObject(root)
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
