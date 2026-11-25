import { lstatSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { technicalBreakdownPlugin } from './src/lib/technical-breakdown-plugin';

function discoverModelPaths(root: string): string[] {
  let rootInfo;
  try {
    rootInfo = lstatSync(root);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }

  if (rootInfo.isSymbolicLink()) return [];
  if (!rootInfo.isDirectory()) throw new Error(`Model root is not a directory: ${root}`);

  const paths: string[] = [];
  function visit(directory: string, prefix: string): void {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        visit(join(directory, entry.name), relativePath);
      } else if (entry.isFile() && entry.name.endsWith('.glb')) {
        paths.push(relativePath);
      }
    }
  }

  visit(root, '');
  return paths.sort();
}

function discoverModelConfigs(root: string, paths: readonly string[]) {
  const configs: Record<string, { zRotation?: number; name?: string; description?: string }> = {};
  for (const path of paths) {
    const sidecar = join(root, path.replace(/\.glb$/, '.config.json'));
    let text: string;
    try {
      if (!lstatSync(sidecar).isFile()) continue;
      text = readFileSync(sidecar, 'utf8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') continue;
      throw error;
    }
    try {
      const value: unknown = JSON.parse(text);
      if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error('Expected a JSON object.');
      }
      const config = value as Record<string, unknown>;
      const parsed: { zRotation?: number; name?: string; description?: string } = {};
      for (const key of Object.keys(config)) {
        if (key !== 'zRotation' && key !== 'name' && key !== 'description') {
          throw new Error(`Unknown field "${key}".`);
        }
      }
      if (config.zRotation !== undefined) {
        if (typeof config.zRotation !== 'number' || !Number.isFinite(config.zRotation)) {
          throw new Error('"zRotation" must be a finite number in degrees.');
        }
        parsed.zRotation = config.zRotation;
      }
      for (const key of ['name', 'description'] as const) {
        if (config[key] === undefined) continue;
        if (typeof config[key] !== 'string') throw new Error(`"${key}" must be a string.`);
        const trimmed = config[key].trim();
        if (trimmed) parsed[key] = trimmed;
      }
      configs[path] = parsed;
    } catch (error) {
      throw new Error(`Invalid model config ${sidecar}: ${(error as Error).message}`);
    }
  }
  return configs;
}

const modelRoot = resolve(import.meta.dirname, 'glb');
const modelPaths = discoverModelPaths(modelRoot);
const modelConfigPaths = new Set(
  modelPaths.map((path) => resolve(modelRoot, path.replace(/\.glb$/, '.config.json')))
);

export default defineConfig({
  publicDir: 'glb',
  define: {
    __MODEL_PATHS__: JSON.stringify(modelPaths),
    __MODEL_CONFIGS__: JSON.stringify(discoverModelConfigs(modelRoot, modelPaths)),
  },
  plugins: [
    react(),
    tailwindcss(),
    technicalBreakdownPlugin(),
    {
      name: 'refresh-model-configs',
      apply: 'serve',
      async hotUpdate({ file, server }) {
        if (this.environment.name !== 'client' || !modelConfigPaths.has(resolve(file))) return;
        // Re-evaluate the injected catalog instead of reloading stale define values.
        await server.restart();
        return [];
      },
    },
  ],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      input: {
        overview: resolve(import.meta.dirname, 'index.html'),
        development: resolve(import.meta.dirname, 'development/index.html'),
        gallery: resolve(import.meta.dirname, 'gallery/index.html'),
        gameDev: resolve(import.meta.dirname, 'game-dev/index.html'),
        art3d: resolve(import.meta.dirname, '3d-art/index.html'),
        graphicDesign: resolve(import.meta.dirname, 'graphic-design/index.html'),
      },
    },
  },
});
