import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = 'http://localhost:3000/auth';

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
