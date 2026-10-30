import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createModelViewer, type DisplayMode, type MetadataTicket, type ModelViewerController, type ViewerAcceptanceHooks, type ViewerChannel, type ViewerStatus } from '../lib/model-viewer';
import type { Project } from '../types/project';
import { ViewModeControls } from './ViewModeControls';

interface ModelViewerProps {
  readonly projects: readonly Project[];
  readonly status: ViewerStatus;
  readonly title: string;
  readonly onStatus: (status: ViewerStatus) => void;
  readonly onUnavailable: (message: string) => void;
  readonly register: (channel: ViewerChannel) => () => void;
  readonly finalize: (ticket: MetadataTicket) => boolean;
  readonly onCanvas: (canvas: HTMLCanvasElement | null) => void;
  readonly acceptance?: ViewerAcceptanceHooks;
  readonly orbitRadius?: number;
}

export default function ModelViewer({ projects, title, status, onStatus, onUnavailable, register, finalize, onCanvas, acceptance, orbitRadius }: ModelViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const controllerRef = useRef<ModelViewerController | null>(null);
  const instructionsId = useId();
  const [mode, setMode] = useState<DisplayMode>('rendered');
  const attach = useCallback((node: HTMLCanvasElement | null) => {
    canvasRef.current = node;
    onCanvas(node);
  }, [onCanvas]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let active = true;
    let unregister: (() => void) | undefined;
    let controller: ModelViewerController | undefined;
    try {
      controller = createModelViewer(canvas, projects, {
        onStatus: next => { if (active) onStatus(next); },
        finalize: ticket => active && finalize(ticket),
      }, acceptance, { orbitRadius });
      controllerRef.current = controller;
      unregister = register(controller);
    } catch (error) {
      onUnavailable(error instanceof Error ? error.message : '3D rendering is unavailable on this device.');
    }
    return () => {
      active = false;
      unregister?.();
      controllerRef.current = null;
      controller?.dispose();
    };
  }, [projects, finalize, onStatus, onUnavailable, register, acceptance]);

  useEffect(() => { controllerRef.current?.setMode(mode); }, [mode]);
  useEffect(() => {
    if (orbitRadius !== undefined && controllerRef.current?.setOrbitRadius) {
      controllerRef.current.setOrbitRadius(orbitRadius);
    }
  }, [orbitRadius]);

  const ready = status.state === 'ready';
  const loading = status.state === 'loading' || status.state === 'moving';
  const modesAvailable = ready || (status.state === 'loading' && status.displayedId !== null);
  const message = status.state === 'error' || status.state === 'unavailable' ? `${title}: ${status.message}` : '';
  return (
    <div className="model-viewer">
      <div className="viewer-stage" data-state={status.state} aria-busy={loading}>
        <canvas ref={attach} className="model-canvas" role="group" aria-describedby={instructionsId} tabIndex={ready ? 0 : -1}>Interactive 3D model.</canvas>
        <p className="viewer-message" role="status" aria-live="polite" aria-atomic="true">{message}</p>
        <p id={instructionsId} className="viewer-instructions">Drag / arrows: inspect · Release / Tab: return</p>
      </div>
      <ViewModeControls mode={mode} disabled={!modesAvailable} onModeChange={setMode} />
    </div>
  );
}
