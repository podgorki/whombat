import { useMutation } from "@tanstack/react-query";

import api from "@/app/api";
import usePagedQuery from "@/hooks/utils/usePagedQuery";
import useFilter from "@/hooks/utils/useFilter";
import { type TagFilter } from "@/api/tags";

const _empty: TagFilter = {};
const _fixed: (keyof TagFilter)[] = [];

export default function useTags({
  filter: initialFilter = _empty,
  fixed = _fixed,
  pageSize = 10,
  enabled = true,
}: {
  filter?: TagFilter;
  fixed?: (keyof TagFilter)[];
  pageSize?: number;
  enabled?: boolean;
} = {}) {
  const filter = useFilter<TagFilter>({
    defaults: initialFilter,
    fixed: fixed,
    debounce: 50, // Lower debounce time for faster response
  });

  const { items, total, query, pagination } = usePagedQuery({
    name: "tags",
    queryFn: api.tags.get,
    pageSize: pageSize,
    filter: filter.filter,
    enabled: enabled,
  });

  const create = useMutation({
    mutationFn: api.tags.create,
    onSuccess: () => {
      query.refetch();
    },
  });

  return {
    ...query,
    items,
    total,
    pagination,
    filter,
    create,
  };
}
