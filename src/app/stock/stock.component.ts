import { Component, OnInit } from '@angular/core';
import { ProductsService, Product } from '../services/products.service';

@Component({
  selector: 'app-stock',
  templateUrl: './stock.component.html',
  styleUrls: ['./stock.component.scss']
})
export class StockComponent implements OnInit {
  products: Product[] = [];
  total = 0; page = 1; limit = 10; q = ''; status = '';
  constructor(private svc: ProductsService) {}
  ngOnInit(): void { this.load(); }
  load(){ this.svc.list({ page: this.page, limit: this.limit, q: this.q || undefined, status: this.status || undefined }).subscribe(res => { this.products = res.items; this.total = res.total; this.page = res.page; this.limit = res.limit; }); }
  changePage(p: number){ if (p<1) return; const max = Math.ceil(this.total/this.limit)||1; if (p>max) return; this.page = p; this.load(); }
  pagesTotal(){ return Math.ceil(this.total/this.limit) || 1; }

  displayId(index: number): number {
    const raw = this.total - ((this.page - 1) * this.limit + index);
    return raw > 0 ? raw : index + 1;
  }
  
  deleteProduct(id: number | undefined): void {
    if (!id) {
      alert('ID do produto inválido');
      return;
    }
    
    if (confirm('Tem certeza que deseja remover este produto?')) {
      this.svc.delete(id).subscribe({
        next: (res) => {
          const message = res?.message || 'Produto removido com sucesso!';
          alert(message);
          this.load();
        },
        error: (err) => {
          console.error('Erro ao remover produto:', err);
          const errorMsg = err?.error?.message || err?.message || 'Erro desconhecido';
          alert(`Erro ao remover produto: ${errorMsg}`);
        }
      });
    }
  }
}
