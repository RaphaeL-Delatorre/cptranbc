import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { PontoEletronico } from "@/hooks/usePontoEletronico";

const statusLabel: Record<PontoEletronico["status"], string> = {
  ativo: "Ativo",
  pausado: "Pausado",
  finalizado: "Finalizado",
  pendente: "Pendente",
  aprovado: "Aprovado",
  recusado: "Recusado",
};

const formatDuration = (seconds: number) => {
  const s = Math.max(0, seconds);
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

export const exportPontosToPDF = (pontos: PontoEletronico[], fileName = "Relatorio_Pontos.pdf") => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("RELATÓRIO DE PONTOS ELETRÔNICOS", pageWidth / 2, 18, { align: "center" });

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Total: ${pontos.length}`, pageWidth / 2, 26, { align: "center" });

  autoTable(doc, {
    startY: 34,
    head: [["Data", "Graduação", "Nome", "Prefixo", "Duração", "Status", "Responsável"]],
    body: pontos.map((p) => [
      new Date(p.created_at).toLocaleString("pt-BR"),
      p.patente ?? "-",
      p.nome_policial ?? "-",
      p.viatura ?? "-",
      formatDuration(p.tempo_total_segundos ?? 0),
      statusLabel[p.status],
      p.aprovador_nome ?? "-",
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [80, 80, 80] },
  });

  doc.save(fileName);
};
