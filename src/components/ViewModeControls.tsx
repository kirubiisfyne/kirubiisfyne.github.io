import type { CSSProperties } from 'react';
import type { DisplayMode } from '../lib/model-viewer';
import clay from '../assets/figma/view-clay.svg';
import rendered from '../assets/figma/view-rendered.svg';
import wireframe from '../assets/figma/view-wireframe.svg';

interface ViewModeControlsProps {
  readonly mode: DisplayMode;
  readonly disabled: boolean;
  readonly onModeChange: (mode: DisplayMode) => void;
}

const modes = [
  { value: 'clay', label: 'Clay', artwork: clay, width: 48, height: 12 },
  { value: 'rendered', label: 'Rendered', artwork: rendered, width: 80, height: 10 },
  { value: 'wireframe', label: 'Wireframe', artwork: wireframe, width: 84, height: 10 },
] as const;

export function ViewModeControls({ mode, disabled, onModeChange }: ViewModeControlsProps) {
  return (
    <div className="view-mode-controls" role="group" aria-label="Model display mode">
      {modes.map(item => (
        <button
          key={item.value}
          type="button"
          className="view-mode-button"
          aria-label={item.label}
          aria-pressed={mode === item.value}
          disabled={disabled}
          onClick={() => onModeChange(item.value)}
        >
          <span
            aria-hidden="true"
            className="view-mode-artwork"
            style={{
              '--view-artwork': `url("${item.artwork}")`,
              width: item.width,
              height: item.height,
            } as CSSProperties}
          >
            <span className="view-mode-glyph view-mode-arrow-start" />
            <span className="view-mode-glyph view-mode-label" />
            <span className="view-mode-glyph view-mode-arrow-end" />
          </span>
        </button>
      ))}
    </div>
  );
}
