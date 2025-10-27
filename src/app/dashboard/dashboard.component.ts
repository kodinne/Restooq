import { Component, OnInit } from '@angular/core';
import { DashboardData, DashboardService } from '../services/dashboard.service';
import { ChartData, ChartOptions } from 'chart.js';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  data?: DashboardData;
  loading = false;
  barData: ChartData<'bar'> = { labels: [], datasets: [{ data: [], label: 'Quantidade', backgroundColor: '#5a6ff2' }] };
  barOptions: ChartOptions<'bar'> = { responsive: true, scales: { y: { beginAtZero: true } } };
  doughnutData: ChartData<'doughnut'> = { labels: [], datasets: [{ data: [], backgroundColor: ['#5a6ff2', '#f7d055', '#74c69d', '#f2a154', '#a78bfa'] }] };
  donutPercent = 0;

  constructor(private svc: DashboardService) {}

  ngOnInit(): void {
    this.loading = true;
    this.svc.load().subscribe({
      next: (d) => {
        this.data = d;
        // Charts from API
        this.barData = {
          labels: d.topSelling.map(t => t.name),
          datasets: [{ data: d.topSelling.map(t => t.qty), label: 'Quantidade', backgroundColor: '#5a6ff2' }]
        };
        this.doughnutData = {
          labels: d.topSelling.map(t => t.name),
          datasets: [{ data: d.topSelling.map(t => t.qty), backgroundColor: ['#5a6ff2', '#f7d055', '#74c69d', '#f2a154', '#a78bfa'] }]
        };
        const total = d.topSelling.reduce((s, t) => s + t.qty, 0) || 1;
        this.donutPercent = Math.round((d.topSelling[0]?.qty || 0) / total * 100);
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }
}
