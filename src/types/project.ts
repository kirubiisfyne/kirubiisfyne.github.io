export interface ModelSpecifications {
  readonly triangleCount?: number
  readonly vertexCount?: number
  readonly textureResolution?: string
  readonly materialCount?: number
  readonly uvMapping?: string
  readonly software?: string
  readonly materialWorkflow?: string
  readonly targetPlatform?: string
}

export interface Project {
  readonly id: string
  readonly title: string
  readonly modelUrl: string
  readonly description?: string
  readonly zRotation?: number
  readonly specifications?: ModelSpecifications
}
