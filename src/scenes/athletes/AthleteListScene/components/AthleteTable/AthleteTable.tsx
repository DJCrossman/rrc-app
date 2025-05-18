'use client';

import { IconCaretDown, IconCaretUp, IconPlus } from '@tabler/icons-react';
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatProgram } from '@/lib/formatters';
import { Athlete, Athletes, ProgramType } from '@/schemas';

const programOptions = ['all', ...ProgramType] as const;

const columns: ColumnDef<Athlete>[] = [
  {
    accessorKey: 'name',
    header: () => <div className="lg:w-100">Name</div>,
    cell: ({ row }) => (
      <a href={`/athletes/${row.original.id}`}>{row.original.name}</a>
    ),
    enableHiding: false,
    enableSorting: true,
  },
  {
    accessorKey: 'program',
    header: 'Program',
    cell: ({ row }) => (
      <Badge variant="outline" className="text-muted-foreground px-1.5">
        {formatProgram(row.original.program)}
      </Badge>
    ),
    enableSorting: true,
  },
];

interface IAthleteTableProps {
  data: Athletes;
}

export function AthleteTable({ data }: IAthleteTableProps) {
  const [filterBy, setFilterBy] = useState<{
    program?: Athlete['program'] | 'all';
  }>({ program: 'all' });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const filteredData = useMemo(() => {
    if (filterBy.program === 'all') return data;
    return data.filter((item) => item.program === filterBy.program);
  }, [data, filterBy]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  return (
    <div className="w-full flex-col justify-start gap-6">
      <div className="flex items-center justify-between p-4 lg:px-6">
        <Label htmlFor="program-selector" className="sr-only">
          Program
        </Label>
        <Select
          defaultValue="all"
          value={filterBy.program}
          onValueChange={(value) => {
            setFilterBy((prev) => ({
              ...prev,
              program: programOptions.find((i) => i === value) || 'all',
            }));
          }}
        >
          <SelectTrigger className="flex w-fit" size="sm" id="program-selector">
            <SelectValue placeholder="Select a program" />
          </SelectTrigger>
          <SelectContent>
            {programOptions.map((program) => (
              <SelectItem key={program} value={program}>
                {program === 'all' ? 'All Programs' : formatProgram(program)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <a href="/athletes/create">
              <IconPlus />
              <span className="hidden lg:inline">Add Athlete</span>
            </a>
          </Button>
        </div>
      </div>
      <div className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead
                        key={header.id}
                        colSpan={header.colSpan}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <div className="flex items-center gap-2">
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                          {{
                            asc: <IconCaretUp />,
                            desc: <IconCaretDown />,
                          }[header.column.getIsSorted() as string] ?? null}
                        </div>
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody className="**:data-[slot=table-cell]:first:w-8">
              {table.getRowModel().rows?.length ? (
                <>
                  {table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </>
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            {table.getFilteredRowModel().rows.length} of {data.length} athletes.
          </div>
        </div>
      </div>
    </div>
  );
}
