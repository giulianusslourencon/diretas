import { Injectable, inject } from '@angular/core';
import { z } from 'zod';
import { FileUtilsService } from './file-utils.service';
import { CrosswordGrid } from '../models/crossword.model';

export interface CrosswordFileData {
  version: string;
  exportDate: string;
  crossword: CrosswordGrid;
}

// Esquemas Zod para validação
const AnswerCellSchema = z.object({
  type: z.literal('answer'),
  id: z.string(),
  row: z.number().int().min(0),
  col: z.number().int().min(0),
  letter: z.string(),
});

const ClueCellSchema = z.object({
  type: z.literal('clue'),
  id: z.string(),
  row: z.number().int().min(0),
  col: z.number().int().min(0),
  clueText: z.string(),
  clueDirection: z.enum([
    'right',
    'down',
    'up',
    'left',
    'right-down',
    'down-right',
    'left-down',
    'down-left',
    'right-up',
    'up-right',
    'left-up',
    'up-left',
  ]),
  boldClueText: z.boolean(),
  textSize: z.enum(['small', 'medium', 'large']),
});

const SplitCellSchema = z.object({
  type: z.literal('split'),
  id: z.string(),
  row: z.number().int().min(0),
  col: z.number().int().min(0),
  topLetter: z.string(),
  bottomLetter: z.string(),
  diagonalDirection: z.enum(['main', 'anti']),
});

const CrosswordCellSchema = z.discriminatedUnion('type', [
  AnswerCellSchema,
  ClueCellSchema,
  SplitCellSchema,
]);

const DateSchema = z
  .union([z.string(), z.date()])
  .transform((val) => (typeof val === 'string' ? new Date(val) : val));

const CrosswordGridSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    description: z.string().optional(),
    rows: z.number().int().min(1).max(50),
    cols: z.number().int().min(1).max(50),
    cells: z.array(z.array(CrosswordCellSchema)),
    createdAt: DateSchema,
    updatedAt: DateSchema,
  })
  .refine(
    (data) => {
      // Validar que o número de linhas corresponde ao array de células
      if (data.cells.length !== data.rows) {
        return false;
      }

      // Validar que cada linha tem o número correto de colunas
      for (let i = 0; i < data.rows; i++) {
        if (data.cells[i].length !== data.cols) {
          return false;
        }

        // Validar que as coordenadas das células correspondem à posição no array
        for (let j = 0; j < data.cols; j++) {
          const cell = data.cells[i][j];
          if (cell.row !== i || cell.col !== j) {
            return false;
          }
        }
      }

      return true;
    },
    {
      error:
        'As dimensões da grade não correspondem ao array de células ou as coordenadas das células estão incorretas',
    }
  );

const CrosswordFileDataSchema = z.object({
  version: z.string(),
  exportDate: z.string(),
  crossword: CrosswordGridSchema,
});

@Injectable({
  providedIn: 'root',
})
export class FileManagerService {
  private readonly FILE_VERSION = '1.0.0';
  private readonly fileUtilsService = inject(FileUtilsService);

  /**
   * Salva uma palavra cruzada em arquivo JSON
   */
  saveToFile(crossword: CrosswordGrid): void {
    const fileData: CrosswordFileData = {
      version: this.FILE_VERSION,
      exportDate: new Date().toISOString(),
      crossword: {
        ...crossword,
        // Garantir que as datas sejam serializadas corretamente
        createdAt: crossword.createdAt,
        updatedAt: crossword.updatedAt,
      },
    };

    const jsonString = JSON.stringify(fileData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });

    // Criar nome do arquivo baseado no título da palavra cruzada
    const fileName = this.fileUtilsService.generateJsonFileName(
      crossword.title
    );

    // Trigger download using FileUtilsService
    this.fileUtilsService.triggerDownload(blob, fileName);
  }

  /**
   * Importa uma palavra cruzada de um arquivo JSON
   */
  async importFromFile(file: File): Promise<CrosswordGrid> {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error('Nenhum arquivo selecionado'));
        return;
      }

      if (!this.fileUtilsService.validateFileExtension(file, '.json')) {
        reject(
          new Error('Formato de arquivo inválido. Selecione um arquivo .json')
        );
        return;
      }

      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const rawData = JSON.parse(content);

          // Validar e transformar usando Zod
          const validatedData = CrosswordFileDataSchema.parse(rawData);

          // O Zod já transformou as datas automaticamente
          resolve(validatedData.crossword);
        } catch (error) {
          if (error instanceof z.ZodError) {
            // Erro de validação Zod - fornecer detalhes específicos
            const firstError = error.issues[0];
            const errorMessage = `Arquivo inválido: ${
              firstError.message
            } (${firstError.path.join('.')})`;
            reject(new Error(errorMessage));
          } else if (error instanceof SyntaxError) {
            // Erro de JSON
            reject(
              new Error(
                'Arquivo JSON inválido. Verifique a sintaxe do arquivo.'
              )
            );
          } else {
            // Outros erros
            reject(
              new Error(
                'Erro ao ler o arquivo. Verifique se é um arquivo válido.'
              )
            );
          }
        }
      };

      reader.onerror = () => {
        reject(new Error('Erro ao ler o arquivo'));
      };

      reader.readAsText(file);
    });
  }
}
