import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ProductsService, Product } from '../services/products.service';
import { OrdersService } from '../services/orders.service';
import { UserService, User } from '../services/user.service';

@Component({
  selector: 'app-pdv',
  templateUrl: './pdv.component.html',
  styleUrls: ['./pdv.component.scss']
})
export class PdvComponent implements OnInit {
  customers: User[] = [];
  loading = false;
  cart: { product: Product; quantity: number }[] = [];

  form = this.fb.group({
    customerId: [1, Validators.required],
    skuOrName: ['', Validators.required],
    quantity: [1, [Validators.required, Validators.min(1)]]
  });

  constructor(private fb: FormBuilder, private products: ProductsService, private orders: OrdersService, private users: UserService) {}

  ngOnInit(): void {
    this.users.getAll().subscribe({ next: u => this.customers = u, error: ()=>{} });
  }

  get total(){
    return this.cart.reduce((sum, item)=> sum + item.product.price * item.quantity, 0);
  }

  addItem(){
    if (this.form.invalid) return;
    const q = (this.form.value.skuOrName || '').toString().trim();
    const qty = Number(this.form.value.quantity) || 1;
    if (!q) return;
    this.loading = true;
    this.products.list({ q, limit: 1 }).subscribe({
      next: res => {
        const p = res.items[0];
        if (p) {
          const existing = this.cart.find(ci => ci.product.id === p.id);
          if (existing) existing.quantity += qty; else this.cart.push({ product: p, quantity: qty });
          this.form.patchValue({ skuOrName: '', quantity: 1 });
        }
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  removeItem(index: number){ this.cart.splice(index, 1); }
  increase(i: number){ this.cart[i].quantity++; }
  decrease(i: number){ if (this.cart[i].quantity>1) this.cart[i].quantity--; }

  checkout(){
    if (!this.cart.length) return;
    const items = this.cart.map(ci => ({ productId: ci.product.id, quantity: ci.quantity }));
    const customerId = Number(this.form.value.customerId) || 1;
    this.loading = true;
    this.orders.create({ customerId, items }).subscribe({
      next: ()=>{ this.loading=false; this.cart=[]; },
      error: ()=>{ this.loading=false; }
    });
  }
}
