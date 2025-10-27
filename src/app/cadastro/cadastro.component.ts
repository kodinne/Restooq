import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../services/auth.service';

import { Router } from '@angular/router';
import { UserService } from '../services/user.service';
@Component({
  selector: 'app-cadastro',
  templateUrl: './cadastro.component.html',
  styleUrls: ['./cadastro.component.scss'],
})
export class CadastroComponent implements OnInit {
  cadastroForm!: FormGroup;

  erroCadastro: string | null = null;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cadastroForm = this.fb.group(
      {
        nome: ['', [Validators.required]],
        email: ['', [Validators.required, Validators.email]],
        senha: ['', [Validators.required, Validators.minLength(6)]],
        confirmarSenha: ['', [Validators.required]],
      },
      {
        validator: this.passwordsMatchValidator('senha', 'confirmarSenha'),
      }
    );
  }

  private passwordsMatchValidator(
    controlName: string,
    matchingControlName: string
  ) {
    return (formGroup: FormGroup) => {
      const control = formGroup.controls[controlName];
      const matchingControl = formGroup.controls[matchingControlName];

      if (matchingControl.errors && !matchingControl.errors['mustMatch']) {
        return;
      }

      if (control.value !== matchingControl.value) {
        matchingControl.setErrors({ mustMatch: true });
      } else {
        matchingControl.setErrors(null);
      }
    };
  }

  onSubmit() {
    this.erroCadastro = null;

    if (this.cadastroForm.invalid) {
      this.cadastroForm.markAllAsTouched();
      return;
    }

    const { nome, email, senha } = this.cadastroForm.value;

    this.userService.register({ name: nome, email, password: senha }).subscribe({
      next: (response) => {
        console.log('Cadastro realizado com sucesso!', response);
        this.router.navigate(['/login']); // Exemplo: Redireciona para /login
      },
      error: (error) => {
        console.error('Erro no cadastro:', error);
        this.erroCadastro =
          error.error?.message ||
          'Ocorreu um erro ao tentar cadastrar. Tente novamente.';
      },
    });
  }

  get f() {
    return this.cadastroForm.controls;
  }
}
