import { NextResponse } from "next/server";
import { pool } from "@/app/lib/db";

export async function GET() {
  try {
    const result = await pool.query(
      "SELECT COUNT(*) AS customer_count FROM customer"
    );

    return NextResponse.json({
      success: true,
      customer_count: result.rows[0].customer_count,
    });
  } catch (error) {
    console.error("DATABASE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}