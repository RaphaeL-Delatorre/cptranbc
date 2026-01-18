import type { AIT } from "@/hooks/useAITs";
import { downloadCSV } from "@/utils/csv";

const statusLabel: Record<AIT["status"], string> = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  recusado: "Reprovado",
};

export const exportAITsToCSV = (aits: AIT[], fileName = "aits.csv") => {
  const header = [
    "Nº AIT",
    "Status",
    "Data do AIT",
    "Data de Criação",
    "Policial",
    "Graduação",
    "Viatura/Prefixo",
    "Placa",
    "Condutor",
    "Modelo",
    "Aprovador",
    "Data Aprovação",
    "Motivo Reprovação",
  ];

  const rows = aits.map((a) => [
    a.numero_ait,
    statusLabel[a.status],
    a.data_inicio ? new Date(a.data_inicio).toLocaleString("pt-BR") : "",
    a.created_at ? new Date(a.created_at).toLocaleString("pt-BR") : "",
    a.nome_agente,
    a.graduacao,
    a.viatura,
    a.emplacamento,
    a.nome_condutor,
    a.marca_modelo,
    a.aprovador_nome ?? "",
    a.data_aprovacao ? new Date(a.data_aprovacao).toLocaleString("pt-BR") : "",
    a.motivo_recusa ?? "",
  ]);

  downloadCSV(fileName, [header, ...rows], ";");
};
