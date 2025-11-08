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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatMeters } from '@/lib/formatters';
import { routes } from '@/lib/routes';
import { Erg, Ergs } from '@/schemas';
import Link from 'next/link';

const columns: ColumnDef<Erg>[] = [
  {
    accessorKey: 'name',
    header: () => <div className="lg:w-100">Name</div>,
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Link
          href={routes.ergs.view(row.original.id.toString())}
          className="font-medium hover:underline"
        >
          {row.original.name}
        </Link>
      </div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: 'manufacturer',
    header: () => <div>Manufacturer</div>,
    cell: ({ row }) => (
      <Badge variant="outline">
        {row.original.manufacturer.toUpperCase()}
      </Badge>
    ),
    enableSorting: true,
  },
  {
    accessorKey: 'serialNumber',
    header: () => <div>Serial Number</div>,
    cell: ({ row }) => row.original.serialNumber || 'N/A',
    enableSorting: true,
  },
  {
    accessorKey: 'firmwareVersion',
    header: () => <div>Firmware</div>,
    cell: ({ row }) => row.original.firmwareVersion || 'N/A',
    enableSorting: true,
  },
  {
    accessorKey: 'meters',
    header: () => <div className="w-full">Total Meters</div>,
    cell: ({ row }) => formatMeters(row.original.meters),
    enableSorting: true,
  },
];

interface IErgTableProps {
  data: Ergs;
}

export function ErgTable({ data }: IErgTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const table = useReactTable({
    data,
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
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">
            Total ERGs: {data.length}
          </Label>
        </div>
        <Button size="sm" asChild>
          <Link href={routes.ergs.create()}>
            <IconPlus className="h-4 w-4 mr-2" />
            Add ERG
          </Link>
        </Button>
      </div>
      <div className="rounded-md border mx-4 lg:mx-6">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => header.column.toggleSorting()}
                          className="h-8 p-0 hover:bg-transparent"
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {{
                            asc: <IconCaretUp className="ml-2 h-4 w-4" />,
                            desc: <IconCaretDown className="ml-2 h-4 w-4" />,
                          }[header.column.getIsSorted() as string] ?? null}
                        </Button>
                      ) : (
                        flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No ergs found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between space-x-2 py-4 px-4 lg:px-6">
        <div className="text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{' '}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}