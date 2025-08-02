import { Injectable } from '@angular/core';
import { z } from 'zod';
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

const CrosswordCellSchema = z.union([
  AnswerCellSchema,
  ClueCellSchema,
  SplitCellSchema,
]);

const CrosswordGridSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    description: z.string().optional(),
    rows: z.number().int().min(1).max(50),
    cols: z.number().int().min(1).max(50),
    cells: z.array(z.array(CrosswordCellSchema)),
    createdAt: z
      .union([z.string(), z.date()])
      .transform((val) => (typeof val === 'string' ? new Date(val) : val)),
    updatedAt: z
      .union([z.string(), z.date()])
      .transform((val) => (typeof val === 'string' ? new Date(val) : val)),
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
      message:
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
    const fileName = this.sanitizeFileName(crossword.title) + '.json';

    // Criar link de download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;

    // Simular clique para iniciar download
    document.body.appendChild(link);
    link.click();

    // Limpar recursos
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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

      if (!file.name.toLowerCase().endsWith('.json')) {
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

  /**
   * Remove caracteres inválidos do nome do arquivo
   */
  private sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[<>:"/\\|?*]/g, '') // Remove caracteres inválidos
      .replace(/\s+/g, '_') // Substitui espaços por underscore
      .substring(0, 100); // Limita o tamanho
  }
}
