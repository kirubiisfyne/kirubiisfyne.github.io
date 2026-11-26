import type { Project } from '../types/project'

export function projectCaption(project: Project): string {
  const specs = project.specifications
  if (!specs) return project.description ?? ''
  const values = [
    specs.triangleCount === undefined ? '' : `Triangles: ${specs.triangleCount.toLocaleString('en-US')}`,
    specs.vertexCount === undefined ? '' : `Vertices: ${specs.vertexCount.toLocaleString('en-US')}`,
    specs.textureResolution ? `Textures: ${specs.textureResolution}` : '',
    specs.materialCount === undefined ? '' : `Materials: ${specs.materialCount}`,
    specs.uvMapping ? `UV mapping: ${specs.uvMapping}` : '',
    specs.software ? `Software: ${specs.software}` : '',
    specs.materialWorkflow ? `Workflow: ${specs.materialWorkflow}` : '',
    specs.targetPlatform ? `Target: ${specs.targetPlatform}` : '',
  ].filter(Boolean)
  return [project.description, values.join(' · ')].filter(Boolean).join('\n')
}
