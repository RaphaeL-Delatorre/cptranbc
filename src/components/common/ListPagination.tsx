import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type PerPage = 10 | 25 | 50 | 100;

export const ListPagination = ({
  page,
  perPage,
  totalItems,
  onPageChange,
  onPerPageChange,
}: {
  page: number;
  perPage: PerPage;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: PerPage) => void;
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const safePage = Math.min(Math.max(1, page), totalPages);

  const start = totalItems === 0 ? 0 : (safePage - 1) * perPage + 1;
  const end = Math.min(safePage * perPage, totalItems);

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 border-t border-border/50">
      <div className="text-sm text-muted-foreground">
        Mostrando <span className="font-medium text-foreground">{start}</span>–
        <span className="font-medium text-foreground">{end}</span> de{" "}
        <span className="font-medium text-foreground">{totalItems}</span>
      </div>

      <div className="flex items-center gap-3 flex-wrap justify-end">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Itens/página</span>
          <Select value={String(perPage)} onValueChange={(v) => onPerPageChange(Number(v) as PerPage)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(safePage - 1)}
            disabled={safePage <= 1}
          >
            Anterior
          </Button>
          <div className="text-sm text-muted-foreground">
            Página <span className="font-medium text-foreground">{safePage}</span> de{" "}
            <span className="font-medium text-foreground">{totalPages}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(safePage + 1)}
            disabled={safePage >= totalPages}
          >
            Próxima
          </Button>
        </div>
      </div>
    </div>
  );
};
