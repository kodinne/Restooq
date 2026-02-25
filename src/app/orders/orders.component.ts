import { Component, OnInit } from '@angular/core';
import { OrdersService, Order } from '../services/orders.service';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../services/api-base';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss']
})
export class OrdersComponent implements OnInit {
  private readonly returnsUrl = `${API_BASE_URL}/returns`;
  list: Order[] = [];
  total = 0;
  page = 1;
  limit = 10;
  q = '';
  status = '';
  loading = false;
  showDetails: { [key: number]: boolean } = {};

  message = '';
  messageType: 'success' | 'error' | 'info' = 'info';
  returnOrder: Order | null = null;
  returnItemIndex = 0;
  returnQuantity = 1;
  returnReason = 'Cliente solicitou';
  submittingReturn = false;

  constructor(
    private svc: OrdersService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.load();
  }

  get selectedReturnItem() {
    return this.returnOrder?.items?.[this.returnItemIndex];
  }

  load(): void {
    this.loading = true;
    this.svc.list({ page: this.page, limit: this.limit, status: this.status || undefined, q: this.q || undefined })
      .subscribe({
        next: (res) => {
          this.list = res.items;
          this.total = res.total;
          this.page = res.page;
          this.limit = res.limit;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.setMessage('Erro ao carregar pedidos.', 'error');
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

  exportCsv(): void {
    if (!this.list.length) {
      this.setMessage('Nao ha pedidos para exportar.', 'info');
      return;
    }

    const header = ['id', 'data', 'cliente', 'status', 'total', 'itens'];
    const rows = this.list.map((o) => {
      const items = (o.items || [])
        .map((i) => `${i.productName || i.productId} x${i.quantity}`)
        .join(' | ');
      return [
        String(o.id),
        String(o.createdAt || ''),
        String(o.customerName || ''),
        String(o.status || ''),
        String(o.total ?? ''),
        items
      ].map(this.escapeCsv).join(',');
    });

    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pedidos-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    this.setMessage('CSV exportado com sucesso.', 'success');
  }

  toggleDetails(orderId: number): void {
    this.showDetails[orderId] = !this.showDetails[orderId];
  }

  registerReturn(order: Order): void {
    if (!order.items || order.items.length === 0) {
      this.setMessage('Este pedido nao possui itens para devolucao.', 'error');
      return;
    }

    this.returnOrder = order;
    this.returnItemIndex = 0;
    this.returnQuantity = 1;
    this.returnReason = 'Cliente solicitou';
  }

  cancelReturn(): void {
    this.returnOrder = null;
  }

  submitReturn(): void {
    if (!this.returnOrder || !this.selectedReturnItem) {
      this.setMessage('Selecione um pedido e item para devolucao.', 'error');
      return;
    }

    const quantity = Number(this.returnQuantity);
    const max = Number(this.selectedReturnItem.quantity || 0);
    if (!Number.isInteger(quantity) || quantity <= 0 || quantity > max) {
      this.setMessage(`Quantidade invalida. Maximo: ${max}.`, 'error');
      return;
    }

    this.submittingReturn = true;
    const value = Number(this.selectedReturnItem.unitPrice || 0) * quantity;

    this.http.post(this.returnsUrl, {
      orderId: this.returnOrder.id,
      productId: this.selectedReturnItem.productId,
      quantity,
      reason: this.returnReason || 'Sem motivo informado',
      value
    }).subscribe({
      next: () => {
        this.submittingReturn = false;
        this.returnOrder = null;
        this.setMessage('Devolucao registrada com sucesso.', 'success');
        this.load();
      },
      error: (err) => {
        this.submittingReturn = false;
        this.setMessage(err?.error?.message || 'Erro ao registrar devolucao.', 'error');
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

  private escapeCsv(value: string): string {
    const safe = (value ?? '').replace(/"/g, '""');
    return `"${safe}"`;
  }
}
