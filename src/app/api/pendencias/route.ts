
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("pending_conversation_monitor")
      .select(`
        conversation_id,
        driver_id,
        driver_name,
        driver_phone,
        pending_since,
        last_message_at,
        wait_minutes,
        alert_level,
        last_message_body,
        last_message_direction
      `)
      .order("wait_minutes", { ascending: false });

    if (error) {
      console.error("Erro ao buscar pendências:", error);

      return NextResponse.json(
        {
          success: false,
          error: "Não foi possível buscar as pendências.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        total: data.length,
        pendencias: data,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("Erro interno na API:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Erro interno ao consultar pendências.",
      },
      { status: 500 }
    );
  }
}
