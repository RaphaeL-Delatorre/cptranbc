import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { AIT } from '@/hooks/useAITs';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const exportAITToPDF = (ait: AIT) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('AUTO DE INFRAÇÃO DE TRÂNSITO', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Comando de Policiamento de Trânsito (CPTran)', pageWidth / 2, 28, { align: 'center' });
  
  // AIT Number and Status
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`AIT Nº ${ait.numero_ait}`, 14, 42);
  
  const statusText = ait.status === 'aprovado' ? 'APROVADO' : ait.status === 'recusado' ? 'RECUSADO' : 'PENDENTE';
  doc.text(`Status: ${statusText}`, pageWidth - 14, 42, { align: 'right' });
  
  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 46, pageWidth - 14, 46);
  
  let yPos = 54;
  
  // Section 1: Informações do Agente
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('1. INFORMAÇÕES DO AGENTE', 14, yPos);
  yPos += 8;
  
  autoTable(doc, {
    startY: yPos,
    head: [],
    body: [
      ['Agente:', ait.nome_agente],
      ['Graduação:', ait.graduacao],
      ['Data/Hora Início:', ait.data_inicio ? format(new Date(ait.data_inicio), "dd/MM/yyyy HH:mm", { locale: ptBR }) : 'N/A'],
      ['Data/Hora Término:', ait.data_termino ? format(new Date(ait.data_termino), "dd/MM/yyyy HH:mm", { locale: ptBR }) : 'N/A'],
    ],
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 10;
  
  // Section 2: Equipe e Viatura
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('2. EQUIPE E VIATURA', 14, yPos);
  yPos += 8;
  
  const equipeData = [
    ['Viatura:', ait.viatura],
    ['1º Homem:', `${ait.primeiro_homem}${ait.primeiro_homem_patente ? ` (${ait.primeiro_homem_patente})` : ''}`],
  ];
  
  if (ait.segundo_homem) {
    equipeData.push(['2º Homem:', `${ait.segundo_homem}${ait.segundo_homem_patente ? ` (${ait.segundo_homem_patente})` : ''}`]);
  }
  if (ait.terceiro_homem) {
    equipeData.push(['3º Homem:', `${ait.terceiro_homem}${ait.terceiro_homem_patente ? ` (${ait.terceiro_homem_patente})` : ''}`]);
  }
  if (ait.quarto_homem) {
    equipeData.push(['4º Homem:', `${ait.quarto_homem}${ait.quarto_homem_patente ? ` (${ait.quarto_homem_patente})` : ''}`]);
  }
  
  autoTable(doc, {
    startY: yPos,
    head: [],
    body: equipeData,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 10;
  
  // Section 3: Relatório
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('3. RELATÓRIO DA OCORRÊNCIA', 14, yPos);
  yPos += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const splitRelatorio = doc.splitTextToSize(ait.relatorio, pageWidth - 28);
  doc.text(splitRelatorio, 14, yPos);
  yPos += splitRelatorio.length * 5 + 10;
  
  // Check if we need a new page
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }
  
  // Section 4: Dados do Veículo
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('4. DADOS DO VEÍCULO', 14, yPos);
  yPos += 8;
  
  const veiculoData = [
    ['Condutor:', ait.nome_condutor],
    ['Passaporte Condutor:', ait.passaporte_condutor],
    ['Marca/Modelo:', ait.marca_modelo],
    ['Emplacamento:', ait.emplacamento],
  ];
  
  if (ait.nome_proprietario) {
    veiculoData.push(['Proprietário:', ait.nome_proprietario]);
  }
  if (ait.passaporte_proprietario) {
    veiculoData.push(['Passaporte Proprietário:', ait.passaporte_proprietario]);
  }
  
  autoTable(doc, {
    startY: yPos,
    head: [],
    body: veiculoData,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 10;
  
  // Section 5: Artigos e Providências
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('5. ARTIGOS E PROVIDÊNCIAS', 14, yPos);
  yPos += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Artigos Infringidos:', 14, yPos);
  yPos += 6;
  
  doc.setFont('helvetica', 'normal');
  if (ait.artigos_infringidos && ait.artigos_infringidos.length > 0) {
    ait.artigos_infringidos.forEach((artigo) => {
      doc.text(`• ${artigo}`, 18, yPos);
      yPos += 5;
    });
  } else {
    doc.text('Nenhum artigo informado', 18, yPos);
    yPos += 5;
  }
  
  yPos += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('Providências Tomadas:', 14, yPos);
  yPos += 6;
  
  doc.setFont('helvetica', 'normal');
  if (ait.providencias_tomadas && ait.providencias_tomadas.length > 0) {
    ait.providencias_tomadas.forEach((prov) => {
      doc.text(`• ${prov}`, 18, yPos);
      yPos += 5;
    });
  } else {
    doc.text('Nenhuma providência informada', 18, yPos);
    yPos += 5;
  }
  
  // Footer
  const pageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} - Página ${i} de ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }
  
  // Save
  doc.save(`AIT_${ait.numero_ait}.pdf`);
};

export const exportAllAITsToPDF = (aits: AIT[]) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('RELATÓRIO DE AITs', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Comando de Policiamento de Trânsito (CPTran)', pageWidth / 2, 28, { align: 'center' });
  doc.text(`Total: ${aits.length} AITs`, pageWidth / 2, 36, { align: 'center' });
  
  // Table
  autoTable(doc, {
    startY: 45,
    head: [['Nº', 'Agente', 'Condutor', 'Placa', 'Data', 'Status']],
    body: aits.map(ait => [
      ait.numero_ait.toString(),
      ait.nome_agente,
      ait.nome_condutor,
      ait.emplacamento,
      format(new Date(ait.created_at), 'dd/MM/yyyy', { locale: ptBR }),
      ait.status === 'aprovado' ? 'Aprovado' : ait.status === 'recusado' ? 'Recusado' : 'Pendente'
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [212, 175, 55] },
  });
  
  // Footer
  const pageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} - Página ${i} de ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }
  
  doc.save(`Relatorio_AITs_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};
