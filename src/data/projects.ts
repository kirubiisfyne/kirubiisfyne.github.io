import type { Project } from '../types/project'

const filenameCounts = new Map<string, number>()
for (const path of __MODEL_PATHS__) {
  const filename = path.slice(path.lastIndexOf('/') + 1)
  filenameCounts.set(filename, (filenameCounts.get(filename) ?? 0) + 1)
}

export const projects: readonly Project[] = __MODEL_PATHS__.map((path) => {
  const separator = path.lastIndexOf('/')
  const filename = path.slice(separator + 1)
  const parent = separator === -1 ? '.' : path.slice(0, separator)
  const title = filenameCounts.get(filename)! > 1 ? `${filename} (${parent})` : filename
  const modelUrl = import.meta.env.BASE_URL + path.split('/').map(encodeURIComponent).join('/')
  const config = __MODEL_CONFIGS__[path]

  return {
    id: path,
    title: config?.name ?? title,
    modelUrl,
    ...(config?.description ? { description: config.description } : {}),
    zRotation: config?.zRotation ?? 0,
    ...(config?.specifications ? { specifications: config.specifications } : {}),
  }
})
