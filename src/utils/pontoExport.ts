import * as XLSX from "xlsx";
import type { PontoEletronico } from "@/hooks/usePontoEletronico";
import { downloadCSV } from "@/utils/csv";

const statusLabel: Record<PontoEletronico["status"], string> = {
  ativo: "Ativo",
  pausado: "Pausado",
  finalizado: "Finalizado",
  pendente: "Pendente",
  aprovado: "Aprovado",
  recusado: "Recusado",
};

const funcoesLabel: Record<PontoEletronico["funcao"], string> = {
  motorista: "Motorista",
  encarregado: "Encarregado",
  patrulheiro: "3° Homem",
  apoio: "4° Homem",
};

const toRows = (pontos: PontoEletronico[]) => {
  const header = [
    "Status",
    "Policial",
    "Patente",
    "Função",
    "Viatura",
    "Início",
    "Fim",
    "Tempo Total (s)",
    "Aprovador",
    "Data Aprovação",
    "Motivo Recusa",
    "Observação",
    "Ponto Discord",
  ];

  const rows = pontos.map((p) => [
    statusLabel[p.status],
    p.nome_policial ?? "",
    p.patente ?? "",
    funcoesLabel[p.funcao],
    p.viatura ?? "",
    p.data_inicio ? new Date(p.data_inicio).toLocaleString("pt-BR") : "",
    p.data_fim ? new Date(p.data_fim).toLocaleString("pt-BR") : "",
    p.tempo_total_segundos ?? 0,
    p.aprovador_nome ?? "",
    p.data_aprovacao ? new Date(p.data_aprovacao).toLocaleString("pt-BR") : "",
    p.motivo_recusa ?? "",
    p.observacao ?? "",
    p.ponto_discord ?? "",
  ]);

  return { header, rows };
};

export const exportPontosToCSV = (pontos: PontoEletronico[], fileName = "pontos.csv") => {
  const { header, rows } = toRows(pontos);
  downloadCSV(fileName, [header, ...rows], ";");
};

export const exportPontosToExcel = (pontos: PontoEletronico[], fileName = "pontos.xlsx") => {
  const { header, rows } = toRows(pontos);
  const sheet = XLSX.utils.aoa_to_sheet([header, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, "Pontos");
  XLSX.writeFile(wb, fileName);
};
