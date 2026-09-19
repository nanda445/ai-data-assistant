import { NextResponse } from "next/server";
import { pool } from "@/app/lib/db";

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json(
        {
          success: false,
          error: "SQL query is required",
        },
        { status: 400 }
      );
    }

    const result = await pool.query(query);

    return NextResponse.json({
      success: true,
      rows: result.rows,
      rowCount: result.rowCount,
    });
  } catch (error) {
    console.error("DATABASE QUERY ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}