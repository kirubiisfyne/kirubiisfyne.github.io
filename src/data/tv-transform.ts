// Position uses scene units; rotation uses degrees in XYZ order; scale is per axis.
export const tvTransform = {
  position: [-0.002, 0, 0],
  rotation: [0, 0, 24],
  scale: [1.3, 1.3, 1.3],
} as const

if (![...tvTransform.position, ...tvTransform.rotation, ...tvTransform.scale].every(Number.isFinite) || tvTransform.scale.some((value) => value <= 0)) {
  throw new Error('Invalid TV transform: position and rotation must be finite, and scale must be positive and finite.')
}
