import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrosswordService } from '../../core/services/crossword.service';
import { CrosswordGrid } from '../../core/models/crossword.model';

@Component({
  selector: 'app-crossword-editor',
  imports: [CommonModule, FormsModule],
  templateUrl: './crossword-editor.component.html',
  styleUrl: './crossword-editor.component.scss'
})
export class CrosswordEditorComponent implements OnInit {
  private readonly crosswordService = inject(CrosswordService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly crossword = signal<CrosswordGrid | null>(null);
  readonly isLoading = signal(true);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    
    if (id && id !== 'new') {
      const crossword = this.crosswordService.getCrosswordById(id);
      if (crossword) {
        this.crossword.set(crossword);
      } else {
        this.router.navigate(['/crosswords']);
        return;
      }
    } else {
      // For new crosswords, we'll create a default one
      const newCrossword = this.crosswordService.createNewCrossword('Nova Palavra Cruzada', 15, 15);
      this.crossword.set(newCrossword);
    }
    
    this.isLoading.set(false);
  }

  goBack(): void {
    this.router.navigate(['/crosswords']);
  }

  saveCrossword(): void {
    const current = this.crossword();
    if (current) {
      this.crosswordService.updateCrossword(current);
    }
  }
}
