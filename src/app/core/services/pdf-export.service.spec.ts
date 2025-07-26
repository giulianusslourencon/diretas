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
            id: '0-0',
            row: 0,
            col: 0,
            letter: '',
            isClueCell: false,
            isSplitCell: false,
          },
          {
            id: '0-1',
            row: 0,
            col: 1,
            letter: '',
            isClueCell: true,
            isSplitCell: false,
            clueText: 'Test clue',
            clueDirection: 'right',
          },
          {
            id: '0-2',
            row: 0,
            col: 2,
            letter: '',
            isClueCell: false,
            isSplitCell: false,
          },
        ],
        [
          {
            id: '1-0',
            row: 1,
            col: 0,
            letter: '',
            isClueCell: false,
            isSplitCell: false,
          },
          {
            id: '1-1',
            row: 1,
            col: 1,
            letter: '',
            isClueCell: false,
            isSplitCell: true,
            diagonalDirection: 'main',
            topLetter: 'A',
            bottomLetter: 'B',
          },
          {
            id: '1-2',
            row: 1,
            col: 2,
            letter: '',
            isClueCell: false,
            isSplitCell: false,
          },
        ],
        [
          {
            id: '2-0',
            row: 2,
            col: 0,
            letter: '',
            isClueCell: false,
            isSplitCell: false,
          },
          {
            id: '2-1',
            row: 2,
            col: 1,
            letter: '',
            isClueCell: false,
            isSplitCell: false,
          },
          {
            id: '2-2',
            row: 2,
            col: 2,
            letter: '',
            isClueCell: false,
            isSplitCell: false,
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
      id: '0-0',
      row: 0,
      col: 0,
      letter: 'A',
      isClueCell: false,
      isSplitCell: false,
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
      id: '0-0',
      row: 0,
      col: 0,
      letter: '',
      isClueCell: true,
      isSplitCell: false,
      clueText: 'Test clue',
      clueDirection: 'right',
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
      id: '0-0',
      row: 0,
      col: 0,
      letter: '',
      isClueCell: false,
      isSplitCell: true,
      diagonalDirection: 'main',
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
