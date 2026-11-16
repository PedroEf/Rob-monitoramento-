
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. Buscar as conversas
    const { data: conversations, error: conversationsError } =
      await supabaseAdmin
        .from("conversations")
        .select(
          "id, driver_id, status, pending_since, last_message_at, created_at"
        )
        .order("last_message_at", { ascending: false });

    if (conversationsError) throw conversationsError;

    if (!conversations || conversations.length === 0) {
      return NextResponse.json({
        success: true,
        total: 0,
        conversas: [],
      });
    }

    const conversationIds = conversations.map((c) => c.id);
    const driverIds = [...new Set(conversations.map((c) => c.driver_id))];

    // 2. Buscar os motoristas
    const { data: drivers, error: driversError } = await supabaseAdmin
      .from("drivers")
      .select("id, name, phone")
      .in("id", driverIds);

    if (driversError) throw driversError;

    // 3. Buscar as mensagens dessas conversas
    const { data: messages, error: messagesError } = await supabaseAdmin
      .from("messages")
      .select(
        "id, conversation_id, direction, body, message_type, message_timestamp, created_at"
      )
      .in("conversation_id", conversationIds)
      .order("message_timestamp", { ascending: true });

    if (messagesError) throw messagesError;

    // 4. Buscar os tempos e níveis de alerta das pendências
    const { data: pendingData, error: pendingError } = await supabaseAdmin
      .from("pending_conversation_monitor")
      .select("conversation_id, wait_minutes, alert_level")
      .in("conversation_id", conversationIds);

    if (pendingError) throw pendingError;

    // 5. Organizar os dados para a tela
    const conversas = conversations.map((conversation) => {
      const driver = drivers?.find(
        (item) => item.id === conversation.driver_id
      );

      const conversationMessages = (messages ?? [])
        .filter((item) => item.conversation_id === conversation.id)
        .sort((a, b) => {
          const timeA = new Date(
            a.message_timestamp ?? a.created_at
          ).getTime();
          const timeB = new Date(
            b.message_timestamp ?? b.created_at
          ).getTime();

          return timeA - timeB;
        });

      const pending = pendingData?.find(
        (item) => item.conversation_id === conversation.id
      );

      return {
        id: conversation.id,
        driver_id: conversation.driver_id,
        driver_name: driver?.name ?? "Motorista sem nome",
        driver_phone: driver?.phone ?? "",
        status: conversation.status,
        pending_since: conversation.pending_since,
        last_message_at: conversation.last_message_at,
        wait_minutes: pending?.wait_minutes ?? 0,
        alert_level: pending?.alert_level ?? "normal",
        messages: conversationMessages,
      };
    });

    return NextResponse.json(
      {
        success: true,
        total: conversas.length,
        conversas,
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store, max-age=0" },
      }
    );
  } catch (error) {
    console.error("Erro ao buscar conversas:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Não foi possível carregar as conversas.",
      },
      { status: 500 }
    );
  }
}
