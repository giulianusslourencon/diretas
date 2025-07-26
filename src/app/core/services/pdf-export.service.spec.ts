import { TestBed } from '@angular/core/testing';
import { PdfExportService } from './pdf-export.service';
import {
  CrosswordGrid,
  CrosswordExportOptions,
} from '../models/crossword.model';

describe('PdfExportService', () => {
  let service: PdfExportService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PdfExportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create a temporary container for crossword grid', () => {
    const mockCrossword: CrosswordGrid = {
      id: 'test-1',
      title: 'Test Crossword',
      description: 'A test crossword',
      rows: 3,
      cols: 3,
      cells: [
        [
          {
            type: 'answer',
            id: '0-0',
            row: 0,
            col: 0,
            letter: '',
          },
          {
            type: 'clue',
            id: '0-1',
            row: 0,
            col: 1,
            clueText: 'Test clue',
            clueDirection: 'right',
            boldClueText: false,
            textSize: 'medium',
          },
          {
            type: 'answer',
            id: '0-2',
            row: 0,
            col: 2,
            letter: '',
          },
        ],
        [
          {
            type: 'answer',
            id: '1-0',
            row: 1,
            col: 0,
            letter: '',
          },
          {
            type: 'split',
            id: '1-1',
            row: 1,
            col: 1,
            diagonalDirection: 'main',
            topLetter: 'A',
            bottomLetter: 'B',
          },
          {
            type: 'answer',
            id: '1-2',
            row: 1,
            col: 2,
            letter: '',
          },
        ],
        [
          {
            type: 'answer',
            id: '2-0',
            row: 2,
            col: 0,
            letter: '',
          },
          {
            type: 'answer',
            id: '2-1',
            row: 2,
            col: 1,
            letter: '',
          },
          {
            type: 'answer',
            id: '2-2',
            row: 2,
            col: 2,
            letter: '',
          },
        ],
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const options: CrosswordExportOptions = {
      includeAnswers: false,
    };

    // Test that the service can create a temporary container
    const container = (service as any).createTempContainer(
      mockCrossword,
      options
    );
    expect(container).toBeTruthy();
    expect(container.tagName).toBe('DIV');
    expect(container.style.position).toBe('absolute');
  });

  it('should create cell elements with correct properties', () => {
    const mockCell = {
      type: 'answer' as const,
      id: '0-0',
      row: 0,
      col: 0,
      letter: 'A',
    };

    const options: CrosswordExportOptions = {
      includeAnswers: true,
    };

    const cellElement = (service as any).createCellElement(mockCell, options);
    expect(cellElement).toBeTruthy();
    expect(cellElement.tagName).toBe('DIV');
    expect(cellElement.style.width).toBe('60px');
    expect(cellElement.style.height).toBe('60px');
  });

  it('should handle clue cells correctly', () => {
    const mockClueCell = {
      type: 'clue' as const,
      id: '0-0',
      row: 0,
      col: 0,
      clueText: 'Test clue',
      clueDirection: 'right' as const,
      boldClueText: false,
      textSize: 'medium' as const,
    };

    const options: CrosswordExportOptions = {
      includeAnswers: false,
    };

    const cellElement = (service as any).createCellElement(
      mockClueCell,
      options
    );
    expect(cellElement).toBeTruthy();

    // Should have clue content
    const clueContent = cellElement.querySelector('.clue-text');
    expect(clueContent?.textContent).toBe('Test clue');
  });

  it('should handle split cells correctly', () => {
    const mockSplitCell = {
      type: 'split' as const,
      id: '0-0',
      row: 0,
      col: 0,
      diagonalDirection: 'main' as const,
      topLetter: 'A',
      bottomLetter: 'B',
    };

    const options: CrosswordExportOptions = {
      includeAnswers: true,
    };

    const cellElement = (service as any).createCellElement(
      mockSplitCell,
      options
    );
    expect(cellElement).toBeTruthy();

    // Should have diagonal line
    const diagonalLine = cellElement.querySelector('div > div');
    expect(diagonalLine).toBeTruthy();
  });
});
