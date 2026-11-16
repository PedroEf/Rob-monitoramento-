
import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const secret = process.env.ALERT_PROCESSOR_SECRET;

    if (!secret) {
      console.error("ALERT_PROCESSOR_SECRET não configurada.");

      return NextResponse.json(
        { success: false, error: "Configuração de segurança ausente." },
        { status: 503 }
      );
    }

    const authorization = request.headers.get("authorization") || "";
    const receivedToken = authorization.startsWith("Bearer ")
      ? authorization.slice(7)
      : "";

    const expectedBuffer = Buffer.from(secret);
    const receivedBuffer = Buffer.from(receivedToken);

    const validToken =
      expectedBuffer.length === receivedBuffer.length &&
      timingSafeEqual(expectedBuffer, receivedBuffer);

    if (!validToken) {
      return NextResponse.json(
        { success: false, error: "Não autorizado." },
        { status: 401 }
      );
    }

    const { data, error } = await supabaseAdmin.rpc(
      "process_pending_alerts"
    );

    if (error) {
      console.error("ERRO DETALHADO DO SUPABASE:", {
  message: error.message,
  code: error.code,
  details: error.details,
  hint: error.hint,
});

      return NextResponse.json(
        {
          success: false,
          error: "Não foi possível processar os alertas.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        alertas_registrados: data ?? 0,
        message: "Processamento de alertas concluído.",
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store, max-age=0" },
      }
    );
  } catch (error) {
    console.error("Erro interno no processamento de alertas:", error);

    return NextResponse.json(
      { success: false, error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
