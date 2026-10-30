import { lstatSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

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

function discoverModelDescriptions(root: string, paths: readonly string[]): Record<string, string> {
  const descriptions: Record<string, string> = {};
  for (const path of paths) {
    const sidecar = join(root, path.replace(/\.glb$/, '.description.txt'));
    try {
      if (!lstatSync(sidecar).isFile()) continue;
      const description = readFileSync(sidecar, 'utf8').trim();
      if (description) descriptions[path] = description;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  }
  return descriptions;
}

const modelRoot = resolve(import.meta.dirname, 'glb');
const modelPaths = discoverModelPaths(modelRoot);

export default defineConfig({
  publicDir: 'glb',
  define: {
    __MODEL_PATHS__: JSON.stringify(modelPaths),
    __MODEL_DESCRIPTIONS__: JSON.stringify(discoverModelDescriptions(modelRoot, modelPaths)),
  },
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 1000,
  },
});
