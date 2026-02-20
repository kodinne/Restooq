import { Component, OnInit } from '@angular/core';
import { Customer, CustomersService } from '../services/customers.service';

@Component({
  selector: 'app-customers',
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.scss']
})
export class CustomersComponent implements OnInit {
  customers: Customer[] = [];
  q = '';
  loading = false;

  form = { name: '', phone: '', email: '' };

  constructor(private customersService: CustomersService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.customersService.list(this.q || undefined).subscribe({
      next: (list) => {
        this.customers = list;
        this.loading = false;
      },
      error: () => (this.loading = false)
    });
  }

  create(): void {
    if (!this.form.name.trim()) {
      alert('Nome do cliente é obrigatório');
      return;
    }
    this.customersService.create({
      name: this.form.name.trim(),
      phone: this.form.phone.trim() || undefined,
      email: this.form.email.trim() || undefined
    }).subscribe({
      next: () => {
        this.form = { name: '', phone: '', email: '' };
        this.load();
      },
      error: (err) => alert(err?.error?.message || 'Erro ao criar cliente')
    });
  }

  edit(customer: Customer): void {
    const name = prompt('Nome do cliente:', customer.name);
    if (name === null || !name.trim()) return;
    const phone = prompt('Telefone do cliente:', customer.phone || '') ?? '';
    const email = prompt('Email do cliente (opcional):', customer.email || '') ?? '';

    this.customersService.update(customer.id, { name: name.trim(), phone: phone.trim(), email: email.trim() }).subscribe({
      next: () => this.load(),
      error: (err) => alert(err?.error?.message || 'Erro ao atualizar cliente')
    });
  }

  remove(customer: Customer): void {
    if (!confirm(`Remover cliente "${customer.name}"?`)) return;
    this.customersService.delete(customer.id).subscribe({
      next: () => this.load(),
      error: (err) => alert(err?.error?.message || 'Erro ao remover cliente')
    });
  }
}
