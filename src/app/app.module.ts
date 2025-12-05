import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CadastroProdutoComponent } from './cadastro-produto/cadastro-produto.component';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { PdvComponent } from './pdv/pdv.component';
import { ProdutosCadastradosComponent } from './produtos-cadastrados/produtos-cadastrados.component';
import { SobreComponent } from './sobre/sobre.component';
import { FaqComponent } from './faq/faq.component';
import { ContatoComponent } from './contato/contato.component';
import { CadastroComponent } from './cadastro/cadastro.component';
import { HeaderModule } from './shared/header/header.module';
import { FooterModule } from './shared/footer/footer.module';
<<<<<<< Updated upstream
import { HttpClient, HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgChartsModule } from 'ng2-charts';
import { AuthInterceptor } from './services/auth.interceptor';
import { DashboardComponent } from './dashboard/dashboard.component';
import { OrdersComponent } from './orders/orders.component';
import { StockComponent } from './stock/stock.component';
import { ShellComponent } from './shared/shell/shell.component';
import { ProductFormComponent } from './products/product-form.component';
import { OrderFormComponent } from './orders/order-form.component';
import { PublicHeaderComponent } from './shared/public-header/public-header.component';
=======
import { HttpClientModule } from '@angular/common/http';
>>>>>>> Stashed changes

@NgModule({
  declarations: [
    AppComponent,
    CadastroProdutoComponent,
    HomeComponent,
    LoginComponent,
    PdvComponent,
    ProdutosCadastradosComponent,
    SobreComponent,
    FaqComponent,
    ContatoComponent,
    CadastroComponent,
    DashboardComponent,
    OrdersComponent,
    StockComponent,
    ShellComponent,
    ProductFormComponent,
    OrderFormComponent,
    PublicHeaderComponent
  ],
  imports: [
    BrowserModule,
    RouterModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    HeaderModule,
    FooterModule,
    HttpClientModule,
    NgbModule,
    NgChartsModule
  ],
  providers: [{ provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }],
  bootstrap: [AppComponent]
})
export class AppModule { }
