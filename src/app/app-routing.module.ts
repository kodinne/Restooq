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
import { PdvComponent } from './pdv/pdv.component';

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'contato', component: ContatoComponent },
  { path: 'faq', component: FaqComponent },
  { path: 'sobre', component: SobreComponent },
  { path: 'login', component: LoginComponent },
  { path: 'produtos-cadastrados', component: ProdutosCadastradosComponent },
  { path: 'cadastro', component: CadastroComponent },
  { path: 'cadastro-produto', component: CadastroProdutoComponent },
  { path: 'pdv', component: PdvComponent },
  { path: '**', redirectTo: 'home' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
