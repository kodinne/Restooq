import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DashboardData {
  cards: { revenue: number; salesReturn: number; purchase: number; income: number };
  topSelling: { name: string; qty: number }[];
  stockAlert: { id: number; name: string; stock: number; sku: string; status: string }[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly apiUrl = 'http://localhost:3000/dashboard';
  constructor(private http: HttpClient) {}
  load(): Observable<DashboardData> { return this.http.get<DashboardData>(this.apiUrl); }
}

