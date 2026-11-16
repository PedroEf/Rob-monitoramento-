
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = await params;

    // 1. Buscar o alerta
    const { data: alerta, error: alertaError } = await supabaseAdmin
      .from("alert_logs")
      .select(
        "id, conversation_id, alert_level, status, channel, pending_since, sent_at"
      )
      .eq("id", id)
      .maybeSingle();

    if (alertaError) throw alertaError;

    if (!alerta) {
      return NextResponse.json(
        { success: false, error: "Alerta não encontrado." },
        { status: 404 }
      );
    }

    if (!alerta.conversation_id) {
      return NextResponse.json(
        { success: false, error: "Este alerta não possui conversa relacionada." },
        { status: 404 }
      );
    }

    // 2. Buscar a conversa
    const { data: conversa, error: conversaError } = await supabaseAdmin
      .from("conversations")
      .select("id, driver_id, status, pending_since, last_message_at")
      .eq("id", alerta.conversation_id)
      .maybeSingle();

    if (conversaError) throw conversaError;

    if (!conversa) {
      return NextResponse.json(
        { success: false, error: "Conversa não encontrada." },
        { status: 404 }
      );
    }

    // 3. Buscar o motorista
    const { data: motorista, error: motoristaError } = await supabaseAdmin
      .from("drivers")
      .select("id, name, phone")
      .eq("id", conversa.driver_id)
      .maybeSingle();

    if (motoristaError) throw motoristaError;

    // 4. Buscar o histórico de mensagens
    const { data: mensagens, error: mensagensError } = await supabaseAdmin
      .from("messages")
      .select(
        "id, direction, message_type, body, message_status, message_timestamp"
      )
      .eq("conversation_id", conversa.id)
      .order("message_timestamp", { ascending: true });

    if (mensagensError) throw mensagensError;

    // 5. Calcular o tempo da pendência
    const inicio = conversa.pending_since
      ? new Date(conversa.pending_since).getTime()
      : null;

    const fim = conversa.status === "pending"
      ? Date.now()
      : conversa.last_message_at
        ? new Date(conversa.last_message_at).getTime()
        : Date.now();

    const tempoEsperaMinutos =
      inicio !== null && Number.isFinite(inicio)
        ? Math.max(0, Math.floor((fim - inicio) / 60000))
        : null;

    return NextResponse.json(
      {
        success: true,
        alerta,
        conversa,
        motorista: motorista ?? {
          name: "Motorista não identificado",
          phone: "",
        },
        tempo_espera_minutos: tempoEsperaMinutos,
        mensagens: mensagens ?? [],
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store, max-age=0" },
      }
    );
  } catch (error) {
    console.error("Erro ao buscar detalhes do alerta:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Não foi possível carregar os detalhes do alerta.",
      },
      { status: 500 }
    );
  }
}
