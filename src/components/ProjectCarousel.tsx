import {
  Component,
  type CSSProperties,
  lazy,
  type MouseEvent,
  type ReactNode,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import navigationDefault from '../assets/figma/navigation-default.svg'
import navigationHover from '../assets/figma/navigation-hover.svg'
import type {
  MetadataTicket,
  ViewerAcceptanceHooks,
  ViewerChannel,
  ViewerSelectionRequest,
  ViewerStatus,
} from '../lib/model-viewer'
import type { Project } from '../types/project'
import { CarouselMetadata, type MetadataAcceptanceHooks, type MetadataPart } from './CarouselMetadata'

export interface AcceptanceControls extends ViewerAcceptanceHooks, MetadataAcceptanceHooks {}

interface ProjectCarouselProps {
  readonly projects: readonly Project[]
  readonly acceptance?: AcceptanceControls
  readonly orbitRadius?: number
}
const modelViewerPromise = import('./ModelViewer')
const ModelViewer = lazy(() => modelViewerPromise)
const navigationArtwork = {
  '--navigation-default': `url("${navigationDefault}")`,
  '--navigation-hover': `url("${navigationHover}")`,
} as CSSProperties

class ViewerBoundary extends Component<
  { readonly children: ReactNode; readonly onFailure: (message: string) => void },
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: Error) {
    this.props.onFailure(error.message)
  }
  render() {
    return this.state.failed ? (
      <p className="viewer-fallback" role="status">
        3D viewer could not be loaded. Reload the page to try again.
      </p>
    ) : (
      this.props.children
    )
  }
}

type Selection = {
  index: number
  requestId: number
  direction: ViewerSelectionRequest['direction']
  activatedAtMs: number | null
}
type MetadataProof = { readonly ticket: MetadataTicket; readonly node: HTMLElement }

