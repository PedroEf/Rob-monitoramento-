
import "node:process";
import { setTimeout as esperar } from "node:timers/promises";

const INTERVALO = 60_000; // 1 minuto

const baseUrl = process.env.MONITOR_BASE_URL || "http://localhost:3000";
const secret = process.env.ALERT_PROCESSOR_SECRET;

if (!secret) {
  console.error("ERRO: ALERT_PROCESSOR_SECRET não encontrada no .env.local.");
  process.exit(1);
}

console.log("====================================");
console.log(" MONITOR+ | AUTOMATIZADOR DE ALERTAS");
console.log("====================================");
console.log(`Servidor: ${baseUrl}`);
console.log("Verificação automática: a cada 1 minuto");
console.log("Pressione Ctrl+C para encerrar.");
console.log("------------------------------------");

async function processarAlertas() {
  const horario = new Date().toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
  });

  console.log(`\n[${horario}] Iniciando verificação...`);

  try {
    const response = await fetch(
      `${baseUrl}/api/alertas/processar`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secret}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(30_000),
      }
    );

    const resultado = await response.json();

    if (!response.ok || !resultado.success) {
      console.error(
        `[ERRO ${response.status}]`,
        resultado.error || "Falha no processamento."
      );
      return;
    }

    console.log("Verificação concluída com sucesso.");
    console.log(
      "Alertas registrados:",
      resultado.alertas_registrados
    );
  } catch (error) {
    console.error("Falha ao conectar com o servidor:", error.message);
  }
}

while (true) {
  await processarAlertas();
  await esperar(INTERVALO);
}
