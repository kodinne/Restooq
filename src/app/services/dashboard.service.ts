import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api-base';

export interface DashboardData {
  cards: { revenue: number; salesReturn: number; purchase: number; income: number };
  topSelling: { name: string; qty: number }[];
  stockAlert: { id: number; name: string; stock: number; sku: string; status: string }[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly apiUrl = `${API_BASE_URL}/dashboard`;
  constructor(private http: HttpClient) {}
  load(period: 'all' | 'today' | '7d' | '30d' = 'all'): Observable<DashboardData> {
    let params = new HttpParams();
    if (period && period !== 'all') params = params.set('period', period);
    return this.http.get<DashboardData>(this.apiUrl, { params });
  }
}


