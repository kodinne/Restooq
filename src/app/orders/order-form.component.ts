import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductsService, Product } from '../services/products.service';
import { OrdersService } from '../services/orders.service';
import { Customer, CustomersService } from '../services/customers.service';

@Component({
  selector: 'app-order-form',
  templateUrl: './order-form.component.html',
  styleUrls: ['./order-form.component.scss']
})
export class OrderFormComponent implements OnInit {
  products: Product[] = [];
  customers: Customer[] = [];
  loading = false;

  form = this.fb.group({
    customerId: [1, Validators.required],
    items: this.fb.array([])
  });

  get items() { return this.form.get('items') as FormArray; }

  constructor(private fb: FormBuilder, private prodSvc: ProductsService, private orderSvc: OrdersService, private customersSvc: CustomersService, private router: Router) {}

  ngOnInit(): void {
    this.prodSvc.list().subscribe(res => { this.products = res.items; if (!this.items.length) this.addItem(); });
    this.customersSvc.list().subscribe({ next: u => this.customers = u, error: ()=>{} });
  }

  addItem(){
    this.items.push(this.fb.group({ productId: [this.products[0]?.id || null, Validators.required], quantity: [1, [Validators.required, Validators.min(1)]] }));
  }
  removeItem(i: number){ this.items.removeAt(i); }

  submit(){
    if(this.form.invalid || !this.items.length) return;
    this.loading = true;
    this.orderSvc.create(this.form.value as any).subscribe({
      next: ()=> { this.loading=false; this.router.navigate(['/orders']); },
      error: ()=> this.loading=false
    });
  }
}
