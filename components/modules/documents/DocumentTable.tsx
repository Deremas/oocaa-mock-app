import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/components/common/format";

type DocumentRow = {
  id: string;
  docNo: string;
  candidateName: string;
  branchName: string;
  status: string;
  attachmentCount?: number;
  createdAt: Date | string;
};

export function DocumentTable({ rows }: { rows: DocumentRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Doc No</TableHead>
          <TableHead>Candidate</TableHead>
          <TableHead>Branch</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Attachments</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>View</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="font-medium">{row.docNo}</TableCell>
            <TableCell>{row.candidateName}</TableCell>
            <TableCell>{row.branchName}</TableCell>
            <TableCell>
              <Badge variant="outline">{row.status}</Badge>
            </TableCell>
            <TableCell>{row.attachmentCount ?? 0}</TableCell>
            <TableCell>{formatDate(row.createdAt)}</TableCell>
            <TableCell>
              <Link href={`/documents/${row.id}`} className="text-primary hover:underline">
                View
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
