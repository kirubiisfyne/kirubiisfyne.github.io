import model from '../../gltf/practice_tv/practice_tv.gltf?url'
import binary from '../../gltf/practice_tv/practice_tv.bin?url'
import screenBase from '../../gltf/practice_tv/m_Screen_baseColor.png?url'
import screenEmissive from '../../gltf/practice_tv/m_Screen_emissive.png?url'
import screenNormal from '../../gltf/practice_tv/m_Screen_normal.png?url'
import screenOrm from '../../gltf/practice_tv/m_Screen_occlusionRoughnessMetallic.png?url'
import tvBase from '../../gltf/practice_tv/m_TV_baseColor.png?url'
import tvNormal from '../../gltf/practice_tv/m_TV_normal.png?url'
import tvOrm from '../../gltf/practice_tv/m_TV_occlusionRoughnessMetallic.png?url'

export const tvModelUrl = model
export const tvDependencies: Record<string, string> = {
  'practice_tv.bin': binary,
  'm_Screen_baseColor.png': screenBase,
  'm_Screen_emissive.png': screenEmissive,
  'm_Screen_normal.png': screenNormal,
  'm_Screen_occlusionRoughnessMetallic.png': screenOrm,
  'm_TV_baseColor.png': tvBase,
  'm_TV_normal.png': tvNormal,
  'm_TV_occlusionRoughnessMetallic.png': tvOrm,
}
