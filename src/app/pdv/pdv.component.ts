import { Component, OnInit } from '@angular/core';
import { ProductsService, Product } from '../services/products.service';
import { OrdersService } from '../services/orders.service';
import { Router } from '@angular/router';

interface CartItem {
  product: Product;
  quantity: number;
  subtotal: number;
}

@Component({
  selector: 'app-pdv',
  templateUrl: './pdv.component.html',
  styleUrls: ['./pdv.component.scss']
})
export class PdvComponent implements OnInit {
  products: Product[] = [];
  cart: CartItem[] = [];
  searchTerm: string = '';
  loading = false;
  processingPayment = false;
  
  // Campos do cliente
  customerName: string = '';
  customerId: number = 1; // ID padrão do cliente
  
  // Campos de pagamento
  paymentMethod: 'cash' | 'card' | 'pix' = 'cash';
  cashReceived: number = 0;
  
  constructor(
    private productsService: ProductsService,
    private ordersService: OrdersService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading = true;
    this.productsService.list({ limit: 100 }).subscribe({
      next: (res) => {
        this.products = res.items.filter(p => p.status === 'active' && p.stock > 0);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  get filteredProducts(): Product[] {
    if (!this.searchTerm) return this.products;
    const term = this.searchTerm.toLowerCase();
    return this.products.filter(p => 
      p.name.toLowerCase().includes(term) || 
      p.sku.toLowerCase().includes(term) ||
      (p.category && p.category.toLowerCase().includes(term))
    );
  }

  addToCart(product: Product): void {
    if (!product.id) {
      alert('Produto inválido!');
      return;
    }
    
    const existingItem = this.cart.find(item => item.product.id === product.id);
    
    if (existingItem) {
      if (existingItem.quantity < product.stock) {
        existingItem.quantity++;
        existingItem.subtotal = existingItem.quantity * product.price;
      } else {
        alert('Estoque insuficiente!');
      }
    } else {
      this.cart.push({
        product,
        quantity: 1,
        subtotal: product.price
      });
    }
  }

  removeFromCart(index: number): void {
    this.cart.splice(index, 1);
  }

  updateQuantity(item: CartItem, quantity: number): void {
    if (quantity <= 0) {
      const index = this.cart.indexOf(item);
      this.removeFromCart(index);
      return;
    }
    
    if (quantity <= item.product.stock) {
      item.quantity = quantity;
      item.subtotal = item.quantity * item.product.price;
    }
  }

  incrementQuantity(item: CartItem): void {
    if (item.quantity < item.product.stock) {
      item.quantity++;
      item.subtotal = item.quantity * item.product.price;
    }
  }

  decrementQuantity(item: CartItem): void {
    if (item.quantity > 1) {
      item.quantity--;
      item.subtotal = item.quantity * item.product.price;
    }
  }

  get total(): number {
    return this.cart.reduce((sum, item) => sum + item.subtotal, 0);
  }

  get totalItems(): number {
    return this.cart.reduce((sum, item) => sum + item.quantity, 0);
  }

  get change(): number {
    if (this.paymentMethod === 'cash') {
      return Math.max(0, this.cashReceived - this.total);
    }
    return 0;
  }

  clearCart(): void {
    this.cart = [];
    this.customerName = '';
    this.cashReceived = 0;
  }

  finalizeSale(): void {
    if (this.cart.length === 0) {
      alert('Carrinho vazio!');
      return;
    }

    if (this.paymentMethod === 'cash' && this.cashReceived < this.total) {
      alert('Valor recebido insuficiente!');
      return;
    }

    this.processingPayment = true;
    
    const orderItems = this.cart
      .filter(item => item.product.id !== undefined)
      .map(item => ({
        productId: item.product.id!,
        quantity: item.quantity
      }));

    if (orderItems.length === 0) {
      alert('Nenhum produto válido no carrinho!');
      this.processingPayment = false;
      return;
    }

    this.ordersService.create({
      customerId: this.customerId,
      items: orderItems
    }).subscribe({
      next: () => {
        alert('Venda realizada com sucesso!');
        this.clearCart();
        this.processingPayment = false;
        this.loadProducts(); // Recarrega produtos para atualizar estoque
      },
      error: (err) => {
        console.error('Erro ao finalizar venda:', err);
        alert('Erro ao processar venda. Tente novamente.');
        this.processingPayment = false;
      }
    });
  }
}
