
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Buscar registros de alertas
    const { data: alertas, error: alertasError } = await supabaseAdmin
      .from("alert_logs")
      .select(
        "id, conversation_id, alert_level, status, channel, pending_since, sent_at"
      )
      .order("pending_since", { ascending: false });

    if (alertasError) throw alertasError;

    if (!alertas || alertas.length === 0) {
      return NextResponse.json({
        success: true,
        total: 0,
        resumo: { pending: 0, sent: 0, failed: 0 },
        alertas: [],
      });
    }

    // Buscar conversas relacionadas
    const conversationIds = [
      ...new Set(
        alertas
          .map((a) => a.conversation_id)
          .filter((id): id is string => Boolean(id))
      ),
    ];

    const { data: conversas, error: conversasError } =
      conversationIds.length > 0
        ? await supabaseAdmin
            .from("conversations")
            .select("id, driver_id")
            .in("id", conversationIds)
        : { data: [], error: null };

    if (conversasError) throw conversasError;

    // Buscar motoristas relacionados
    const driverIds = [
      ...new Set((conversas ?? []).map((c) => c.driver_id)),
    ];

    const { data: motoristas, error: motoristasError } =
      driverIds.length > 0
        ? await supabaseAdmin
            .from("drivers")
            .select("id, name, phone")
            .in("id", driverIds)
        : { data: [], error: null };

    if (motoristasError) throw motoristasError;

    // Organizar os dados
    const resultado = alertas.map((alerta) => {
      const conversa = conversas?.find(
        (c) => c.id === alerta.conversation_id
      );

      const motorista = motoristas?.find(
        (m) => m.id === conversa?.driver_id
      );

      return {
        ...alerta,
        driver_name: motorista?.name ?? "Motorista não identificado",
        driver_phone: motorista?.phone ?? "",
      };
    });

    // Resumo dos status
    const resumo = {
      pending: resultado.filter((a) => a.status === "pending").length,
      sent: resultado.filter((a) => a.status === "sent").length,
      failed: resultado.filter((a) => a.status === "failed").length,
    };

    return NextResponse.json(
      {
        success: true,
        total: resultado.length,
        resumo,
        alertas: resultado,
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store, max-age=0" },
      }
    );
  } catch (error) {
    console.error("Erro ao buscar alertas:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Não foi possível carregar os alertas.",
      },
      { status: 500 }
    );
  }
}
