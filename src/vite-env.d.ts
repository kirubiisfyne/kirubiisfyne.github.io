/// <reference types="vite/client" />

declare const __MODEL_PATHS__: readonly string[]
declare const __MODEL_CONFIGS__: Readonly<
  Record<
    string,
    | {
        readonly zRotation?: number
        readonly name?: string
        readonly description?: string
        readonly specifications?: import('./types/project').ModelSpecifications
      }
    | undefined
  >
>
