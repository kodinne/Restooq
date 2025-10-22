import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProdutosCadastradosComponent } from './produtos-cadastrados.component';

describe('ProdutosCadastradosComponent', () => {
  let component: ProdutosCadastradosComponent;
  let fixture: ComponentFixture<ProdutosCadastradosComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ProdutosCadastradosComponent]
    });
    fixture = TestBed.createComponent(ProdutosCadastradosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
