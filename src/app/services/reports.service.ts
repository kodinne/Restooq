import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api-base';

export interface ReportsSummary {
  period: string;
  startDate?: string;
  endDate?: string;
  cards: {
    grossSales: number;
    returns: number;
    netSales: number;
    margin: number;
    marginRate: number;
  };
  lowStock: { id: number; name: string; sku: string; stock: number }[];
  stalledProducts: { id: number; name: string; sku: string; stock: number; updatedAt: string }[];
  topSelling: { name: string; qty: number }[];
  returns: { id: number; orderId: number; productId: number; quantity: number; value: number; date: string; reason: string }[];
}

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private readonly apiUrl = `${API_BASE_URL}/reports`;

  constructor(private http: HttpClient) {}

  summary(
    period: 'all' | 'today' | '7d' | '30d' | 'custom' = '30d',
    startDate?: string,
    endDate?: string
  ): Observable<ReportsSummary> {
    let params = new HttpParams();
    if (period && period !== 'all') params = params.set('period', period);
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    return this.http.get<ReportsSummary>(`${this.apiUrl}/summary`, { params });
  }
}
