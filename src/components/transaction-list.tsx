"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Building2,
  Tag
} from "lucide-react"
import { TransactionForm } from "@/components/transaction-form"
import { cn } from "@/lib/utils"

interface Transaction {
  id: string
  amount: number
  description?: string
  vendor?: string
  date: string
  type: "INCOME" | "EXPENSE"
  status: "PENDING" | "COMPLETED" | "CANCELLED"
  notes?: string
  receiptUrl?: string
  business?: { id: string; name: string }
  category?: { id: string; name: string; type: string; color?: string }
}

interface TransactionListProps {
  onTransactionSelect?: (transaction: Transaction) => void
  className?: string
}

export function TransactionList({ onTransactionSelect, className }: TransactionListProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [showForm, setShowForm] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null)
  const [categories, setCategories] = useState([])
  const [businesses, setBusinesses] = useState([])

  useEffect(() => {
    fetchTransactions()
    fetchCategories()
    fetchBusinesses()
  }, [])

  const fetchTransactions = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/transactions")
      if (response.ok) {
        const data = await response.json()
        setTransactions(data.transactions)
      }
    } catch (error) {
      console.error("Error fetching transactions:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories")
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  const fetchBusinesses = async () => {
    try {
      // Mock businesses for now
      setBusinesses([
        { id: "1", name: "Main Business" },
        { id: "2", name: "Side Business" },
      ])
    } catch (error) {
      console.error("Error fetching businesses:", error)
    }
  }

  const handleCreateTransaction = async (data: any) => {
    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        fetchTransactions()
      }
    } catch (error) {
      console.error("Error creating transaction:", error)
    }
  }

  const handleUpdateTransaction = async (data: any) => {
    if (!editingTransaction) return

    try {
      const response = await fetch(`/api/transactions/${editingTransaction.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        fetchTransactions()
        setEditingTransaction(null)
      }
    } catch (error) {
      console.error("Error updating transaction:", error)
    }
  }

  const handleDeleteTransaction = async () => {
    if (!deletingTransaction) return

    try {
      const response = await fetch(`/api/transactions/${deletingTransaction.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchTransactions()
        setDeletingTransaction(null)
      }
    } catch (error) {
      console.error("Error deleting transaction:", error)
    }
  }

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = 
      transaction.vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.business?.name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = filterType === "all" || transaction.type === filterType
    const matchesStatus = filterStatus === "all" || transaction.status === filterStatus

    return matchesSearch && matchesType && matchesStatus
  })

  const formatAmount = (amount: number) => {
    return `${amount < 0 ? "-" : "+"}$${Math.abs(amount).toFixed(2)}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "default"
      case "PENDING":
        return "secondary"
      case "CANCELLED":
        return "destructive"
      default:
        return "outline"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <div className="w-2 h-6 rounded-full bg-gradient-to-b from-blue-500 to-purple-600"></div>
              Transactions
            </CardTitle>
            <CardDescription>Manage your accounting transactions</CardDescription>
          </div>
          <Button onClick={() => setShowForm(true)} className="shadow-sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="INCOME">Income</SelectItem>
              <SelectItem value="EXPENSE">Expense</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-[500px]">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <div className="text-right space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No transactions found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || filterType !== "all" || filterStatus !== "all"
                  ? "Try adjusting your search or filters"
                  : "Get started by adding your first transaction"}
              </p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Transaction
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    {/* Transaction Icon */}
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                        transaction.type === "INCOME"
                          ? "bg-green-100 text-green-600"
                          : "bg-red-100 text-red-600"
                      )}
                    >
                      {transaction.type === "INCOME" ? (
                        <ArrowUpRight className="h-5 w-5" />
                      ) : (
                        <ArrowDownRight className="h-5 w-5" />
                      )}
                    </div>

                    {/* Transaction Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium truncate">
                          {transaction.vendor || transaction.description || "Unnamed Transaction"}
                        </h4>
                        <Badge variant={getStatusColor(transaction.status)} className="text-xs">
                          {transaction.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        {transaction.category && (
                          <div className="flex items-center gap-1">
                            <Tag className="h-3 w-3" />
                            <span>{transaction.category.name}</span>
                          </div>
                        )}
                        {transaction.business && (
                          <div className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            <span>{transaction.business.name}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(transaction.date)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Amount and Actions */}
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <p
                        className={cn(
                          "font-semibold",
                          transaction.type === "INCOME" ? "text-green-600" : "text-red-600"
                        )}
                      >
                        {formatAmount(transaction.amount)}
                      </p>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => onTransactionSelect?.(transaction)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setEditingTransaction(transaction)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        {transaction.receiptUrl && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Download className="h-4 w-4 mr-2" />
                              Download Receipt
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeletingTransaction(transaction)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>

      {/* Transaction Form Dialog */}
      <TransactionForm
        open={showForm}
        onOpenChange={setShowForm}
        onSubmit={handleCreateTransaction}
        categories={categories}
        businesses={businesses}
      />

      {/* Edit Transaction Dialog */}
      {editingTransaction && (
        <TransactionForm
          open={!!editingTransaction}
          onOpenChange={(open) => !open && setEditingTransaction(null)}
          onSubmit={handleUpdateTransaction}
          initialData={{
            amount: editingTransaction.amount.toString(),
            type: editingTransaction.type,
            description: editingTransaction.description,
            vendor: editingTransaction.vendor,
            date: new Date(editingTransaction.date),
            categoryId: editingTransaction.category?.id,
            businessId: editingTransaction.business?.id,
            status: editingTransaction.status,
            notes: editingTransaction.notes,
            receiptUrl: editingTransaction.receiptUrl,
          }}
          categories={categories}
          businesses={businesses}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingTransaction} onOpenChange={() => setDeletingTransaction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this transaction? This action cannot be undone.
              <br />
              <br />
              <strong>
                {deletingTransaction?.vendor || deletingTransaction?.description} -{" "}
                {formatAmount(deletingTransaction?.amount || 0)}
              </strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTransaction} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}