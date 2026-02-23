import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { ProductsService, Product } from '../services/products.service';
import { OrdersService } from '../services/orders.service';

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
  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;

  products: Product[] = [];
  cart: CartItem[] = [];
  searchTerm = '';
  loading = false;
  processingPayment = false;

  customerName = '';
  customerId = 1;

  paymentMethod: 'cash' | 'card' | 'pix' = 'cash';
  cashReceived = 0;

  toastMessage = '';
  shortcutsVisible = false;

  constructor(
    private productsService: ProductsService,
    private ordersService: OrdersService
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading = true;
    this.productsService.list({ limit: 100 }).subscribe({
      next: (res) => {
        this.products = res.items.filter(p => p.status === 'active' && p.stock > 0);
        if (this.lowStockProducts.length) {
          this.showToast(`${this.lowStockProducts.length} produto(s) com estoque baixo.`);
        }
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
      p.name.toLowerCase().includes(term)
      || p.sku.toLowerCase().includes(term)
      || (p.category && p.category.toLowerCase().includes(term))
    );
  }

  get lowStockProducts(): Product[] {
    return this.products.filter(p => p.stock <= 5);
  }

  addToCart(product: Product): void {
    if (!product.id) {
      this.showToast('Produto invalido.');
      return;
    }

    const existingItem = this.cart.find(item => item.product.id === product.id);

    if (existingItem) {
      if (existingItem.quantity < product.stock) {
        existingItem.quantity++;
        existingItem.subtotal = existingItem.quantity * product.price;
      } else {
        this.showToast('Estoque insuficiente.');
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

  quickAddFirstFiltered(): void {
    const first = this.filteredProducts[0];
    if (!first) {
      this.showToast('Nenhum produto encontrado para adicionar.');
      return;
    }
    this.addToCart(first);
    this.showToast(`${first.name} adicionado ao carrinho.`);
  }

  finalizeSale(): void {
    if (this.cart.length === 0) {
      this.showToast('Carrinho vazio.');
      return;
    }

    if (this.paymentMethod === 'cash' && this.cashReceived < this.total) {
      this.showToast('Valor recebido insuficiente.');
      return;
    }

    this.processingPayment = true;

    const orderItems = this.cart
      .filter(item => item.product.id !== undefined)
      .map(item => ({
        productId: item.product.id!,
        quantity: item.quantity
      }));

    if (!orderItems.length) {
      this.showToast('Nenhum produto valido no carrinho.');
      this.processingPayment = false;
      return;
    }

    this.ordersService.create({
      customerId: this.customerId,
      items: orderItems
    }).subscribe({
      next: () => {
        this.showToast('Venda realizada com sucesso.');
        this.clearCart();
        this.processingPayment = false;
        this.loadProducts();
      },
      error: (err) => {
        const msg = err?.error?.message || 'Erro ao processar venda. Tente novamente.';
        this.showToast(msg);
        this.processingPayment = false;
      }
    });
  }

  focusSearch(): void {
    this.searchInput?.nativeElement.focus();
  }

  toggleShortcuts(): void {
    this.shortcutsVisible = !this.shortcutsVisible;
  }

  private showToast(message: string): void {
    this.toastMessage = message;
    setTimeout(() => {
      if (this.toastMessage === message) this.toastMessage = '';
    }, 3000);
  }

  @HostListener('window:keydown', ['$event'])
  handleShortcuts(event: KeyboardEvent): void {
    if (event.key === 'F2') {
      event.preventDefault();
      this.focusSearch();
      return;
    }

    if (event.key === 'F4') {
      event.preventDefault();
      if (!this.processingPayment) this.finalizeSale();
      return;
    }

    if (event.key === 'Escape') {
      if (this.cart.length) {
        this.clearCart();
        this.showToast('Carrinho limpo.');
      }
    }
  }
}
