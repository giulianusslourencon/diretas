import { ClueDirection } from '../models/crossword.model';
import { PdfConfig } from '../config/pdf-config';

export interface ArrowConfig {
  pathData: string;
  position: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
    transform?: string;
  };
}

export class SvgArrowFactory {
  private static readonly ARROW_CONFIGS: Record<ClueDirection, ArrowConfig> = {
    right: {
      pathData: 'M2 8 L12 8 M9 5 L12 8 L9 11',
      position: {
        top: '50%',
        right: '-16px',
        transform: 'translateY(-50%)',
      },
    },
    down: {
      pathData: 'M8 2 L8 12 M5 9 L8 12 L11 9',
      position: {
        bottom: '-12px',
        left: '50%',
        transform: 'translateX(-50%)',
      },
    },
    up: {
      pathData: 'M8 14 L8 4 M5 7 L8 4 L11 7',
      position: {
        top: '-20px',
        left: '50%',
        transform: 'translateX(-50%)',
      },
    },
    left: {
      pathData: 'M14 8 L4 8 M7 5 L4 8 L7 11',
      position: {
        top: '50%',
        left: '-16px',
        transform: 'translateY(-50%)',
      },
    },
    'right-down': {
      pathData: 'M2 8 L8 8 L8 14 M5 11 L8 14 L11 11',
      position: {
        top: '25%',
        right: '-16px',
        transform: 'none',
      },
    },
    'down-right': {
      pathData: 'M8 2 L8 8 L14 8 M11 5 L14 8 L11 11',
      position: {
        bottom: '-12px',
        left: '25%',
        transform: 'none',
      },
    },
    'left-down': {
      pathData: 'M14 8 L8 8 L8 14 M11 11 L8 14 L5 11',
      position: {
        top: '25%',
        left: '-16px',
        transform: 'none',
      },
    },
    'down-left': {
      pathData: 'M8 2 L8 8 L2 8 M5 5 L2 8 L5 11',
      position: {
        bottom: '-12px',
        right: '25%',
        transform: 'none',
      },
    },
    'right-up': {
      pathData: 'M2 8 L8 8 L8 2 M5 5 L8 2 L11 5',
      position: {
        bottom: '25%',
        right: '-16px',
        transform: 'none',
      },
    },
    'up-right': {
      pathData: 'M8 14 L8 8 L14 8 M11 11 L14 8 L11 5',
      position: {
        top: '-20px',
        left: '25%',
        transform: 'none',
      },
    },
    'left-up': {
      pathData: 'M14 8 L8 8 L8 2 M11 5 L8 2 L5 5',
      position: {
        bottom: '25%',
        left: '-16px',
        transform: 'none',
      },
    },
    'up-left': {
      pathData: 'M8 14 L8 8 L2 8 M5 11 L2 8 L5 5',
      position: {
        top: '-20px',
        right: '25%',
        transform: 'none',
      },
    },
  };

  static createArrowElement(direction: ClueDirection): HTMLElement {
    const config = this.ARROW_CONFIGS[direction];
    const arrowSize = PdfConfig.LAYOUT.arrowSize;
    const colors = PdfConfig.COLORS;

    // Create container
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.width = `${arrowSize}px`;
    container.style.height = `${arrowSize}px`;
    container.style.zIndex = '10';

    // Apply positioning
    Object.entries(config.position).forEach(([key, value]) => {
      if (value) {
        (container.style as any)[key] = value;
      }
    });

    // Create SVG
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', arrowSize.toString());
    svg.setAttribute('height', arrowSize.toString());
    svg.setAttribute('viewBox', '0 0 16 16');
    svg.style.color = colors.arrow;

    // Create path
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('d', config.pathData);

    svg.appendChild(path);
    container.appendChild(svg);

    return container;
  }
}
