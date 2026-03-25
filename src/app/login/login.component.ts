import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  submitting = false;
  errorMsg: string | null = null;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  get f() {
    return this.loginForm.controls;
  }

  onSubmit() {
    if (this.loginForm.invalid || this.submitting) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password } = this.loginForm.value;
    this.submitting = true;
    this.errorMsg = null;

    this.authService.login((email || '').trim().toLowerCase(), password).subscribe({
      next: (res: any) => {
        const token = res?.access_token || res?.token || null;
        if (token) {
          localStorage.setItem('token', token);
        }
        if (res?.user?.name) {
          localStorage.setItem('userName', res.user.name);
        }
        this.router.navigate(['/dashboard']);
        this.submitting = false;
      },
      error: (err: any) => {
        console.error('Erro no login:', err);
        this.errorMsg = err?.error?.message || 'Usuario ou senha invalidos.';
        this.submitting = false;
      },
    });
  }
}
