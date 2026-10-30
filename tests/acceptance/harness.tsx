import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ProjectCarousel, type AcceptanceControls } from '../../src/components/ProjectCarousel';
import type { DisplayMode, MetadataTicket, ViewerStatus } from '../../src/lib/model-viewer';
import type { Project } from '../../src/types/project';
import '../../src/styles.css';

export const FIXTURE_PROJECTS: readonly Project[] = [
  {
    id: 'fixture-a',
    title: 'Fixture Model Alpha',
    description: 'First distinct asymmetric textured model with red accents.',
    modelUrl: '/tests/support/fixtures/a.glb',
  },
  {
    id: 'fixture-b',
    title: 'Fixture Model Beta',
    description: 'Second distinct asymmetric textured model with green accents.',
    modelUrl: '/tests/support/fixtures/b.glb',
  },
  {
    id: 'fixture-c',
    title: 'Fixture Model Gamma',
    description: 'Third distinct asymmetric textured model with blue accents.',
    modelUrl: '/tests/support/fixtures/c.glb',
  },
] as const;

export const FOUR_FIXTURE_PROJECTS: readonly Project[] = [
  ...FIXTURE_PROJECTS,
  {
    id: 'fixture-d',
    title: 'Fixture Model Delta',
    description: 'Fourth distinct asymmetric textured model with purple accents.',
    modelUrl: '/tests/support/fixtures/d.glb',
  },
];

export const BROKEN_FIXTURE_PROJECTS: readonly Project[] = [
  ...FIXTURE_PROJECTS.slice(0, 1),
  {
    id: 'fixture-broken',
    title: 'Fixture Broken Model',
    description: 'Corrupted texture decode test fixture.',
    modelUrl: '/tests/support/fixtures/broken-image.glb',
  },
  ...FIXTURE_PROJECTS.slice(2),
] as const;

export interface CapturedClick {
  readonly type: string;
  readonly targetTag: string;
  readonly targetLabel: string | null;
  readonly button: number;
  readonly timeStamp: number;
  readonly timeOrigin: number;
  readonly performanceNow: number;
}

export interface CandidateValidation {
  readonly requestId: number;
  readonly modelId: string;
  readonly timestamp: number;
}

export interface PresentationDraw {
  readonly requestId: number;
  readonly displayedId: string;
  readonly timestamp: number;
  readonly position: [number, number, number];
  readonly scale: [number, number, number];
  readonly phase: ViewerStatus['state'];
  readonly progress: number | null;
  readonly participants: { modelId: string; position: [number, number, number]; scale: [number, number, number]; pose: [number, number] }[];
}

export interface MutationRecordEntry {
  readonly type: 'position' | 'canvas-name';
  readonly value: string;
  readonly timestamp: number;
}

const nativeClicks: CapturedClick[] = [];
const candidateValidations: CandidateValidation[] = [];
const presentationDraws: PresentationDraw[] = [];
const observedMutations: MutationRecordEntry[] = [];
const failedPreviews = new Set<string>();
const failPreview = (id: string, mode: DisplayMode) => { failedPreviews.add(`${id}:${mode}`); };
const failedCandidates = new Set<string>();
const failCandidate = (id: string, mode: DisplayMode) => { failedCandidates.add(`${id}:${mode}`); };
let preparationDelay = 0;
const exhaustPreparation = (milliseconds: number) => { preparationDelay = milliseconds; };

document.addEventListener(
  'click',
  (event) => {
    const target = event.target as HTMLElement | null;
    const button = target?.closest('button');
    nativeClicks.push({
      type: event.type,
      targetTag: target?.tagName.toLowerCase() ?? '',
      targetLabel: button?.getAttribute('aria-label') ?? target?.getAttribute('aria-label') ?? null,
      button: event.button,
      timeStamp: event.timeStamp > 1e12 ? event.timeStamp - performance.timeOrigin : event.timeStamp,
      timeOrigin: performance.timeOrigin,
      performanceNow: performance.now(),
    });
  },
  { capture: true },
);

type Gate = { promise: Promise<void>; resolve: () => void };
const metadataGates = new Map<string, Gate>();

function getGateKeys(ticket: { requestId?: number; modelId?: string }): string[] {
  const keys: string[] = [];
  if (ticket.requestId !== undefined && ticket.modelId !== undefined) {
    keys.push(`${ticket.requestId}:${ticket.modelId}`);
  }
  if (ticket.requestId !== undefined) {
    keys.push(String(ticket.requestId));
  }
  if (ticket.modelId !== undefined) {
    keys.push(ticket.modelId);
  }
  return keys;
}

function holdMetadataGate(ticket: { requestId?: number; modelId?: string }) {
  const { promise, resolve } = Promise.withResolvers<void>();
  const gate: Gate = { promise, resolve };
  const keys = getGateKeys(ticket);
  for (const k of keys) {
    metadataGates.set(k, gate);
  }
  return {
    release: () => {
      resolve();
      for (const k of keys) {
        metadataGates.delete(k);
      }
    },
  };
}

