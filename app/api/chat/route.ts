
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { pool } from "@/app/lib/db";
import { NextResponse } from "next/server";

const model = openai("gpt-5.6-luna");

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const userMessage =
      messages?.[messages.length - 1]?.content;

    if (
      typeof userMessage !== "string" ||
      !userMessage.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Message is required",
        },
        { status: 400 }
      );
    }

    // 1. CLASSIFY THE QUESTION

    const intentResult = await generateText({
      model,
      prompt: `
Classify the user's question into exactly one category:

DATABASE
GENERAL

DATABASE:
Questions requiring information from the connected
PostgreSQL database, such as customers, rentals,
payments, films, counts, or database records.

GENERAL:
General knowledge, explanations, coding help,
greetings, mathematics, and other questions that
do not require querying the connected database.

Return only DATABASE or GENERAL.

Question:
${userMessage}
`,
    });

    const intent = intentResult.text
      .trim()
      .toUpperCase();

    // 2. HANDLE GENERAL AI QUESTIONS

    if (intent !== "DATABASE") {
      const answerResult = await generateText({
        model,
        messages: messages.map(
          (m: { role: string; content: string }) => ({
            role: m.role,
            content: m.content,
          })
        ),
      });

      return NextResponse.json({
        success: true,
        type: "general",
        answer: answerResult.text,
      });
    }

    // 3. LOAD DATABASE SCHEMA

    const columnsResult = await pool.query(`
      SELECT
        table_name,
        column_name,
        data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND column_name NOT IN ('password', 'picture')
        AND table_name NOT LIKE 'payment_p2020_%'
      ORDER BY table_name, ordinal_position;
    `);

    // 4. LOAD DATABASE RELATIONSHIPS

    const relationshipsResult = await pool.query(`
      SELECT
        tc.table_name AS table_name,
        kcu.column_name AS column_name,
        ccu.table_name AS referenced_table,
        ccu.column_name AS referenced_column
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
      ORDER BY tc.table_name, kcu.column_name;
    `);

    const schema = columnsResult.rows
      .map(
        (row) =>
          `${row.table_name}.${row.column_name} (${row.data_type})`
      )
      .join("\n");

    const relationships = relationshipsResult.rows
      .map(
        (row) =>
          `${row.table_name}.${row.column_name} -> ${row.referenced_table}.${row.referenced_column}`
      )
      .join("\n");

    // 5. GENERATE SQL

    const sqlResult = await generateText({
      model,
      prompt: `
You are a PostgreSQL query generator.

Generate exactly one read-only SELECT query
to answer the user's database question.

Database schema:
${schema}

Relationships:
${relationships}

User question:
${userMessage}

Rules:
- Only generate a SELECT statement.
- Use only the provided tables and columns.
- Use relationships when JOINs are needed.
- Never modify database data.
- Do not generate multiple statements.
- Return only SQL without markdown.
`,
    });

    const sql = sqlResult.text
      .trim()
      .replace(/^```sql/i, "")
      .replace(/^```/i, "")
      .replace(/```$/i, "")
      .trim();

    // 6. BASIC SQL VALIDATION

    const normalizedSql = sql
      .replace(/;\s*$/, "")
      .trim();

    const isSelect =
      /^SELECT\b/i.test(normalizedSql);

    const hasMultipleStatements =
      normalizedSql.includes(";");

    const forbiddenKeywords =
      /\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|GRANT|REVOKE|COPY|CALL|DO|EXECUTE|INTO|SET)\b/i;

    const dangerousFunctions =
      /\b(pg_sleep|dblink|lo_import|lo_export|set_config)\s*\(/i;

    if (
      !isSelect ||
      hasMultipleStatements ||
      forbiddenKeywords.test(normalizedSql) ||
      dangerousFunctions.test(normalizedSql)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Unsafe SQL query blocked.",
        },
        { status: 400 }
      );
    }

    // 7. EXECUTE QUERY

    const dbResult = await pool.query({
      text: normalizedSql,
      rowMode: "array",
    });

    // 8. EXPLAIN DATABASE RESULTS

    const answerResult = await generateText({
      model,
      prompt: `
You are a helpful database assistant.

User question:
${userMessage}

Database results:
${JSON.stringify(dbResult.rows)}

Answer using only the database results.

- Be clear and concise.
- Do not invent data.
- If there are no results, say so.
- Format lists and numbers clearly.
`,
    });

    return NextResponse.json({
      success: true,
      type: "database",
      answer: answerResult.text,
      sql: normalizedSql,
      rows: dbResult.rows,
    });

  } catch (error) {
    console.error("CHAT ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Something went wrong while processing your question.",
      },
      { status: 500 }
    );
  }
}