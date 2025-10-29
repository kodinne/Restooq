import { Component, OnInit } from '@angular/core';
import { DashboardData, DashboardService } from '../services/dashboard.service';
import { ChartData, ChartOptions } from 'chart.js';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ProductsService } from '../services/products.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  data?: DashboardData;
  loading = false;
  barData: ChartData<'bar'> = { labels: [], datasets: [{ data: [], label: 'Quantidade', backgroundColor: '#5D4037' }] };
  barOptions: ChartOptions<'bar'> = { responsive: true, scales: { y: { beginAtZero: true } } };
  doughnutData: ChartData<'doughnut'> = { labels: [], datasets: [{ data: [], backgroundColor: ['#5D4037', '#8D6E63', '#A1887F', '#6D4C41', '#4E342E'] }] };
  donutPercent = 0;

  constructor(
    private svc: DashboardService, 
    private router: Router,
    private http: HttpClient,
    private productsService: ProductsService
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.svc.load().subscribe({
      next: (d) => {
        this.data = d;
        // Charts from API
        this.barData = {
          labels: d.topSelling.map(t => t.name),
          datasets: [{ data: d.topSelling.map(t => t.qty), label: 'Quantidade', backgroundColor: '#5D4037' }]
        };
        this.doughnutData = {
          labels: d.topSelling.map(t => t.name),
          datasets: [{ data: d.topSelling.map(t => t.qty), backgroundColor: ['#5D4037', '#8D6E63', '#A1887F', '#6D4C41', '#4E342E'] }]
        };
        const total = d.topSelling.reduce((s, t) => s + t.qty, 0) || 1;
        this.donutPercent = Math.round((d.topSelling[0]?.qty || 0) / total * 100);
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  restock(productId: number): void {
    const quantity = prompt('Quantidade a adicionar ao estoque:');
    if (quantity && !isNaN(Number(quantity))) {
      alert(`${quantity} unidades serão adicionadas ao produto ID ${productId}`);
      // Aqui você pode adicionar a lógica de reabastecimento
      this.ngOnInit(); // Recarrega o dashboard
    }
  }

  registerReturn(): void {
    // Busca lista de produtos
    this.productsService.list({ limit: 1000 }).subscribe({
      next: (response) => {
        const products = response.items;
        
        // Pede informações da devolução
        const orderId = prompt('ID do pedido:');
        if (!orderId || isNaN(Number(orderId))) {
          alert('ID do pedido inválido!');
          return;
        }
        
        // Mostra lista de produtos disponíveis
        let productsMessage = 'Produtos disponíveis:\n\n';
        products.forEach(p => {
          productsMessage += `ID: ${p.id} - ${p.name} (${p.sku})\n`;
        });
        alert(productsMessage);
        
        const productId = prompt('ID do produto devolvido:');
        if (!productId || isNaN(Number(productId))) {
          alert('ID do produto inválido!');
          return;
        }
        
        const product = products.find(p => p.id === Number(productId));
        if (!product) {
          alert('Produto não encontrado!');
          return;
        }
        
        const quantity = prompt('Quantidade devolvida:');
        if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
          alert('Quantidade inválida!');
          return;
        }
        
        const reason = prompt('Motivo da devolução:', 'Cliente solicitou');
        const value = Number(quantity) * product.price;
        
        // Registra a devolução no backend
        this.http.post('http://localhost:3000/returns', {
          orderId: Number(orderId),
          productId: Number(productId),
          quantity: Number(quantity),
          reason: reason || 'Sem motivo informado',
          value: value
        }).subscribe({
          next: () => {
            alert(`Devolução registrada com sucesso!\n\nProduto: ${product.name}\nQuantidade: ${quantity}\nValor: R$ ${value.toFixed(2)}`);
            this.ngOnInit(); // Recarrega o dashboard
          },
          error: (err) => {
            console.error('Erro ao registrar devolução:', err);
            alert('Erro ao registrar devolução. Tente novamente.');
          }
        });
      },
      error: (err) => {
        console.error('Erro ao buscar produtos:', err);
        alert('Erro ao buscar produtos. Tente novamente.');
      }
    });
  }
}
