import { use, useCallback, useLayoutEffect, useRef } from 'react'
import type { MetadataTicket } from '../lib/model-viewer'
import type { Project } from '../types/project'

export type MetadataPart = 'title' | 'caption'

export interface MetadataAcceptanceHooks {
  getMetadataGate?(ticket: MetadataTicket): Promise<void> | null
}

interface CarouselMetadataProps {
  readonly project: Project
  readonly ticket: MetadataTicket
  readonly part: MetadataPart
  readonly onAttach: (part: MetadataPart, node: HTMLElement | null) => void
  readonly onVerify: (ticket: MetadataTicket, part: MetadataPart, node: HTMLElement) => () => void
  readonly acceptance?: MetadataAcceptanceHooks
}

export function CarouselMetadata({ project, ticket, part, onAttach, onVerify, acceptance }: CarouselMetadataProps) {
  if (import.meta.env.MODE === 'acceptance' && acceptance?.getMetadataGate) {
    const gate = acceptance.getMetadataGate(ticket)
    if (gate) {
      use(gate)
    }
  }
  const nodeRef = useRef<HTMLElement | null>(null)
  const attach = useCallback(
    (node: HTMLElement | null) => {
      nodeRef.current = node
      onAttach(part, node)
    },
    [onAttach, part]
  )

  useLayoutEffect(() => {
    const node = nodeRef.current
    const text = part === 'title' ? `[ ${project.title} ]` : (project.description ?? '')
    if (
      !node ||
      node.textContent !== text ||
      node.dataset.selectionId !== String(ticket.requestId) ||
      node.dataset.modelId !== ticket.modelId ||
      (part === 'caption' && node.hidden !== !project.description)
    )
      return
    return onVerify(ticket, part, node)
  }, [onVerify, part, project.title, project.description, ticket])

  const identity = {
    'data-selection-details': part,
    'data-selection-id': ticket.requestId,
    'data-model-id': ticket.modelId,
  }
  return part === 'title' ? (
    <h3 ref={attach} className="project-title" {...identity}>
      [ {project.title} ]
    </h3>
  ) : (
    <figcaption ref={attach} className="project-description" hidden={!project.description} {...identity}>
      {project.description ?? ''}
    </figcaption>
  )
}
