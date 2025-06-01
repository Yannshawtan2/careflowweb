export interface InventoryItem {
    id: string
    name: string
    type: "food" | "medical"
    quantity: number
    minimumQuantity: number
    expiryDate: string
    unit: string
    location: string
  }
  