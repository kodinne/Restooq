import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductsService } from '../services/products.service';

@Component({
  selector: 'app-product-form',
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.scss']
})
export class ProductFormComponent implements OnInit {
  loading = false;
  duplicateNameMsg = '';
  message = '';
  messageType: 'success' | 'error' = 'success';
  form = this.fb.group({
    sku: [{ value: '', disabled: true }],
    name: ['', Validators.required],
    category: ['', Validators.required],
    costPrice: [0, [Validators.required, Validators.min(0.01)]],
    profitMargin: [0, [Validators.required, Validators.min(0)]],
    price: [0, [Validators.required, Validators.min(0.01)]],
    stock: [0, [Validators.required, Validators.min(1)]]
  });

  private isCalculating = false;

  constructor(private fb: FormBuilder, private svc: ProductsService, private router: Router) {
    this.generateSKU();
  }

  ngOnInit(): void {
    // Observa mudanças no preço de compra
    this.form.get('costPrice')?.valueChanges.subscribe(() => {
      if (!this.isCalculating) {
        this.calculatePriceFromCostAndMargin();
      }
    });

    // Observa mudanças na margem de lucro
    this.form.get('profitMargin')?.valueChanges.subscribe(() => {
      if (!this.isCalculating) {
        this.calculatePriceFromCostAndMargin();
      }
    });

    // Observa mudanças no preço de venda
    this.form.get('price')?.valueChanges.subscribe(() => {
      if (!this.isCalculating) {
        this.calculateMarginFromPrice();
      }
    });

    this.form.get('name')?.valueChanges.subscribe(() => {
      this.duplicateNameMsg = '';
    });
  }

  generateSKU(): void {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const sku = `PRD-${timestamp}-${random}`;
    this.form.patchValue({ sku });
  }

  /**
   * Calcula o preço de venda baseado no preço de compra e margem de lucro
   * Fórmula: Preço de Venda = Preço de Compra * (1 + Margem / 100)
   */
  calculatePriceFromCostAndMargin(): void {
    const costPrice = this.form.get('costPrice')?.value || 0;
    const profitMargin = this.form.get('profitMargin')?.value || 0;
    
    if (costPrice > 0) {
      const calculatedPrice = costPrice * (1 + profitMargin / 100);
      
      this.isCalculating = true;
      this.form.patchValue({ 
        price: parseFloat(calculatedPrice.toFixed(2)) 
      }, { emitEvent: false });
      this.isCalculating = false;
    }
  }

  /**
   * Calcula a margem de lucro baseada no preço de compra e preço de venda
   * Fórmula: Margem = ((Preço de Venda - Preço de Compra) / Preço de Compra) * 100
   */
  calculateMarginFromPrice(): void {
    const costPrice = this.form.get('costPrice')?.value || 0;
    const price = this.form.get('price')?.value || 0;
    
    if (costPrice > 0 && price > 0) {
      const calculatedMargin = ((price - costPrice) / costPrice) * 100;
      
      this.isCalculating = true;
      this.form.patchValue({ 
        profitMargin: parseFloat(calculatedMargin.toFixed(2)) 
      }, { emitEvent: false });
      this.isCalculating = false;
    }
  }

  submit(){
    this.duplicateNameMsg = '';
    this.message = '';
    if(this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    const formData = { ...this.form.getRawValue() };
    this.svc.create(formData as any).subscribe({
      next: ()=> { this.loading=false; this.router.navigate(['/stock']); },
      error: (err)=> {
        this.loading = false;
        const msg = err?.error?.message || '';
        if (msg.toLowerCase().includes('ja existe')) {
          this.duplicateNameMsg = msg;
          this.form.get('name')?.setErrors({ duplicate: true });
          this.form.get('name')?.markAsTouched();
          return;
        }
        this.setMessage(msg || 'Erro ao salvar produto.', 'error');
      }
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

