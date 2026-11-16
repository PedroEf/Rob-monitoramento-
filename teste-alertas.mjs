
const secret = process.env.ALERT_PROCESSOR_SECRET;

if (!secret) {
  throw new Error("Chave ALERT_PROCESSOR_SECRET não encontrada.");
}

const url = "http://localhost:3000/api/alertas/processar";

// Primeiro teste: sem chave
const unauthorized = await fetch(url, {
  method: "POST",
});

console.log("Teste sem chave:", unauthorized.status);

// Segundo teste: com chave válida
const response = await fetch(url, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${secret}`,
  },
});

console.log("Teste com chave:", response.status);
console.log("Resultado:", await response.json());
