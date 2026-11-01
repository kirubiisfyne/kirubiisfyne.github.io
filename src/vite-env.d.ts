/// <reference types="vite/client" />

declare const __MODEL_PATHS__: readonly string[]
declare const __MODEL_CONFIGS__: Readonly<
  Record<string, { readonly zRotation?: number; readonly name?: string; readonly description?: string } | undefined>
>
