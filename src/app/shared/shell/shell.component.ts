import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-shell',
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss']
})
export class ShellComponent {
  collapsed = false;
  constructor(public auth: AuthService, private router: Router) {}
  logout(){ this.auth.logout(); this.router.navigate(['/login']); }
  toggleSidebar(){ this.collapsed = !this.collapsed; }
}
