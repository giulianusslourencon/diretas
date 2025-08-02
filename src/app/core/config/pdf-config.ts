export interface PdfDimensions {
  pageWidth: number;
  pageHeight: number;
  margin: number;
  titleHeight: number;
  footerHeight: number;
  availableWidth: number;
  availableHeight: number;
}

export interface CellDimensions {
  width: number;
  height: number;
  borderWidth: number;
}

export interface FontConfig {
  family: string;
  titleSize: number;
  footerSize: number;
  footerSizeDouble: number;
  cellSizes: {
    small: string;
    medium: string;
    large: string;
  };
  lineHeights: {
    small: string;
    medium: string;
    large: string;
  };
}

export interface ColorConfig {
  background: string;
  border: string;
  clueBackground: string;
  text: string;
  footerText: string;
  arrow: string;
  heart: string;
  diagonalLine: string;
}

export interface CanvasConfig {
  scale: number;
  backgroundColor: string;
  useCORS: boolean;
  allowTaint: boolean;
  logging: boolean;
}

export interface LayoutConfig {
  gridGap: number;
  heartWidth: number;
  arrowSize: number;
}

export class PdfConfig {
  static readonly SINGLE_LAYOUT: PdfDimensions = {
    pageWidth: 0, // Will be set from jsPDF instance
    pageHeight: 0, // Will be set from jsPDF instance
    margin: 15,
    titleHeight: 20,
    footerHeight: 15,
    availableWidth: 0, // Calculated
    availableHeight: 0, // Calculated
  };

  static readonly DOUBLE_LAYOUT: PdfDimensions = {
    pageWidth: 0, // Will be set from jsPDF instance
    pageHeight: 0, // Will be set from jsPDF instance
    margin: 10,
    titleHeight: 15,
    footerHeight: 12,
    availableWidth: 0, // Calculated
    availableHeight: 0, // Calculated
  };

  static readonly CELL: CellDimensions = {
    width: 60,
    height: 60,
    borderWidth: 1,
  };

  static readonly FONTS: FontConfig = {
    family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
    titleSize: 18,
    footerSize: 10,
    footerSizeDouble: 8,
    cellSizes: {
      small: '7px',
      medium: '9px',
      large: '11px',
    },
    lineHeights: {
      small: '1.0',
      medium: '1.1',
      large: '1.2',
    },
  };

  static readonly COLORS: ColorConfig = {
    background: '#ffffff',
    border: '#333',
    clueBackground: '#d0d0d0',
    text: '#000',
    footerText: '#808080',
    arrow: '#666',
    heart: '#808080',
    diagonalLine: '#2c3e50',
  };

  static readonly CANVAS: CanvasConfig = {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
    allowTaint: false,
    logging: false,
  };

  static readonly LAYOUT: LayoutConfig = {
    gridGap: 8,
    heartWidth: 4,
    arrowSize: 12,
  };

  static readonly FOOTER_TEXT = {
    left: 'Feito com ',
    right: ' por Giuzinho',
  };

  static calculateDimensions(pdf: any, isDouble: boolean = false): PdfDimensions {
    const config = isDouble ? { ...this.DOUBLE_LAYOUT } : { ...this.SINGLE_LAYOUT };
    
    config.pageWidth = pdf.internal.pageSize.getWidth();
    config.pageHeight = pdf.internal.pageSize.getHeight();
    config.availableWidth = config.pageWidth - 2 * config.margin;
    config.availableHeight = config.pageHeight - 2 * config.margin - config.titleHeight - config.footerHeight;
    
    return config;
  }
}
