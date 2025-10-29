import { Component, OnInit } from '@angular/core';
import { OrdersService, Order } from '../services/orders.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss']
})
export class OrdersComponent implements OnInit {
  list: Order[] = [];
  total = 0;
  page = 1;
  limit = 10;
  q = '';
  status = '';
  loading = false;
  showDetails: { [key: number]: boolean } = {};
  
  constructor(
    private svc: OrdersService,
    private http: HttpClient
  ) {}
  
  ngOnInit(): void {
    this.load();
  }

  createSample() {
    this.loading = true;
    // create a minimal order with first two products (API will reduce stock)
    this.svc.create({ customerId: 1, items: [{ productId: 1, quantity: 1 }] }).subscribe({
      next: ()=> this.load(),
      error: ()=> this.loading=false
    });
  }

  load(){
    this.loading = true;
    this.svc.list({ page: this.page, limit: this.limit, status: this.status || undefined, q: this.q || undefined })
      .subscribe({ 
        next: (res)=>{ 
          this.list = res.items; 
          this.total = res.total; 
          this.page = res.page; 
          this.limit = res.limit; 
          this.loading=false; 
        }, 
        error: ()=> this.loading=false 
      });
  }

  changePage(p: number){ 
    if (p<1) return; 
    const max = Math.ceil(this.total/this.limit)||1; 
    if (p>max) return; 
    this.page = p; 
    this.load(); 
  }

  pagesTotal(){ 
    return Math.ceil(this.total/this.limit) || 1; 
  }

  toggleDetails(orderId: number): void {
    this.showDetails[orderId] = !this.showDetails[orderId];
  }

  registerReturn(order: any): void {
    if (!order.items || order.items.length === 0) {
      alert('Este pedido não possui itens para devolução.');
      return;
    }

    // Mostra informações do pedido
    let message = `Pedido #${order.id} - ${order.customerName}\n`;
    message += `Total: R$ ${order.total.toFixed(2)}\n\n`;
    message += 'Produtos:\n';
    order.items.forEach((item: any, index: number) => {
      message += `${index + 1}. ${item.productName} - Qtd: ${item.quantity} - R$ ${item.unitPrice.toFixed(2)}\n`;
    });
    
    alert(message);

    // Pergunta qual produto devolver
    const itemIndex = prompt(`Digite o número do produto a devolver (1 a ${order.items.length}):`);
    if (!itemIndex || isNaN(Number(itemIndex))) {
      return;
    }

    const index = parseInt(itemIndex) - 1;
    if (index < 0 || index >= order.items.length) {
      alert('Produto inválido!');
      return;
    }

    const item = order.items[index];
    
    // Pergunta a quantidade
    const quantityStr = prompt(`Quantidade a devolver (máximo: ${item.quantity}):`);
    if (!quantityStr || isNaN(Number(quantityStr))) {
      return;
    }

    const quantity = parseInt(quantityStr);
    if (quantity <= 0 || quantity > item.quantity) {
      alert('Quantidade inválida!');
      return;
    }

    // Pergunta o motivo
    const reason = prompt('Motivo da devolução:', 'Cliente solicitou');
    if (!reason) {
      return;
    }

    const value = item.unitPrice * quantity;

    // Registra a devolução
    this.http.post('http://localhost:3000/returns', {
      orderId: order.id,
      productId: item.productId,
      quantity: quantity,
      reason: reason,
      value: value
    }).subscribe({
      next: () => {
        alert(`Devolução registrada com sucesso!\n\nProduto: ${item.productName}\nQuantidade: ${quantity}\nValor: R$ ${value.toFixed(2)}\n\nO estoque foi atualizado automaticamente.`);
        this.load(); // Recarrega a lista
      },
      error: (err) => {
        console.error('Erro ao registrar devolução:', err);
        alert('Erro ao registrar devolução. Tente novamente.');
      }
    });
  }
}
