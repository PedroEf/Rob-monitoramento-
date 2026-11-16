
import { createHmac, randomUUID } from "node:crypto";

const appSecret = process.env.META_APP_SECRET;

if (!appSecret) {
  console.error("ERRO: META_APP_SECRET não foi carregado.");
  process.exit(1);
}

const phone = "5511988888888";

const payload = {
  object: "whatsapp_business_account",
  entry: [
    {
      id: "ID_TESTE",
      changes: [
        {
          field: "messages",
          value: {
            messaging_product: "whatsapp",
            metadata: {
              display_phone_number: "5511999999999",
              phone_number_id: "123456789"
            },
            contacts: [
              {
                profile: { name: "Motorista Teste" },
                wa_id: phone
              }
            ],
            messages: [
              {
                from: phone,
                id: `wamid.NOVA_MENSAGEM_${randomUUID()}`,
                timestamp: Math.floor(Date.now() / 1000).toString(),
                type: "text",
                text: {
                  body: "Nova mensagem do motorista. Teste de reabertura de pendência."
                }
              }
            ]
          }
        }
      ]
    }
  ]
};

const rawBody = JSON.stringify(payload);

const signature =
  "sha256=" +
  createHmac("sha256", appSecret)
    .update(rawBody)
    .digest("hex");

try {
  console.log("Enviando nova mensagem simulada...");

  const response = await fetch(
    "http://localhost:3000/api/webhooks/whatsapp",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hub-signature-256": signature
      },
      body: rawBody
    }
  );

  console.log("Status HTTP:", response.status);
  console.log("Resposta:", await response.text());

} catch (error) {
  console.error("Erro no teste:", error.message);
}
