import { DollarSign } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const overduePayments = [
  {
    id: 1,
    resident: "John Smith",
    unit: "A-101",
    amount: 1250,
    dueDate: "2023-04-01",
    daysOverdue: 15,
  },
  {
    id: 2,
    resident: "Sarah Johnson",
    unit: "B-205",
    amount: 1350,
    dueDate: "2023-04-01",
    daysOverdue: 15,
  },
  {
    id: 3,
    resident: "Michael Brown",
    unit: "C-310",
    amount: 1450,
    dueDate: "2023-04-01",
    daysOverdue: 15,
  },
  {
    id: 4,
    resident: "Emily Davis",
    unit: "A-202",
    amount: 1250,
    dueDate: "2023-04-01",
    daysOverdue: 15,
  },
]

export function OverduePayments() {
  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-[#FFFDF6]">
          <TableHead>Resident</TableHead>
          <TableHead>Unit</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead className="text-right">Days Overdue</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {overduePayments.map((payment) => (
          <TableRow key={payment.id}>
            <TableCell className="font-medium">{payment.resident}</TableCell>
            <TableCell>{payment.unit}</TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-2">
                <DollarSign className="h-4 w-4 text-[#A0C878]" />
                {payment.amount}
              </div>
            </TableCell>
            <TableCell className="text-right">{payment.daysOverdue}</TableCell>
            <TableCell className="text-right">
              <Button size="sm" variant="outline" className="border-[#DDEB9D] hover:bg-[#DDEB9D] hover:text-black">
                Send Reminder
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
