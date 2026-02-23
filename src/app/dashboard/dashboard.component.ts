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
  barData: ChartData<'bar'> = { labels: [], datasets: [{ data: [], label: 'Quantidade', backgroundColor: '#5D4037' }] };
  barOptions: ChartOptions<'bar'> = {
    responsive: true,
    scales: { y: { beginAtZero: true } },
    plugins: { legend: { display: false } }
  };
  doughnutData: ChartData<'doughnut'> = { labels: [], datasets: [{ data: [], label: 'Participacao', backgroundColor: ['#5D4037', '#8D6E63', '#A1887F', '#6D4C41', '#4E342E'] }] };
  donutPercent = 0;

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

  loadDashboard(): void {
    this.loading = true;
    this.svc.load(this.period).subscribe({
      next: (d) => {
        const topSelling = (d.topSelling ?? []).map((t: any, index) => ({
          name: this.resolveProductName(t, index),
          qty: this.resolveQuantity(t)
        }));

        this.data = {
          ...d,
          topSelling
        };

        this.barData = {
          labels: topSelling.map(t => t.name),
          datasets: [{ data: topSelling.map(t => t.qty), label: 'Quantidade', backgroundColor: '#5D4037' }]
        };
        this.doughnutData = {
          labels: topSelling.map(t => t.name),
          datasets: [{ data: topSelling.map(t => t.qty), label: 'Participacao', backgroundColor: ['#5D4037', '#8D6E63', '#A1887F', '#6D4C41', '#4E342E'] }]
        };
        const total = topSelling.reduce((s, t) => s + t.qty, 0) || 1;
        this.donutPercent = Math.round((topSelling[0]?.qty || 0) / total * 100);
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  restock(productId: number, currentStock: number): void {
    const quantity = prompt('Quantidade a adicionar ao estoque:');
    if (!quantity || isNaN(Number(quantity))) return;

    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      alert('Digite um numero inteiro maior que zero.');
      return;
    }

    const newStock = currentStock + qty;
    this.productsService.updateStock(productId, newStock).subscribe({
      next: () => {
        alert(`Estoque atualizado com sucesso. Novo estoque: ${newStock}`);
        this.loadDashboard();
      },
      error: (err) => {
        alert(this.extractErrorMessage(err, 'Erro ao atualizar estoque.'));
      }
    });
  }

  goToStock(): void {
    this.router.navigate(['/stock']);
  }

  resetCharts(): void {
    this.barData = {
      labels: [],
      datasets: [{ data: [], label: 'Quantidade', backgroundColor: '#5D4037' }]
    };
    this.doughnutData = {
      labels: [],
      datasets: [{
        data: [],
        label: 'Participacao',
        backgroundColor: ['#5D4037', '#8D6E63', '#A1887F', '#6D4C41', '#4E342E']
      }]
    };
    this.donutPercent = 0;
    if (this.data) {
      this.data = { ...this.data, topSelling: [] };
    }
  }

  registerReturn(): void {
    const orderIdInput = prompt('ID do pedido (ex: 3 ou #3):');
    const orderId = this.parseId(orderIdInput);
    if (!orderId) {
      alert('ID do pedido invalido!');
      return;
    }

    this.ordersService.list({ page: 1, limit: 100, q: String(orderId) }).subscribe({
      next: (res) => {
        const order = (res.items || []).find((o: Order) => Number(o.id) === orderId);
        if (!order) {
          alert('Pedido nao encontrado!');
          return;
        }

        if (!order.items || !order.items.length) {
          alert('Este pedido nao possui itens para devolucao.');
          return;
        }

        let itemsMessage = `Pedido #${order.id} - ${order.customerName || 'Cliente'}\n\nItens:\n`;
        order.items.forEach((item, index) => {
          itemsMessage += `${index + 1}. ${item.productName || ('Produto ' + item.productId)} - Qtd: ${item.quantity}\n`;
        });
        alert(itemsMessage);

        const itemIndexInput = prompt(`Digite o numero do item a devolver (1 a ${order.items.length}):`);
        const itemIndex = Number(itemIndexInput) - 1;
        if (!Number.isInteger(itemIndex) || itemIndex < 0 || itemIndex >= order.items.length) {
          alert('Item invalido!');
          return;
        }

        const item = order.items[itemIndex];
        const quantityInput = prompt(`Quantidade devolvida (maximo: ${item.quantity}):`);
        const quantity = Number(quantityInput);
        if (!Number.isInteger(quantity) || quantity <= 0 || quantity > item.quantity) {
          alert('Quantidade invalida!');
          return;
        }

        const reason = prompt('Motivo da devolucao:', 'Cliente solicitou');
        const value = Number(item.unitPrice ?? 0) * quantity;

        this.http.post(this.returnsUrl, {
          orderId,
          productId: item.productId,
          quantity,
          reason: reason || 'Sem motivo informado',
          value
        }).subscribe({
          next: () => {
            alert(`Devolucao registrada com sucesso!\n\nProduto: ${item.productName || item.productId}\nQuantidade: ${quantity}\nValor: R$ ${value.toFixed(2)}`);
            this.loadDashboard();
          },
          error: (err) => {
            console.error('Erro ao registrar devolucao:', err);
            alert(this.extractErrorMessage(err, 'Erro ao registrar devolucao. Tente novamente.'));
          }
        });
      },
      error: (err) => {
        console.error('Erro ao buscar pedido:', err);
        alert(this.extractErrorMessage(err, 'Erro ao buscar pedido. Tente novamente.'));
      }
    });
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
