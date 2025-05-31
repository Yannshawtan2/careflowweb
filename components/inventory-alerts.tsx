import { Package } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const inventoryAlerts = [
  {
    id: 1,
    name: "Cleaning Supplies",
    currentStock: 5,
    minRequired: 20,
    lastOrdered: "2023-04-15",
  },
  {
    id: 2,
    name: "Light Bulbs",
    currentStock: 8,
    minRequired: 30,
    lastOrdered: "2023-05-02",
  },
  {
    id: 3,
    name: "Air Filters",
    currentStock: 3,
    minRequired: 15,
    lastOrdered: "2023-03-28",
  },
  {
    id: 4,
    name: "Maintenance Tools",
    currentStock: 2,
    minRequired: 10,
    lastOrdered: "2023-04-10",
  },
  {
    id: 5,
    name: "Office Supplies",
    currentStock: 7,
    minRequired: 25,
    lastOrdered: "2023-05-05",
  },
]

export function InventoryAlerts() {
  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-[#FFFDF6]">
          <TableHead>Item</TableHead>
          <TableHead className="text-right">Current Stock</TableHead>
          <TableHead className="text-right">Min Required</TableHead>
          <TableHead className="text-right">Last Ordered</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {inventoryAlerts.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-[#A0C878]" />
                {item.name}
              </div>
            </TableCell>
            <TableCell className="text-right">{item.currentStock}</TableCell>
            <TableCell className="text-right">{item.minRequired}</TableCell>
            <TableCell className="text-right">{item.lastOrdered}</TableCell>
            <TableCell className="text-right">
              <Button size="sm" className="bg-[#A0C878] hover:bg-[#8AB868] text-white">
                Reorder
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
