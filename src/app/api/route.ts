import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    name: "AXEL Marketplace API",
    version: "1.0",
    endpoints: {
      auth: "/api/auth",
      products: "/api/products",
      categories: "/api/categories",
      orders: "/api/orders",
      credit: "/api/credit",
      delivery: "/api/delivery",
    },
  })
}
