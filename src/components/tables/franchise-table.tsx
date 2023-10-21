import { api } from "~/lib/api";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const FranchiseTable = () => {
  const { data, isLoading } = api.franchise.getAll.useQuery();

  if (isLoading) return <div>Loading...</div>;
  if (!data) return <div>Something went wrong</div>;
  if (data.length === 0) return <div>No franchises found</div>;
  console.log(data);

  return (
    <Table>
      <TableCaption>Franchises</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Description</TableHead>
          <TableHead className="text-right">Image</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((franchise) => (
          <TableRow key={franchise.id}>
            <TableCell>{franchise.name}</TableCell>
            <TableCell>{franchise.description}</TableCell>
            <TableCell className="text-right"></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
