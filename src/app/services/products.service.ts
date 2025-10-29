import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Product {
  id: number;
  sku: string;
  name: string;
  category?: string;
  price: number;
  stock: number;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly apiUrl = 'http://localhost:3000/products';

  constructor(private http: HttpClient) {}

  list(params?: { page?: number; limit?: number; status?: string; q?: string }): Observable<{items: Product[]; total: number; page: number; limit: number}> {
    let hp = new HttpParams();
    if (params?.page) hp = hp.set('page', params.page);
    if (params?.limit) hp = hp.set('limit', params.limit);
    if (params?.status) hp = hp.set('status', params.status);
    if (params?.q) hp = hp.set('q', params.q);
    return this.http.get<{items: Product[]; total: number; page: number; limit: number}>(this.apiUrl, { params: hp });
  }

  create(body: Partial<Product>): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, body);
  }

  getById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`);
  }

  update(id: number, body: Partial<Product>): Observable<Product> {
    return this.http.patch<Product>(`${this.apiUrl}/${id}`, body);
  }
}
