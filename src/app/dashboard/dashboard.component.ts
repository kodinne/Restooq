import { Component, OnInit } from '@angular/core';
import { DashboardData, DashboardService } from '../services/dashboard.service';
import { ChartData, ChartOptions } from 'chart.js';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../services/api-base';
import { Order, OrdersService } from '../services/orders.service';
import { ProductsService } from '../services/products.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  private readonly returnsUrl = `${API_BASE_URL}/returns`;
  period: 'all' | 'today' | '7d' | '30d' = '30d';
  data?: DashboardData;
  loading = false;

  message = '';
  messageType: 'success' | 'error' | 'info' = 'info';
  showResetConfirm = false;

  restockForm = {
    productId: null as number | null,
    quantity: 1
  };

  returnFormVisible = false;
  returnOrderIdInput = '';
  returnOrder: Order | null = null;
  returnItemIndex = 0;
  returnQuantity = 1;
  returnReason = 'Cliente solicitou';
  returnLoading = false;

  barData: ChartData<'bar'> = { labels: [], datasets: [{ data: [], label: 'Quantidade', backgroundColor: '#5D4037' }] };
  barOptions: ChartOptions<'bar'> = {
    responsive: true,
    scales: { y: { beginAtZero: true } },
    plugins: { legend: { display: false } }
  };
  doughnutData: ChartData<'doughnut'> = {
    labels: [],
    datasets: [{ data: [], label: 'Participacao', backgroundColor: ['#5D4037', '#8D6E63', '#A1887F', '#6D4C41', '#4E342E'] }]
  };

  constructor(
    private svc: DashboardService,
    private http: HttpClient,
    private ordersService: OrdersService,
    private productsService: ProductsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  get selectedReturnItem() {
    return this.returnOrder?.items?.[this.returnItemIndex];
  }

  loadDashboard(): void {
    this.loading = true;
    this.svc.load(this.period).subscribe({
      next: (d) => {
        const topSelling = (d.topSelling ?? []).map((t: any, index) => ({
          name: this.resolveProductName(t, index),
          qty: this.resolveQuantity(t)
        }));

        this.data = { ...d, topSelling };
        this.barData = {
          labels: topSelling.map(t => t.name),
          datasets: [{ data: topSelling.map(t => t.qty), label: 'Quantidade', backgroundColor: '#5D4037' }]
        };
        this.doughnutData = {
          labels: topSelling.map(t => t.name),
          datasets: [{ data: topSelling.map(t => t.qty), label: 'Participacao', backgroundColor: ['#5D4037', '#8D6E63', '#A1887F', '#6D4C41', '#4E342E'] }]
        };
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.showMessage(this.extractErrorMessage(err, 'Erro ao carregar dashboard.'), 'error');
      }
    });
  }

  selectRestockTarget(productId: number): void {
    this.restockForm.productId = productId;
  }

  applyRestock(): void {
    if (!this.restockForm.productId) {
      this.showMessage('Selecione um produto para reabastecer.', 'error');
      return;
    }

    const qty = Number(this.restockForm.quantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      this.showMessage('Digite uma quantidade inteira maior que zero.', 'error');
      return;
    }

    const product = (this.data?.stockAlert || []).find(p => p.id === this.restockForm.productId);
    if (!product) {
      this.showMessage('Produto selecionado nao encontrado.', 'error');
      return;
    }

    const newStock = Number(product.stock || 0) + qty;
    this.productsService.updateStock(product.id, newStock).subscribe({
      next: () => {
        this.showMessage(`Estoque atualizado para ${newStock}.`, 'success');
        this.loadDashboard();
      },
      error: (err) => this.showMessage(this.extractErrorMessage(err, 'Erro ao atualizar estoque.'), 'error')
    });
  }

  goToStock(): void {
    this.router.navigate(['/stock']);
  }

  resetCharts(): void {
    this.showResetConfirm = true;
  }

  confirmResetSales(): void {
    this.svc.resetSales().subscribe({
      next: (res) => {
        this.showResetConfirm = false;
        this.showMessage(res?.message || 'Vendas e devolucoes apagadas com sucesso.', 'success');
        this.loadDashboard();
      },
      error: (err) => this.showMessage(this.extractErrorMessage(err, 'Erro ao zerar vendas.'), 'error')
    });
  }

  cancelResetSales(): void {
    this.showResetConfirm = false;
  }

  registerReturn(): void {
    this.returnFormVisible = !this.returnFormVisible;
    if (!this.returnFormVisible) {
      this.returnOrder = null;
      this.returnOrderIdInput = '';
    }
  }

  loadOrderForReturn(): void {
    const orderId = this.parseId(this.returnOrderIdInput);
    if (!orderId) {
      this.showMessage('Informe um ID de pedido valido.', 'error');
      return;
    }

    this.ordersService.list({ page: 1, limit: 100, q: String(orderId) }).subscribe({
      next: (res) => {
        const order = (res.items || []).find((o: Order) => Number(o.id) === orderId) || null;
        if (!order) {
          this.returnOrder = null;
          this.showMessage('Pedido nao encontrado.', 'error');
          return;
        }
        if (!order.items?.length) {
          this.returnOrder = null;
          this.showMessage('Pedido sem itens para devolucao.', 'error');
          return;
        }
        this.returnOrder = order;
        this.returnItemIndex = 0;
        this.returnQuantity = 1;
        this.showMessage(`Pedido #${order.id} carregado para devolucao.`, 'info');
      },
      error: (err) => this.showMessage(this.extractErrorMessage(err, 'Erro ao buscar pedido.'), 'error')
    });
  }

  submitReturn(): void {
    if (!this.returnOrder || !this.selectedReturnItem) {
      this.showMessage('Carregue um pedido e selecione um item.', 'error');
      return;
    }

    const quantity = Number(this.returnQuantity);
    const max = Number(this.selectedReturnItem.quantity || 0);
    if (!Number.isInteger(quantity) || quantity <= 0 || quantity > max) {
      this.showMessage(`Quantidade invalida. Maximo permitido: ${max}.`, 'error');
      return;
    }

    this.returnLoading = true;
    const value = Number(this.selectedReturnItem.unitPrice ?? 0) * quantity;

    this.http.post(this.returnsUrl, {
      orderId: this.returnOrder.id,
      productId: this.selectedReturnItem.productId,
      quantity,
      reason: this.returnReason || 'Sem motivo informado',
      value
    }).subscribe({
      next: () => {
        this.returnLoading = false;
        this.showMessage('Devolucao registrada com sucesso.', 'success');
        this.returnOrder = null;
        this.returnOrderIdInput = '';
        this.loadDashboard();
      },
      error: (err) => {
        this.returnLoading = false;
        this.showMessage(this.extractErrorMessage(err, 'Erro ao registrar devolucao.'), 'error');
      }
    });
  }

  clearMessage(): void {
    this.message = '';
  }

  private showMessage(message: string, type: 'success' | 'error' | 'info'): void {
    this.message = message;
    this.messageType = type;
  }

  private parseId(value: string | null): number | null {
    if (!value) return null;
    const digits = value.replace(/\D/g, '');
    if (!digits) return null;
    const parsed = Number(digits);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  private resolveProductName(item: { name?: string; productName?: string }, index: number): string {
    const value = (item?.name ?? item?.productName ?? '').toString().trim();
    return value || `Produto ${index + 1}`;
  }

  private resolveQuantity(item: { qty?: number; quantity?: number }): number {
    const value = Number(item?.qty ?? item?.quantity ?? 0);
    return Number.isFinite(value) ? value : 0;
  }

  private extractErrorMessage(err: any, fallback: string): string {
    return err?.error?.message
      || err?.error?.error
      || err?.message
      || fallback;
  }
}