function clearGates() {
  for (const gate of metadataGates.values()) {
    gate.resolve();
  }
  metadataGates.clear();
}

function getMetadataGate(ticket: MetadataTicket): Promise<void> | null {
  const keys = [`${ticket.requestId}:${ticket.modelId}`, String(ticket.requestId), ticket.modelId];
  for (const k of keys) {
    const gate = metadataGates.get(k);
    if (gate) return gate.promise;
  }
  return null;
}

function onCandidateValidated(info: { requestId: number; modelId: string }) {
  candidateValidations.push({ ...info, timestamp: performance.now() });
}

function onPresentationDrawn(info: PresentationDraw) {
  presentationDraws.push(info);
}

let lastPositionText = '';
const observer = new MutationObserver((mutations) => {
  const now = performance.now();
  for (const m of mutations) {
    if (m.target instanceof HTMLElement) {
      if (m.target.classList.contains('carousel-position')) {
        const text = m.target.textContent ?? '';
        if (text && text !== lastPositionText) {
          lastPositionText = text;
          observedMutations.push({ type: 'position', value: text, timestamp: now });
        }
      }
      if (m.type === 'attributes' && m.attributeName === 'aria-label' && m.target.tagName.toLowerCase() === 'canvas') {
        const name = m.target.getAttribute('aria-label') ?? '';
        observedMutations.push({ type: 'canvas-name', value: name, timestamp: now });
      }
    }
  }
});
observer.observe(document.body, { childList: true, subtree: true, attributes: true, characterData: true });

function resetState() {
  nativeClicks.length = 0;
  candidateValidations.length = 0;
  presentationDraws.length = 0;
  observedMutations.length = 0;
  failedPreviews.clear();
  failedCandidates.clear();
  preparationDelay = 0;
  clearGates();
}

let setCatalogGlobal: ((projects: readonly Project[]) => void) | null = null;

declare global {
  interface Window {
    __ACCEPTANCE__?: {
      nativeClicks: CapturedClick[];
      candidateValidations: CandidateValidation[];
      presentationDraws: PresentationDraw[];
      observedMutations: MutationRecordEntry[];
      holdMetadataGate: typeof holdMetadataGate;
      clearGates: typeof clearGates;
      failPreview: typeof failPreview;
      failCandidate: typeof failCandidate;
      exhaustPreparation: typeof exhaustPreparation;
      timeOrigin: number;
      reset: () => void;
      setCatalog: (projects: readonly Project[]) => void;
    };
  }
}

window.__ACCEPTANCE__ = {
  nativeClicks,
  candidateValidations,
  presentationDraws,
  observedMutations,
  holdMetadataGate,
  clearGates,
  failPreview,
  failCandidate,
  exhaustPreparation,
  timeOrigin: performance.timeOrigin,
  reset: resetState,
  setCatalog: (projects: readonly Project[]) => {
    setCatalogGlobal?.(projects);
  },
};

function getInitialCatalog(): readonly Project[] {
  const params = new URLSearchParams(window.location.search);
  const query = params.get('catalog');
  if (query === 'single') return FIXTURE_PROJECTS.slice(0, 1);
  if (query === 'empty') return [];
  if (query === 'broken') return BROKEN_FIXTURE_PROJECTS;
  const catalog = query === 'four' ? FOUR_FIXTURE_PROJECTS
    : query === 'two' ? FIXTURE_PROJECTS.slice(0, 2) : FIXTURE_PROJECTS;
  const start = Number(params.get('start') ?? 0);
  const index = Number.isInteger(start) ? ((start % catalog.length) + catalog.length) % catalog.length : 0;
  return [...catalog.slice(index), ...catalog.slice(0, index)];
}

const acceptance: AcceptanceControls = {
  getMetadataGate,
  failPreviewValidation: (id, mode) => failedPreviews.has(`${id}:${mode}`),
  failCandidateValidation: (id, mode) => failedCandidates.has(`${id}:${mode}`),
  onCandidatePreparation: () => {
    const until = performance.now() + preparationDelay;
    preparationDelay = 0;
    while (performance.now() < until) { /* Simulate expensive preflight on the real activation clock. */ }
  },
  onCandidateValidated,
  onPresentationDrawn,
};

function HarnessApp() {
  const [catalog, setCatalog] = useState<readonly Project[]>(getInitialCatalog);

  useEffect(() => {
    setCatalogGlobal = setCatalog;
    return () => {
      setCatalogGlobal = null;
    };
  }, []);

  return (
    <main className="mx-auto flex w-full max-w-[1280px] flex-col gap-[20px] p-[20px] sm:p-[40px] lg:p-[64px]">
      <ProjectCarousel projects={catalog} acceptance={acceptance} />
    </main>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <HarnessApp />
    </StrictMode>,
  );
}
