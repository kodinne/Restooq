import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductsService, Product } from '../services/products.service';

@Component({
  selector: 'app-product-form',
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.scss']
})
export class ProductFormComponent implements OnInit {
  loading = false;
  isEdit = false;
  productId?: number;
  form = this.fb.group({
    sku: ['', Validators.required],
    name: ['', Validators.required],
    category: [''],
    price: [0, [Validators.required, Validators.min(0)]],
    stock: [0, [Validators.required, Validators.min(0)]]
  });

  constructor(private fb: FormBuilder, private svc: ProductsService, private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.productId = Number(id);
      this.loading = true;
      this.svc.getById(this.productId).subscribe({
        next: (p: Product)=>{ this.form.patchValue({ sku: p.sku, name: p.name, category: p.category || '', price: p.price, stock: p.stock }); this.loading=false; },
        error: ()=>{ this.loading=false; }
      });
    }
  }

  submit(){
    if(this.form.invalid) return;
    this.loading = true;
    if (this.isEdit && this.productId!=null) {
      this.svc.update(this.productId, this.form.value as any).subscribe({
        next: ()=> { this.loading=false; this.router.navigate(['/stock']); },
        error: ()=> this.loading=false
      });
    } else {
      this.svc.create(this.form.value as any).subscribe({
        next: ()=> { this.loading=false; this.router.navigate(['/stock']); },
        error: ()=> this.loading=false
      });
    }
  }
}

