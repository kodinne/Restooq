import { Component, OnInit } from '@angular/core';
import { OrdersService, Order } from '../services/orders.service';

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
  constructor(private svc: OrdersService) {}
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
      .subscribe({ next: (res)=>{ this.list = res.items; this.total = res.total; this.page = res.page; this.limit = res.limit; this.loading=false; }, error: ()=> this.loading=false });
  }

  changePage(p: number){ if (p<1) return; const max = Math.ceil(this.total/this.limit)||1; if (p>max) return; this.page = p; this.load(); }

  pagesTotal(){ return Math.ceil(this.total/this.limit) || 1; }
}
