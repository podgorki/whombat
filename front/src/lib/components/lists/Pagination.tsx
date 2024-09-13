import Button from "@/lib/components/ui/Button";
import * as icons from "@/lib/components/icons";
import { Input } from "@/lib/components/inputs/index";
import Select from "@/lib/components/inputs/Select";

const pageSizeOptions = [1, 5, 10, 25, 50, 100];

function SetPageSize({
  pageSize = 10,
  onSetPageSize,
}: {
  pageSize?: number;
  onSetPageSize?: (pageSize: number) => void;
}) {
  return (
    <Select
      label="Page Size:"
      selected={{ label: pageSize.toString(), value: pageSize, id: pageSize }}
      onChange={(value) => onSetPageSize?.(value)}
      options={pageSizeOptions.map((value) => ({
        label: value.toString(),
        value,
        id: value,
      }))}
    />
  );
}

export default function Pagination({
  page = 0,
  numPages = 1,
  pageSize = 10,
  hasNextPage = false,
  hasPrevPage = false,
  onNextPage: nextPage,
  onPrevPage: prevPage,
  onSetPage: setPage,
  onSetPageSize: setPageSize,
}: {
  page?: number;
  numPages?: number;
  pageSize?: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
  onNextPage?: () => void;
  onPrevPage?: () => void;
  onSetPage?: (page: number) => void;
  onSetPageSize?: (pageSize: number) => void;
}) {
  return (
    <div className="flex flex-row space-x-2">
      <Button
        disabled={page === 0}
        onClick={() => setPage?.(0)}
        variant="secondary"
        mode="text"
      >
        <icons.FirstIcon className="w-5 h-5 fill-transparent stroke-inherit" />
      </Button>
      <Button
        onClick={prevPage}
        disabled={!hasPrevPage}
        variant="secondary"
        mode="text"
      >
        <icons.PreviousIcon className="w-5 h-5 fill-transparent stroke-inherit" />
      </Button>
      <div className="w-14">
        <Input
          disabled={numPages === 1}
          type="number"
          className="remove-arrow"
          value={page + 1}
          onChange={(e) => setPage?.(parseInt(e.target.value) - 1)}
        />
      </div>
      <Button disabled variant="secondary" mode="text">
        / {numPages}
      </Button>
      <Button
        onClick={nextPage}
        disabled={!hasNextPage}
        variant="secondary"
        mode="text"
      >
        <icons.NextIcon className="w-5 h-5 fill-transparent stroke-inherit" />
      </Button>
      <Button
        disabled={page === numPages - 1}
        onClick={() => setPage?.(numPages - 1)}
        variant="secondary"
        mode="text"
      >
        <icons.LastIcon className="w-5 h-5 fill-transparent stroke-inherit" />
      </Button>
      <SetPageSize pageSize={pageSize} onSetPageSize={setPageSize} />
    </div>
  );
}
