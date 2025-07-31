import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const type = searchParams.get("type")
    const businessId = searchParams.get("businessId")
    const categoryId = searchParams.get("categoryId")

    const skip = (page - 1) * limit

    const where: any = {
      userId: session.user.id,
    }

    if (type) {
      where.type = type
    }

    if (businessId) {
      where.businessId = businessId
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    const [transactions, total] = await Promise.all([
      db.transaction.findMany({
        where,
        include: {
          business: true,
          category: true,
        },
        orderBy: {
          date: "desc",
        },
        skip,
        take: limit,
      }),
      db.transaction.count({ where }),
    ])

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching transactions:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    if (!amount || !type) {
      return NextResponse.json(
        { error: "Amount and type are required" },
        { status: 400 }
      )
    }

    const transaction = await db.transaction.create({
      data: {
        amount: parseFloat(amount),
        description,
        vendor,
        date: date ? new Date(date) : new Date(),
        type,
        status: status || "COMPLETED",
        notes,
        receiptUrl,
        businessId,
        categoryId,
        userId: session.user.id,
      },
      include: {
        business: true,
        category: true,
      },
    })

    return NextResponse.json(transaction, { status: 201 })
  } catch (error) {
    console.error("Error creating transaction:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}