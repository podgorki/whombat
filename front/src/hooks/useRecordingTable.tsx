import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ColumnDef,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import * as icons from "@/components/icons";
import Checkbox from "@/components/tables/TableCheckbox";
import TableInput from "@/components/tables/TableInput";
import TableCell from "@/components/tables/TableCell";
import TableMap, { parsePosition } from "@/components/tables/TableMap";
import TableTags from "@/components/tables/TableTags";
import TableHeader from "@/components/tables/TableHeader";
import { type RecordingUpdate } from "@/api/recordings";
import { type Recording, type Tag } from "@/api/schemas";

export default function useRecordingTable({
  data,
  onUpdate,
  onAddTag,
  onRemoveTag,
}: {
  data: Recording[];
  onUpdate: ({
    recording,
    data,
    index,
  }: {
    recording: Recording;
    data: RecordingUpdate;
    index: number;
  }) => void;
  onAddTag: ({
    recording,
    tag,
    index,
  }: {
    recording: Recording;
    tag: Tag;
    index: number;
  }) => void;
  onRemoveTag: ({
    recording,
    tag,
    index,
  }: {
    recording: Recording;
    tag: Tag;
    index: number;
  }) => void;
}) {
  const [rowSelection, setRowSelection] = useState({});

  // Column definitions
  const columns = useMemo<ColumnDef<Recording>[]>(
    () => [
      {
        id: "select",
        maxSize: 33,
        enableResizing: false,
        header: ({ table }) => (
          <Checkbox
            {...{
              checked: table.getIsAllRowsSelected(),
              indeterminate: table.getIsSomeRowsSelected(),
              onChange: table.getToggleAllRowsSelectedHandler(),
            }}
          />
        ),
        cell: ({ row }) => (
          <div className="flex justify-center px-1">
            <Checkbox
              {...{
                checked: row.getIsSelected(),
                disabled: !row.getCanSelect(),
                indeterminate: row.getIsSomeSelected(),
                onChange: row.getToggleSelectedHandler(),
              }}
            />
          </div>
        ),
      },
      {
        accessorFn: (row) => row.path,
        id: "path",
        header: () => <TableHeader>Path</TableHeader>,
        size: 200,
        enableResizing: true,
        footer: (props) => props.column.id,
        cell: ({ row }) => {
          const path = row.getValue("path") as string;
          return (
            <TableCell>
              <Link
                className="hover:font-bold hover:text-emerald-500 focus:ring focus:ring-emerald-500 focus:outline-none"
                href={{
                  pathname: "/recordings/",
                  query: {
                    recording_uuid: row.original.uuid,
                  },
                }}
              >
                {path}
              </Link>
            </TableCell>
          );
        },
      },
      {
        id: "duration",
        header: () => <TableHeader>Duration</TableHeader>,
        enableResizing: true,
        size: 100,
        accessorFn: (row) => row.duration.toFixed(2),
        cell: ({ row }) => {
          const duration = row.getValue("duration") as string;
          return <TableCell>{duration}</TableCell>;
        },
      },
      {
        id: "samplerate",
        accessorKey: "samplerate",
        header: () => <TableHeader>Sample Rate</TableHeader>,
        enableResizing: true,
        size: 120,
        footer: (props) => props.column.id,
        cell: ({ row }) => {
          const samplerate = row.getValue("samplerate") as string;
          return <TableCell>{samplerate}</TableCell>;
        },
      },
      {
        id: "time_expansion",
        accessorKey: "time_expansion",
        header: () => <TableHeader>Time Expansion</TableHeader>,
        enableResizing: true,
        size: 120,
        footer: (props) => props.column.id,
        cell: ({ row }) => {
          const value = row.getValue("time_expansion") as string;
          return (
            <TableInput
              onChange={(value) => {
                if (value === null) return;
                onUpdate({
                  recording: row.original,
                  data: { time_expansion: parseFloat(value) },
                  index: row.index,
                });
              }}
              type="number"
              value={value}
            />
          );
        },
      },
      {
        id: "date",
        enableResizing: true,
        size: 140,
        header: () => {
          return (
            <TableHeader>
              <icons.DateIcon className="inline-block mr-2 w-5 h-5 align-middle text-stone-500" />
              Date
            </TableHeader>
          );
        },
        cell: ({ row }) => {
          const date = row.getValue("date") as string;
          return (
            <TableInput
              onChange={(value) => {
                if (value === null) return;
                onUpdate({
                  recording: row.original,
                  data: { date: new Date(value) },
                  index: row.index,
                });
              }}
              type="date"
              value={date}
            />
          );
        },
        accessorFn: (row) => row.date?.toLocaleDateString("en-CA"),
      },
      {
        id: "time",
        enableResizing: true,
        size: 120,
        header: () => {
          return (
            <TableHeader>
              <icons.TimeIcon className="inline-block mr-2 w-5 h-5 align-middle text-stone-500" />
              Time
            </TableHeader>
          );
        },
        cell: ({ row }) => {
          const time = row.getValue("time") as string;
          return (
            <TableInput
              onChange={(value) => {
                if (value === null) return;
                onUpdate({
                  recording: row.original,
                  data: { time: value },
                  index: row.index,
                });
              }}
              type="time"
              value={time}
              step="1"
            />
          );
        },
        accessorFn: (row) => row.time,
      },
      {
        id: "location",
        enableResizing: true,
        header: () => {
          return (
            <TableHeader>
              <icons.LocationIcon className="inline-block mr-2 w-5 h-5 align-middle text-stone-500" />
              Location
            </TableHeader>
          );
        },
        accessorFn: (row) => {
          if (row.latitude == null || row.longitude == null) return null;
          return `${row.latitude}, ${row.longitude}`;
        },
        cell: ({ row }) => {
          const location = row.getValue("location") as string;
          return (
            <TableMap
              pattern="^[\-+]?([1-8]?\d(\.\d+)?|90(.0+)?),\s*[\-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$"
              onChange={(value) => {
                if (value === null) return;
                const { position, isComplete } = parsePosition(value);
                if (!isComplete) return;
                const { lat: latitude, lng: longitude } = position;
                onUpdate({
                  recording: row.original,
                  data: { latitude, longitude },
                  index: row.index,
                });
              }}
              type="text"
              value={location}
            />
          );
        },
      },
      {
        id: "tags",
        enableResizing: true,
        header: () => {
          return (
            <TableHeader>
              <icons.TagIcon className="inline-block mr-2 w-5 h-5 align-middle text-stone-500" />
              Tags
            </TableHeader>
          );
        },
        accessorFn: (row) => row.tags,
        cell: ({ row }) => {
          const tags = row.getValue("tags") as Tag[];
          return (
            <TableTags
              tags={tags}
              onAdd={(tag) =>
                onAddTag({
                  recording: row.original,
                  tag,
                  index: row.index,
                })
              }
              onRemove={(tag) =>
                onRemoveTag({
                  recording: row.original,
                  tag,
                  index: row.index,
                })
              }
            />
          );
        },
      },
      {
        id: "notes",
        enableResizing: true,
        header: () => {
          return (
            <TableHeader>
              <icons.NotesIcon className="inline-block mr-2 w-5 h-5 align-middle text-stone-500" />
              Notes
            </TableHeader>
          );
        },
        accessorFn: (row) => row.notes,
      },
    ],
    [onAddTag, onRemoveTag, onUpdate],
  );

  const table = useReactTable<Recording>({
    data,
    columns,
    state: { rowSelection },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    columnResizeMode: "onChange",
    getCoreRowModel: getCoreRowModel(),
  });

  return table;
}
