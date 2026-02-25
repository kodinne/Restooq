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
  message = '';
  messageType: 'success' | 'error' = 'success';

  form = { name: '', phone: '', email: '' };
  editingCustomerId: number | null = null;
  editForm = { name: '', phone: '', email: '' };
  deleteCandidate: Customer | null = null;

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
      error: (err) => {
        this.loading = false;
        this.setMessage(err?.error?.message || 'Erro ao carregar clientes.', 'error');
      }
    });
  }

  create(): void {
    if (!this.form.name.trim()) {
      this.setMessage('Nome do cliente e obrigatorio.', 'error');
      return;
    }

    this.customersService.create({
      name: this.form.name.trim(),
      phone: this.form.phone.trim() || undefined,
      email: this.form.email.trim() || undefined
    }).subscribe({
      next: () => {
        this.form = { name: '', phone: '', email: '' };
        this.setMessage('Cliente criado com sucesso.', 'success');
        this.load();
      },
      error: (err) => this.setMessage(err?.error?.message || 'Erro ao criar cliente.', 'error')
    });
  }

  startEdit(customer: Customer): void {
    this.editingCustomerId = customer.id;
    this.editForm = {
      name: customer.name || '',
      phone: customer.phone || '',
      email: customer.email || ''
    };
  }

  cancelEdit(): void {
    this.editingCustomerId = null;
  }

  saveEdit(customer: Customer): void {
    if (!this.editForm.name.trim()) {
      this.setMessage('Nome do cliente e obrigatorio.', 'error');
      return;
    }

    this.customersService.update(customer.id, {
      name: this.editForm.name.trim(),
      phone: this.editForm.phone.trim(),
      email: this.editForm.email.trim()
    }).subscribe({
      next: () => {
        this.editingCustomerId = null;
        this.setMessage('Cliente atualizado com sucesso.', 'success');
        this.load();
      },
      error: (err) => this.setMessage(err?.error?.message || 'Erro ao atualizar cliente.', 'error')
    });
  }

  askRemove(customer: Customer): void {
    this.deleteCandidate = customer;
  }

  cancelRemove(): void {
    this.deleteCandidate = null;
  }

  confirmRemove(): void {
    if (!this.deleteCandidate) return;

    const id = this.deleteCandidate.id;
    this.customersService.delete(id).subscribe({
      next: () => {
        this.setMessage('Cliente removido com sucesso.', 'success');
        this.deleteCandidate = null;
        this.load();
      },
      error: (err) => this.setMessage(err?.error?.message || 'Erro ao remover cliente.', 'error')
    });
  }

  clearMessage(): void {
    this.message = '';
  }

  private setMessage(message: string, type: 'success' | 'error'): void {
    this.message = message;
    this.messageType = type;
  }
}
