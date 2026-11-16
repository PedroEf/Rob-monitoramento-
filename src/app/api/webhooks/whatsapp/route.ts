
import { createHmac, timingSafeEqual } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

// Verificação inicial da Meta.
export async function GET(request: Request) {
  const url = new URL(request.url);

  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (!expectedToken) {
    return new Response("Webhook ainda não configurado.", {
      status: 503,
    });
  }

  if (mode === "subscribe" && token === expectedToken && challenge) {
    return new Response(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return new Response("Verificação recusada.", { status: 403 });
}

// Extrai o conteúdo principal de cada tipo de mensagem.
function getMessageBody(message: any): string | null {
  const content = message[message.type];

  if (!content) return null;

  if (typeof content.body === "string") return content.body;
  if (typeof content.caption === "string") return content.caption;

  if (message.type === "interactive") {
    return JSON.stringify(content);
  }

  return null;
}

// Recebimento, interpretação e armazenamento das mensagens.
export async function POST(request: Request) {
  const appSecret = process.env.META_APP_SECRET;
  const signature = request.headers.get("x-hub-signature-256");

  if (!appSecret) {
    return Response.json(
      { error: "Segredo do aplicativo não configurado." },
      { status: 503 }
    );
  }

  if (!signature || !signature.startsWith("sha256=")) {
    return Response.json(
      { error: "Assinatura ausente ou inválida." },
      { status: 401 }
    );
  }

  const rawBody = await request.text();

  const expectedSignature =
    "sha256=" +
    createHmac("sha256", appSecret)
      .update(rawBody)
      .digest("hex");

  const receivedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    receivedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(receivedBuffer, expectedBuffer)
  ) {
    return Response.json(
      { error: "Assinatura não confere." },
      { status: 401 }
    );
  }

  let payload: any;

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return Response.json(
      { error: "Conteúdo JSON inválido." },
      { status: 400 }
    );
  }

  if (payload.object !== "whatsapp_business_account") {
    return Response.json(
      { error: "Evento não reconhecido." },
      { status: 400 }
    );
  }

  let mensagensSalvas = 0;
  let mensagensDuplicadas = 0;
  let mensagensIgnoradas = 0;

  let mensagensEnviadasSalvas = 0;
  let mensagensEnviadasDuplicadas = 0;
  let mensagensEnviadasIgnoradas = 0;

  let atualizacoesStatus = 0;

  const entries = Array.isArray(payload.entry)
    ? payload.entry
    : [];

  try {
    for (const entry of entries) {
      const changes = Array.isArray(entry.changes)
        ? entry.changes
        : [];

      for (const change of changes) {
        const value = change.value ?? {};

        // 1. MENSAGENS RECEBIDAS DOS MOTORISTAS
        if (change.field === "messages") {
          const contacts = Array.isArray(value.contacts)
            ? value.contacts
            : [];

          const messages = Array.isArray(value.messages)
            ? value.messages
            : [];

          const statuses = Array.isArray(value.statuses)
            ? value.statuses
            : [];

          atualizacoesStatus += statuses.length;

          for (const message of messages) {
            const phone = message.from;
            const messageId = message.id;

            if (!phone || !messageId) {
              mensagensIgnoradas++;
              continue;
            }

            const contact = contacts.find(
              (item: any) => item.wa_id === phone
            );

            const timestampSeconds = Number(message.timestamp);
            const messageDate = new Date(timestampSeconds * 1000);

            if (
              !Number.isFinite(timestampSeconds) ||
              Number.isNaN(messageDate.getTime())
            ) {
              mensagensIgnoradas++;
              continue;
            }

            const { data, error } = await supabaseAdmin.rpc(
              "process_incoming_whatsapp_message",
              {
                p_phone: phone,
                p_name: contact?.profile?.name ?? null,
                p_wa_message_id: messageId,
                p_message_type: message.type ?? "unknown",
                p_body: getMessageBody(message),
                p_message_timestamp: messageDate.toISOString(),
              }
            );

            if (error) {
              console.error("ERRO AO SALVAR MENSAGEM RECEBIDA:", error);

              return Response.json(
                { error: "Não foi possível salvar a mensagem recebida." },
                { status: 500 }
              );
            }

            if (data?.duplicate) {
              mensagensDuplicadas++;
            } else if (data?.success) {
              mensagensSalvas++;
            } else {
              mensagensIgnoradas++;
            }
          }
        }

        // 2. RESPOSTAS ENVIADAS PELO WHATSAPP BUSINESS
        else if (change.field === "smb_message_echoes") {
          const echoes = Array.isArray(value.message_echoes)
            ? value.message_echoes
            : [];

          for (const message of echoes) {
            const phone = message.to;
            const messageId = message.id;

            if (!phone || !messageId) {
              mensagensEnviadasIgnoradas++;
              continue;
            }

            // Edições e exclusões não são novas respostas.
            if (
              message.type === "edit" ||
              message.type === "revoke"
            ) {
              mensagensEnviadasIgnoradas++;
              continue;
            }

            const timestampSeconds = Number(message.timestamp);
            const messageDate = new Date(timestampSeconds * 1000);

            if (
              !Number.isFinite(timestampSeconds) ||
              Number.isNaN(messageDate.getTime())
            ) {
              mensagensEnviadasIgnoradas++;
              continue;
            }

            const { data, error } = await supabaseAdmin.rpc(
              "process_outgoing_whatsapp_message",
              {
                p_phone: phone,
                p_wa_message_id: messageId,
                p_message_type: message.type ?? "unknown",
                p_body: getMessageBody(message),
                p_message_timestamp: messageDate.toISOString(),
              }
            );

            if (error) {
              console.error("ERRO AO SALVAR RESPOSTA ENVIADA:", error);

              return Response.json(
                { error: "Não foi possível salvar a resposta enviada." },
                { status: 500 }
              );
            }

            if (data?.duplicate) {
              mensagensEnviadasDuplicadas++;
            } else if (data?.ignored) {
              mensagensEnviadasIgnoradas++;
            } else if (data?.success) {
              mensagensEnviadasSalvas++;
            } else {
              mensagensEnviadasIgnoradas++;
            }
          }
        }
      }
    }

    console.log("WEBHOOK WHATSAPP PROCESSADO:", {
      mensagensSalvas,
      mensagensDuplicadas,
      mensagensIgnoradas,
      mensagensEnviadasSalvas,
      mensagensEnviadasDuplicadas,
      mensagensEnviadasIgnoradas,
      atualizacoesStatus,
    });

    return Response.json({
      success: true,
      received: true,
      mensagensSalvas,
      mensagensDuplicadas,
      mensagensIgnoradas,
      mensagensEnviadasSalvas,
      mensagensEnviadasDuplicadas,
      mensagensEnviadasIgnoradas,
      atualizacoesStatus,
    });

  } catch (error) {
    console.error("Erro no processamento do webhook:", error);

    return Response.json(
      { error: "Erro interno ao processar notificação." },
      { status: 500 }
    );
  }
}
