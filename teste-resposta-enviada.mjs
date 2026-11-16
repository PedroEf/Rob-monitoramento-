
import { createHmac, randomUUID } from "node:crypto";

const phone = "5511988888888";

const timestamp = Math.floor(Date.now() / 1000).toString();

const payload = {
  object: "whatsapp_business_account",
  entry: [
    {
      id: "ID_TESTE_CONTA",
      changes: [
        {
          field: "smb_message_echoes",
          value: {
            messaging_product: "whatsapp",
            message_echoes: [
              {
                from: "5511999999999",
                to: phone,
                id: `wamid.TESTE_${randomUUID()}`,
                timestamp,
                type: "text",
                text: {
                  body: "Resposta simulada do funcionário. Teste do Monitor Operacional."
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
const appSecret = process.env.META_APP_SECRET;

if (!appSecret || phone.includes("COLOQUE_AQUI")) {
  console.log("Configure o telefone e confira o META_APP_SECRET.");
  process.exit(1);
}

const signature =
  "sha256=" +
  createHmac("sha256", appSecret)
    .update(rawBody)
    .digest("hex");

try {
  console.log("Enviando resposta simulada ao webhook...");

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

  const result = await response.json();

  console.log("Status HTTP:", response.status);
  console.log("Resposta:", JSON.stringify(result, null, 2));

} catch (error) {
  console.error("Falha no teste:", error.message);
}
