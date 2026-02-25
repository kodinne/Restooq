import { Component, OnInit } from '@angular/core';
import { ProductsService, Product } from '../services/products.service';

@Component({
  selector: 'app-stock',
  templateUrl: './stock.component.html',
  styleUrls: ['./stock.component.scss']
})
export class StockComponent implements OnInit {
  products: Product[] = [];
  total = 0;
  page = 1;
  limit = 10;
  q = '';
  status = '';

  message = '';
  messageType: 'success' | 'error' | 'info' = 'info';
  deleteCandidate: Product | null = null;

  constructor(private svc: ProductsService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.svc.list({
      page: this.page,
      limit: this.limit,
      q: this.q || undefined,
      status: this.status || undefined
    }).subscribe({
      next: (res) => {
        this.products = res.items;
        this.total = res.total;
        this.page = res.page;
        this.limit = res.limit;
      },
      error: (err) => {
        const msg = err?.error?.message || 'Erro ao carregar estoque.';
        this.setMessage(msg, 'error');
      }
    });
  }

  changePage(p: number): void {
    if (p < 1) return;
    const max = Math.ceil(this.total / this.limit) || 1;
    if (p > max) return;
    this.page = p;
    this.load();
  }

  pagesTotal(): number {
    return Math.ceil(this.total / this.limit) || 1;
  }

  displayId(index: number): number {
    const raw = this.total - ((this.page - 1) * this.limit + index);
    return raw > 0 ? raw : index + 1;
  }

  askDelete(product: Product): void {
    this.deleteCandidate = product;
  }

  cancelDelete(): void {
    this.deleteCandidate = null;
  }

  confirmDelete(): void {
    const id = this.deleteCandidate?.id;
    if (!id) {
      this.setMessage('ID do produto invalido.', 'error');
      this.deleteCandidate = null;
      return;
    }

    this.svc.delete(id).subscribe({
      next: (res) => {
        const msg = res?.message || 'Produto removido com sucesso.';
        this.setMessage(msg, 'success');
        this.deleteCandidate = null;
        this.load();
      },
      error: (err) => {
        const errorMsg = err?.error?.message || err?.message || 'Erro ao remover produto.';
        this.setMessage(errorMsg, 'error');
      }
    });
  }

  clearMessage(): void {
    this.message = '';
  }

  private setMessage(message: string, type: 'success' | 'error' | 'info'): void {
    this.message = message;
    this.messageType = type;
  }
}
