import { useEffect } from 'react'
import { mountAsciiMetaballs } from '../../ascii-metaballs.js'

export function MetaballBackground() {
  useEffect(() => mountAsciiMetaballs(document.body), [])
  return null
}
