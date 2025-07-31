import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const transaction = await db.transaction.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        business: true,
        category: true,
      },
    })

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(transaction)
  } catch (error) {
    console.error("Error fetching transaction:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      amount,
      description,
      vendor,
      date,
      type,
      status,
      notes,
      receiptUrl,
      businessId,
      categoryId,
    } = body

    const existingTransaction = await db.transaction.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    if (!existingTransaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      )
    }

    const transaction = await db.transaction.update({
      where: { id: params.id },
      data: {
        amount: amount !== undefined ? parseFloat(amount) : existingTransaction.amount,
        description: description !== undefined ? description : existingTransaction.description,
        vendor: vendor !== undefined ? vendor : existingTransaction.vendor,
        date: date !== undefined ? new Date(date) : existingTransaction.date,
        type: type !== undefined ? type : existingTransaction.type,
        status: status !== undefined ? status : existingTransaction.status,
        notes: notes !== undefined ? notes : existingTransaction.notes,
        receiptUrl: receiptUrl !== undefined ? receiptUrl : existingTransaction.receiptUrl,
        businessId: businessId !== undefined ? businessId : existingTransaction.businessId,
        categoryId: categoryId !== undefined ? categoryId : existingTransaction.categoryId,
      },
      include: {
        business: true,
        category: true,
      },
    })

    return NextResponse.json(transaction)
  } catch (error) {
    console.error("Error updating transaction:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const existingTransaction = await db.transaction.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    if (!existingTransaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      )
    }

    await db.transaction.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Transaction deleted successfully" })
  } catch (error) {
    console.error("Error deleting transaction:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}