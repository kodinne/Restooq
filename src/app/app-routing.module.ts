import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { ContatoComponent } from './contato/contato.component';
import { FaqComponent } from './faq/faq.component';
import { SobreComponent } from './sobre/sobre.component';
import { LoginComponent } from './login/login.component';
import { ProdutosCadastradosComponent } from './produtos-cadastrados/produtos-cadastrados.component';
import { CadastroComponent } from './cadastro/cadastro.component';
import { CadastroProdutoComponent } from './cadastro-produto/cadastro-produto.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { OrdersComponent } from './orders/orders.component';
import { StockComponent } from './stock/stock.component';
import { ShellComponent } from './shared/shell/shell.component';
import { ProductFormComponent } from './products/product-form.component';
import { OrderFormComponent } from './orders/order-form.component';
import { PdvComponent } from './pdv/pdv.component';
import { CustomersComponent } from './customers/customers.component';
import { ReturnsHistoryComponent } from './returns-history/returns-history.component';
import { ReportsComponent } from './reports/reports.component';
import { AuthGuard } from './services/auth.guard';

const routes: Routes = [
  { path: 'home', component: HomeComponent },
  { path: 'contato', component: ContatoComponent },
  { path: 'faq', component: FaqComponent },
  { path: 'sobre', component: SobreComponent },
  { path: 'login', component: LoginComponent },
  { path: 'cadastro', component: CadastroComponent },

  {
    path: '',
    component: ShellComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'pdv', component: PdvComponent },
      { path: 'orders', component: OrdersComponent },
      { path: 'orders/new', component: OrderFormComponent },
      { path: 'returns', component: ReturnsHistoryComponent },
      { path: 'reports', component: ReportsComponent },
      { path: 'customers', component: CustomersComponent },
      { path: 'stock', component: StockComponent },
      { path: 'products/new', component: ProductFormComponent },
      { path: 'produtos-cadastrados', component: ProdutosCadastradosComponent },
      { path: 'cadastro-produto', component: CadastroProdutoComponent }
    ]
  },
  { path: '**', redirectTo: 'home' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
