'use client';

import {
  IconCaretDown,
  IconCaretUp,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconPlus,
} from '@tabler/icons-react';
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
import { Boat, Boats } from '@/schemas';
import { formatMeters, formatSeatSetup, formatWeightRange } from '@/lib/formatters';


const boatSizes = ['all', '1', '2', '4', '8'] as const;

const columns: ColumnDef<Boat>[] = [
  {
    accessorKey: 'name',
    header: () => <div className="lg:w-100">Name</div>,
    enableHiding: false,
    enableSorting: true,
  },
  {
    accessorKey: 'manufacturer',
    header: 'Manufacturer',
    cell: ({ row }) => {
      const manufacturerTitle =
        row.original.manufacturer.charAt(0).toUpperCase() +
        row.original.manufacturer.slice(1);
      return (
        <div className="w-16">
          <Badge variant="outline" className="text-muted-foreground px-1.5">
            {manufacturerTitle}
          </Badge>
        </div>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: 'seats',
    header: 'Seats',
    cell: ({ row }) => formatSeatSetup(row.original),
    enableHiding: false,
    enableSorting: true,
  },
  {
    accessorKey: 'rigging',
    header: 'Rigging',
    cell: ({ row }) => row.original.rigging.charAt(0).toUpperCase() +
      row.original.rigging.slice(1),
    enableSorting: true,
  },
  {
    accessorKey: 'meters',
    header: () => <div className="w-full">Meters</div>,
    cell: ({ row }) => formatMeters(row.original.meters),
    enableSorting: true,
  },
  {
    accessorKey: 'weightRange',
    header: () => <div className="w-full">Meters</div>,
    cell: ({ row }) => formatWeightRange(row.original.weightRange),
    sortingFn: (a, b) => a.original.weightRange.max - b.original.weightRange.max,
    enableSorting: true,
  },
];

interface IBoatTableProps {
  data: Boats;
}

export function BoatTable({ data }: IBoatTableProps) {
  const [rowSelection, setRowSelection] = useState({});
  const [filterBy, setFilterBy] = useState<{
    seats?: Boat['seats'] | 'all';
  }>({ seats: 'all' });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const filteredData = useMemo(() => {
    if (filterBy.seats === 'all') return data;
    return data.filter((item) => item.seats === filterBy.seats);
  }, [data, filterBy]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      rowSelection,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
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
        <Label htmlFor="view-selector" className="sr-only">
          View
        </Label>
        <Select
          defaultValue="outline"
          value={filterBy.seats}
          onValueChange={(value) => {
            setFilterBy((prev) => ({
              ...prev,
              seats:
                boatSizes.find((i) => i.toLowerCase() === value) || 'all',
            }));
          }}
        >
          <SelectTrigger className="flex w-fit" size="sm" id="view-selector">
            <SelectValue placeholder="Select a view" />
          </SelectTrigger>
          <SelectContent>
            {boatSizes.map((seats) => (
              <SelectItem key={seats} value={seats}>
                {seats === 'all' ? 'All Boats' : formatSeatSetup({ seats })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <IconPlus />
            <span className="hidden lg:inline">Add Boat</span>
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
            {table.getFilteredSelectedRowModel().rows.length} of{' '}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Rows per page
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                  />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of{' '}
              {table.getPageCount()}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <IconChevronsLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <IconChevronLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <IconChevronRight />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <IconChevronsRight />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
