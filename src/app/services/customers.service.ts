import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api-base';

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone?: string;
}

@Injectable({ providedIn: 'root' })
export class CustomersService {
  private readonly apiUrl = `${API_BASE_URL}/customers`;

  constructor(private http: HttpClient) {}

  list(q?: string): Observable<Customer[]> {
    let params = new HttpParams();
    if (q) params = params.set('q', q);
    return this.http.get<Customer[]>(this.apiUrl, { params });
  }

  create(body: { name: string; phone?: string; email?: string }): Observable<Customer> {
    return this.http.post<Customer>(this.apiUrl, body);
  }

  update(id: number, body: Partial<{ name: string; phone: string; email: string }>): Observable<Customer> {
    return this.http.patch<Customer>(`${this.apiUrl}/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
