import { Component, OnInit } from '@angular/core';
import { ReportsService, ReportsSummary } from '../services/reports.service';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements OnInit {
  period: 'all' | 'today' | '7d' | '30d' | 'custom' = '30d';
  fromDate = '';
  toDate = '';
  loading = false;
  errorMsg = '';
  data: ReportsSummary = this.emptySummary();

  constructor(private reportsService: ReportsService) {}

  ngOnInit(): void {
    const today = new Date();
    const last30 = new Date(today);
    last30.setDate(today.getDate() - 29);
    this.fromDate = this.toIsoDate(last30);
    this.toDate = this.toIsoDate(today);
    this.load();
  }

  onPeriodChange(): void {
    if (this.period !== 'custom') {
      this.errorMsg = '';
      this.load();
    }
  }

  load(): void {
    if (this.period === 'custom' && (!this.fromDate || !this.toDate)) {
      this.errorMsg = 'Selecione data inicial e final para o periodo personalizado.';
      return;
    }

    if (this.period === 'custom' && this.fromDate > this.toDate) {
      this.errorMsg = 'A data inicial nao pode ser maior que a data final.';
      return;
    }

    this.loading = true;
    this.errorMsg = '';
    const startDate = this.period === 'custom' ? this.fromDate : undefined;
    const endDate = this.period === 'custom' ? this.toDate : undefined;

    this.reportsService.summary(this.period, startDate, endDate).subscribe({
      next: (res) => {
        this.data = this.normalizeSummary(res);
        this.loading = false;
      },
      error: (err) => {
        this.errorMsg = err?.error?.message || 'Nao foi possivel carregar o relatorio.';
        this.data = this.emptySummary();
        this.loading = false;
      }
    });
  }

  exportCsv(): void {
    const lines: string[] = [];
    lines.push('metrica,valor');
    lines.push(`vendas_brutas,${this.data.cards.grossSales}`);
    lines.push(`devolucoes,${this.data.cards.returns}`);
    lines.push(`vendas_liquidas,${this.data.cards.netSales}`);
    lines.push(`margem,${this.data.cards.margin}`);
    lines.push(`margem_percentual,${this.data.cards.marginRate}`);
    lines.push('');
    lines.push('produtos_parados');
    lines.push('id,sku,nome,estoque,atualizado_em');
    this.data.stalledProducts.forEach((p) => {
      lines.push(`${p.id},${this.escapeCsv(p.sku)},${this.escapeCsv(p.name)},${p.stock},${p.updatedAt || ''}`);
    });
    lines.push('');
    lines.push('estoque_baixo');
    lines.push('id,sku,nome,estoque');
    this.data.lowStock.forEach((p) => {
      lines.push(`${p.id},${this.escapeCsv(p.sku)},${this.escapeCsv(p.name)},${p.stock}`);
    });
    lines.push('');
    lines.push('devolucoes');
    lines.push('id,pedido,produto,quantidade,valor,data,motivo');
    this.data.returns.forEach((r) => {
      lines.push(`${r.id},${r.orderId},${r.productId},${r.quantity},${r.value},${r.date},${this.escapeCsv(r.reason)}`);
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-${this.period}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  async exportPdf(): Promise<void> {
    const jspdfModule = await import('jspdf');
    const autoTableModule = await import('jspdf-autotable');
    const jsPDF = jspdfModule.default;
    const autoTable = autoTableModule.default;

    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const brand = {
      dark: [57, 41, 38] as [number, number, number],
      mid: [117, 87, 77] as [number, number, number],
      light: [245, 239, 236] as [number, number, number]
    };

    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 36;

    doc.setFillColor(...brand.dark);
    doc.rect(0, 0, pageWidth, 82, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('REStooq - Relatorio Gerencial', marginX, 36);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Periodo: ${this.periodLabel()} | Gerado em: ${new Date().toLocaleString('pt-BR')}`, marginX, 56);

    const cardsY = 98;
    const cardGap = 10;
    const cardW = (pageWidth - marginX * 2 - cardGap) / 2;
    const cardH = 56;

    this.drawKpiCard(doc, marginX, cardsY, cardW, cardH, 'Vendas Brutas', this.money(this.data.cards.grossSales), brand);
    this.drawKpiCard(doc, marginX + cardW + cardGap, cardsY, cardW, cardH, 'Devolucoes', this.money(this.data.cards.returns), brand);
    this.drawKpiCard(doc, marginX, cardsY + cardH + 8, cardW, cardH, 'Vendas Liquidas', this.money(this.data.cards.netSales), brand);
    this.drawKpiCard(doc, marginX + cardW + cardGap, cardsY + cardH + 8, cardW, cardH, 'Margem', this.money(this.data.cards.margin), brand);
    this.drawKpiCard(doc, marginX, cardsY + (cardH + 8) * 2, cardW, cardH, 'Margem Percentual', `${this.data.cards.marginRate.toFixed(2)}%`, brand);
    this.drawKpiCard(doc, marginX + cardW + cardGap, cardsY + (cardH + 8) * 2, cardW, cardH, 'Estoque Baixo', `${this.data.lowStock.length}`, brand);

    let y = cardsY + (cardH + 8) * 3 + 22;
    doc.setTextColor(...brand.mid);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Top Produtos Mais Vendidos', marginX, y);
    y += 8;

    autoTable(doc, {
      startY: y,
      margin: { left: marginX, right: marginX },
      head: [['Produto', 'Quantidade']],
      body: (this.data.topSelling.length ? this.data.topSelling : [{ name: 'Sem dados', qty: 0 }]).map((item) => [item.name, item.qty]),
      styles: { fontSize: 9, cellPadding: 6 },
      headStyles: { fillColor: brand.dark, textColor: 255 },
      alternateRowStyles: { fillColor: brand.light }
    });

    y = ((doc as any).lastAutoTable?.finalY || y) + 20;
    doc.setTextColor(...brand.mid);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Alerta de Estoque Baixo', marginX, y);

    autoTable(doc, {
      startY: y + 8,
      margin: { left: marginX, right: marginX },
      head: [['ID', 'SKU', 'Produto', 'Estoque']],
      body: (this.data.lowStock.length ? this.data.lowStock : [{ id: '-', sku: '-', name: 'Sem dados', stock: '-' } as any]).map((item) => [
        item.id,
        item.sku,
        item.name,
        item.stock
      ]),
      styles: { fontSize: 9, cellPadding: 6 },
      headStyles: { fillColor: brand.dark, textColor: 255 },
      alternateRowStyles: { fillColor: brand.light }
    });

    y = ((doc as any).lastAutoTable?.finalY || y) + 20;
    doc.setTextColor(...brand.mid);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Devolucoes Recentes', marginX, y);

    autoTable(doc, {
      startY: y + 8,
      margin: { left: marginX, right: marginX },
      head: [['ID', 'Pedido', 'Produto', 'Qtd', 'Valor', 'Data', 'Motivo']],
      body: (this.data.returns.length
        ? this.data.returns
        : [{ id: '-', orderId: '-', productId: '-', quantity: '-', value: 0, date: '-', reason: 'Sem dados' } as any]
      ).map((item) => [
        item.id,
        item.orderId,
        item.productId,
        item.quantity,
        this.money(Number(item.value || 0)),
        item.date ? new Date(item.date).toLocaleDateString('pt-BR') : '-',
        item.reason || '-'
      ]),
      styles: { fontSize: 8, cellPadding: 5 },
      headStyles: { fillColor: brand.dark, textColor: 255 },
      alternateRowStyles: { fillColor: brand.light }
    });

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setTextColor(120, 120, 120);
      doc.setFontSize(9);
      doc.text(`Pagina ${i} de ${pageCount}`, pageWidth - 90, doc.internal.pageSize.getHeight() - 16);
    }

    doc.save(`relatorio-${this.period}-${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  private emptySummary(): ReportsSummary {
    return {
      period: this.period,
      startDate: undefined,
      endDate: undefined,
      cards: {
        grossSales: 0,
        returns: 0,
        netSales: 0,
        margin: 0,
        marginRate: 0
      },
      lowStock: [],
      stalledProducts: [],
      topSelling: [],
      returns: []
    };
  }

  private normalizeSummary(res?: Partial<ReportsSummary> | null): ReportsSummary {
    const fallback = this.emptySummary();
    if (!res) return fallback;

    return {
      period: res.period || this.period,
      startDate: res.startDate,
      endDate: res.endDate,
      cards: {
        grossSales: Number(res.cards?.grossSales ?? 0),
        returns: Number(res.cards?.returns ?? 0),
        netSales: Number(res.cards?.netSales ?? 0),
        margin: Number(res.cards?.margin ?? 0),
        marginRate: Number(res.cards?.marginRate ?? 0)
      },
      lowStock: Array.isArray(res.lowStock) ? res.lowStock : [],
      stalledProducts: Array.isArray(res.stalledProducts) ? res.stalledProducts : [],
      topSelling: Array.isArray(res.topSelling) ? res.topSelling : [],
      returns: Array.isArray(res.returns) ? res.returns : []
    };
  }

  private toIsoDate(date: Date): string {
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  }

  private periodLabel(): string {
    if (this.period === 'custom') return `${this.fromDate} ate ${this.toDate}`;
    if (this.period === 'all') return 'Todo periodo';
    if (this.period === 'today') return 'Hoje';
    if (this.period === '7d') return 'Ultimos 7 dias';
    return 'Ultimos 30 dias';
  }

  private drawKpiCard(
    doc: any,
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    value: string,
    brand: { dark: [number, number, number]; mid: [number, number, number]; light: [number, number, number] }
  ): void {
    doc.setFillColor(...brand.light);
    doc.roundedRect(x, y, width, height, 8, 8, 'F');
    doc.setDrawColor(228, 216, 208);
    doc.roundedRect(x, y, width, height, 8, 8, 'S');
    doc.setTextColor(...brand.mid);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(label.toUpperCase(), x + 10, y + 18);
    doc.setTextColor(...brand.dark);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(value, x + 10, y + 39);
  }

  private money(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  }

  private escapeCsv(value: string): string {
    const safe = (value ?? '').replace(/"/g, '""');
    return `"${safe}"`;
  }
}
