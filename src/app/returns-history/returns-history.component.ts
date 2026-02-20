import { Component, OnInit } from '@angular/core';
import { ReturnRecord, ReturnsService } from '../services/returns.service';

@Component({
  selector: 'app-returns-history',
  templateUrl: './returns-history.component.html',
  styleUrls: ['./returns-history.component.scss']
})
export class ReturnsHistoryComponent implements OnInit {
  items: ReturnRecord[] = [];
  loading = false;

  constructor(private returnsService: ReturnsService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.returnsService.list().subscribe({
      next: (res) => {
        this.items = res.items;
        this.loading = false;
      },
      error: () => (this.loading = false)
    });
  }
}
