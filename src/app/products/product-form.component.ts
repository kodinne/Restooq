import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductsService } from '../services/products.service';

@Component({
  selector: 'app-product-form',
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.scss']
})
export class ProductFormComponent {
  loading = false;
  form = this.fb.group({
    sku: ['', Validators.required],
    name: ['', Validators.required],
    category: [''],
    price: [0, [Validators.required, Validators.min(0)]],
    stock: [0, [Validators.required, Validators.min(0)]]
  });

  constructor(private fb: FormBuilder, private svc: ProductsService, private router: Router) {}

  submit(){
    if(this.form.invalid) return;
    this.loading = true;
    this.svc.create(this.form.value as any).subscribe({
      next: ()=> { this.loading=false; this.router.navigate(['/stock']); },
      error: ()=> this.loading=false
    });
  }
}

