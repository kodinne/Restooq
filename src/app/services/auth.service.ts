import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api-base';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = `${API_BASE_URL}/auth`;

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<any> {
    const payload = { email, password };
    return this.http.post<any>(`${this.apiUrl}/login`, payload);
  }

  getUserName(): string | null {
    const storedName = localStorage.getItem('userName');
    return storedName || null;
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
  }

}
