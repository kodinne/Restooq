import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface OrderItem { productId: number; quantity: number; }
export interface Order {
  id: number;
  createdAt: string;
  salesChannel: string;
  destination: string;
  status: string;
  customer?: { id: number; name: string; email: string };
  items: { quantity: number; product: { name: string; price: number } }[];
}

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly apiUrl = 'http://localhost:3000/orders';
  constructor(private http: HttpClient) {}
  list(params?: { page?: number; limit?: number; status?: string; q?: string }): Observable<{items: Order[]; total: number; page: number; limit: number}> {
    let hp = new HttpParams();
    if (params?.page) hp = hp.set('page', params.page);
    if (params?.limit) hp = hp.set('limit', params.limit);
    if (params?.status) hp = hp.set('status', params.status);
    if (params?.q) hp = hp.set('q', params.q);
    return this.http.get<{items: Order[]; total: number; page: number; limit: number}>(this.apiUrl, { params: hp });
  }
  create(body: { customerId: number; items: { productId: number; quantity: number }[] }): Observable<any> {
    return this.http.post<any>(this.apiUrl, body);
  }
}
