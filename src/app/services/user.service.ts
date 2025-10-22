import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  password: string;
}

//Data Transfer Object
export interface CreateUserDto{
  name: string;
  email: string;
  phone: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly apiUrl = 'http://localhost:3000/users';


  constructor(private http: HttpClient) { }

  /** Buscar todos os usuários */
 
  getAll():Observable<User[]>{
    return this.http.get<User[]>(this.apiUrl);
  }

  /** Buscar um usuário pelo ID */
 
  getById(id: string):Observable<User>{
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

    /** Cria um usuário */
 
  create(payload: CreateUserDto): Observable<User>{
    return this.http.post<User>(this.apiUrl, payload);
  }

   /** Atualiza um usuário */
 
   update(id: string, payload: Partial<CreateUserDto>): Observable<User>{
    return this.http.patch<User>(`${this.apiUrl}/${id}`, payload);
  }
                                                 

   /** Deleta um usuário pelo ID */
 
   delete(id: string):Observable<void>{
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  register(body: any): Observable<any>{
    return this.http.post<any>(`${this.apiUrl}`, body);
  }

}