export function ProjectCarousel({ projects, acceptance, orbitRadius }: ProjectCarouselProps) {
  const [view, setView] = useState<Selection>({ index: 0, requestId: 0, direction: null, activatedAtMs: null })
  const current = useRef(view)
  const phase = useRef<ViewerStatus['state']>('loading')
  const [status, setStatus] = useState<ViewerStatus>({
    requestId: 0,
    requestedId: projects[0]?.id ?? '',
    displayedId: null,
    state: 'loading',
  })
  const channel = useRef<ViewerChannel | null>(null)
  const nodes = useRef<Partial<Record<MetadataPart, HTMLElement>>>({})
  const proofs = useRef<Partial<Record<MetadataPart, MetadataProof>>>({})
  const canvas = useRef<HTMLCanvasElement | null>(null)
  const position = useRef<HTMLParagraphElement>(null)
  const announced = useRef<number | null>(null)
  const terminal = useRef<string | null>(null)
  const failureFrame = useRef<number | null>(null)
  const project = projects[view.index]
  const canNavigate = projects.length > 1

  const curtain = useCallback(() => {
    for (const node of Object.values(nodes.current)) {
      delete node.dataset.revealed
      node.setAttribute('aria-hidden', 'true')
      node.inert = true
    }
    canvas.current?.setAttribute('aria-label', '3D model loading')
  }, [])

  const metadataIsCurrent = useCallback(
    (ticket: MetadataTicket) => {
      const selected = current.current
      const target = projects[selected.index]
      if (!target || ticket.requestId !== selected.requestId || ticket.modelId !== target.id) return false
      for (const part of ['title', 'caption'] as const) {
        const proof = proofs.current[part]
        const node = nodes.current[part]
        const text = part === 'title' ? `[ ${target.title} ]` : (target.description ?? '')
        if (
          !proof ||
          proof.node !== node ||
          !node?.isConnected ||
          proof.ticket.requestId !== ticket.requestId ||
          proof.ticket.modelId !== ticket.modelId ||
          node.dataset.selectionId !== String(ticket.requestId) ||
          node.dataset.modelId !== target.id ||
          node.textContent !== text ||
          (part === 'caption' && node.hidden !== !target.description)
        )
          return false
      }
      return true
    },
    [projects]
  )

  const reveal = useCallback(
    (ticket: MetadataTicket, success: boolean) => {
      if (
        !metadataIsCurrent(ticket) ||
        (success &&
          (!canvas.current || !channel.current || phase.current === 'error' || phase.current === 'unavailable'))
      )
        return false
      const selected = current.current
      const target = projects[selected.index]!
      for (const node of Object.values(nodes.current)) {
        node.dataset.revealed = ''
        node.removeAttribute('aria-hidden')
        node.inert = false
      }
      canvas.current?.setAttribute(
        'aria-label',
        success ? `3D model: ${target.title}` : `3D model unavailable: ${target.title}`
      )
      if (success) {
        phase.current = 'ready'
        if (announced.current !== ticket.requestId && position.current) {
          position.current.replaceChildren(
            document.createTextNode(`${selected.index + 1} of ${projects.length}: ${target.title}`)
          )
          announced.current = ticket.requestId
        }
      }
      return true
    },
    [metadataIsCurrent, projects]
  )

  const scheduleFailure = useCallback(() => {
    if (failureFrame.current !== null || (phase.current !== 'error' && phase.current !== 'unavailable')) return
    failureFrame.current = requestAnimationFrame(() => {
      failureFrame.current = null
      const selected = current.current
      const target = projects[selected.index]
      if (target && (phase.current === 'error' || phase.current === 'unavailable')) {
        reveal({ requestId: selected.requestId, modelId: target.id }, false)
      }
    })
  }, [projects, reveal])

  const onStatus = useCallback(
    (next: ViewerStatus) => {
      if (next.requestId !== current.current.requestId || next.requestedId !== projects[current.current.index]?.id)
        return
      phase.current = next.state
      if (next.state === 'unavailable') terminal.current = next.message
      setStatus(next)
      scheduleFailure()
    },
    [projects, scheduleFailure]
  )

  const onUnavailable = useCallback(
    (message: string) => {
      terminal.current = message
      const selected = current.current
      const target = projects[selected.index]
      if (target)
        onStatus({
          requestId: selected.requestId,
          requestedId: target.id,
          displayedId: null,
          state: 'unavailable',
          message,
        })
    },
    [onStatus, projects]
  )

  const register = useCallback(
    (next: ViewerChannel) => {
      channel.current = next
      curtain()
      const selected = current.current
      const target = projects[selected.index]
      if (target) {
        const ticket = { requestId: selected.requestId, modelId: target.id }
        next.select({ ...selected, model: target })
        next.setMetadataReady(ticket, metadataIsCurrent(ticket))
      }
      return () => {
        if (channel.current === next) channel.current = null
      }
    },
    [curtain, metadataIsCurrent, projects]
  )

  const onAttach = useCallback((part: MetadataPart, node: HTMLElement | null) => {
    if (!node) {
      delete nodes.current[part]
      return
    }
    nodes.current[part] = node
    delete node.dataset.revealed
    node.setAttribute('aria-hidden', 'true')
    node.inert = true
  }, [])

  const onVerify = useCallback(
    (ticket: MetadataTicket, part: MetadataPart, node: HTMLElement) => {
      const proof = { ticket, node }
      proofs.current[part] = proof
      channel.current?.setMetadataReady(ticket, metadataIsCurrent(ticket))
      // Suspense or Strict Mode can reattach verified metadata after the
      // centered draw finalized. Restore that same settled ticket without
      // issuing another announcement; stale or partial proofs stay curtained.
      if (phase.current === 'ready' && announced.current === ticket.requestId && metadataIsCurrent(ticket)) {
        reveal(ticket, true)
      }
      scheduleFailure()
      return () => {
        if (proofs.current[part] !== proof) return
        delete proofs.current[part]
        channel.current?.setMetadataReady(ticket, false)
      }
    },
    [metadataIsCurrent, reveal, scheduleFailure]
  )

  const onCanvas = useCallback((node: HTMLCanvasElement | null) => {
    canvas.current = node
    node?.setAttribute('aria-label', '3D model loading')
  }, [])
  const finalize = useCallback((ticket: MetadataTicket) => reveal(ticket, true), [reveal])

  useEffect(
    () => () => {
      if (failureFrame.current !== null) cancelAnimationFrame(failureFrame.current)
    },
    []
  )

  function navigate(direction: -1 | 1, event: MouseEvent<HTMLButtonElement>) {
    if (!canNavigate || phase.current === 'moving') return
    const next: Selection = {
      index: (current.current.index + direction + projects.length) % projects.length,
      requestId: current.current.requestId + 1,
      direction: direction === 1 ? 'next' : 'previous',
      activatedAtMs: event.timeStamp > 1e12 ? event.timeStamp - performance.timeOrigin : event.timeStamp,
    }
    const target = projects[next.index]!
    current.current = next
    phase.current = 'loading'
    if (failureFrame.current !== null) cancelAnimationFrame(failureFrame.current)
    failureFrame.current = null
    curtain()
    setView(next)
    if (terminal.current) onUnavailable(terminal.current)
    else {
      setStatus({
        requestId: next.requestId,
        requestedId: target.id,
        displayedId: status.displayedId,
        state: 'loading',
      })
      channel.current?.select({ ...next, model: target })
    }
  }

  const ticket = { requestId: view.requestId, modelId: project?.id ?? '' }
  return (
    <section aria-label="Projects" className="project-carousel">
      {project ? (
        <figure className="project-card">
          <Suspense fallback={null}>
            <CarouselMetadata
              project={project}
              ticket={ticket}
              part="title"
              onAttach={onAttach}
              onVerify={onVerify}
              acceptance={acceptance}
            />
          </Suspense>
          <div className="viewer-frame">
            <button
              type="button"
              aria-label="Previous project"
              disabled={!canNavigate}
              aria-disabled={!canNavigate || status.state === 'moving'}
              onClick={(event) => navigate(-1, event)}
              className="navigation-button navigation-previous"
              style={navigationArtwork}
            >
              <span className="navigation-artwork" aria-hidden="true" />
            </button>
            <ViewerBoundary onFailure={onUnavailable}>
              <Suspense fallback={<div className="viewer-stage" aria-busy="true" />}>
                <ModelViewer
                  projects={projects}
                  title={project.title}
                  status={status}
                  onStatus={onStatus}
                  onUnavailable={onUnavailable}
                  register={register}
                  finalize={finalize}
                  onCanvas={onCanvas}
                  acceptance={acceptance}
                  orbitRadius={orbitRadius}
                />
              </Suspense>
            </ViewerBoundary>
            <button
              type="button"
              aria-label="Next project"
              disabled={!canNavigate}
              aria-disabled={!canNavigate || status.state === 'moving'}
              onClick={(event) => navigate(1, event)}
              className="navigation-button navigation-next"
              style={navigationArtwork}
            >
              <span className="navigation-artwork" aria-hidden="true" />
            </button>
          </div>
          <Suspense fallback={null}>
            <CarouselMetadata
              project={project}
              ticket={ticket}
              part="caption"
              onAttach={onAttach}
              onVerify={onVerify}
              acceptance={acceptance}
            />
          </Suspense>
        </figure>
      ) : (
        <div className="viewer-frame">
          <button
            type="button"
            aria-label="Previous project"
            disabled
            className="navigation-button navigation-previous"
            style={navigationArtwork}
          >
            <span className="navigation-artwork" aria-hidden="true" />
          </button>
          <p className="project-empty viewer-fallback" role="status">
            No models available
          </p>
          <button
            type="button"
            aria-label="Next project"
            disabled
            className="navigation-button navigation-next"
            style={navigationArtwork}
          >
            <span className="navigation-artwork" aria-hidden="true" />
          </button>
        </div>
      )}
      <p ref={position} className="carousel-position sr-only" role="status" aria-live="polite" aria-atomic="true" />
    </section>
  )
}
