import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Activities, Activity } from '@/schemas';
import { IconBrandStrava } from '@tabler/icons-react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';

const columns: ColumnDef<Activity>[] = [
  {
    accessorKey: 'startDate',
    header: 'Date',
    cell: ({ row }) => new Date(row.original.startDate).toLocaleDateString(),
  },
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => row.original.name,
  },
  {
    accessorKey: 'athlete.name',
    header: 'Athlete',
    cell: ({ row }) => row.original.athlete.name,
  },
  {
    accessorKey: 'boat.name',
    header: 'Boat',
    cell: ({ row }) => row.original.boat?.name || 'Concept2 ERG',
  },
  {
    accessorKey: 'isStrava',
    header: '',
    cell: ({ row }) => (row.original.isStrava ? <IconBrandStrava /> : null),
  },
  {
    accessorKey: 'distance',
    header: 'Meters',
    cell: ({ row }) => row.original.distance.toLocaleString(),
  },
];

interface ActivityTableProps {
  data: Activities;
  showColumns?: string[];
}

export const ActivityTable = ({
  data: activities,
  showColumns,
}: ActivityTableProps) => {
  const table = useReactTable({
    data: activities,
    columns: columns.filter((column) => {
      if (!showColumns || !('accessorKey' in column)) return true;
      return showColumns.includes(column.accessorKey);
    }),
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="overflow-auto">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center">
                No activities found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
