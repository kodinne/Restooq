import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api-base';

export interface ReturnRecord {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  reason: string;
  value: number;
  date: string;
}

@Injectable({ providedIn: 'root' })
export class ReturnsService {
  private readonly apiUrl = `${API_BASE_URL}/returns`;

  constructor(private http: HttpClient) {}

  list(): Observable<{ items: ReturnRecord[]; total: number }> {
    return this.http.get<{ items: ReturnRecord[]; total: number }>(this.apiUrl);
  }
}
