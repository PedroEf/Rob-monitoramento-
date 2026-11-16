
"use client";

import { useEffect, useMemo, useState } from "react";

type Message = {
  id: string;
  direction: "incoming" | "outgoing";
  body: string | null;
  message_type: string | null;
  message_timestamp: string | null;
  created_at: string;
};

type Conversation = {
  id: string;
  driver_id: string;
  driver_name: string;
  driver_phone: string;
  status: "pending" | "answered" | "closed";
  pending_since: string | null;
  last_message_at: string | null;
  wait_minutes: number;
  alert_level: "normal" | "attention" | "alert" | "critical";
  messages: Message[];
};

function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");

  if (digits.length === 13) {
    return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
  }

  if (digits.length === 12) {
    return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 8)}-${digits.slice(8)}`;
  }

  return phone;
}

function formatTime(timestamp: string | null, fallback: string) {
  if (!timestamp) return "--:--";

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) return "--:--";

  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusLabel(conversation: Conversation) {
  if (conversation.status === "closed") return "Encerrada";
  if (conversation.status === "answered") return "Respondida";

  if (conversation.alert_level === "critical") return "Crítico";
  if (conversation.alert_level === "alert") return "Alerta";
  if (conversation.alert_level === "attention") return "Atenção";

  return "Normal";
}

function getStatusStyle(conversation: Conversation) {
  if (conversation.status === "closed") {
    return "bg-slate-100 text-slate-600";
  }

  if (conversation.status === "answered") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (conversation.alert_level === "critical") {
    return "bg-red-50 text-red-600";
  }

  if (conversation.alert_level === "alert") {
    return "bg-orange-50 text-orange-700";
  }

  if (conversation.alert_level === "attention") {
    return "bg-amber-50 text-amber-700";
  }

  return "bg-emerald-50 text-emerald-700";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function ConversasPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdate, setLastUpdate] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadConversations() {
      try {
        const response = await fetch("/api/conversas", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Erro HTTP ${response.status}`);
        }

        const result = await response.json();

        if (!result.success || !Array.isArray(result.conversas)) {
          throw new Error("Resposta inválida da API.");
        }

        if (!mounted) return;

        setConversations(result.conversas);

        setSelectedId((currentId) => {
          if (
            currentId &&
            result.conversas.some(
              (conversation: Conversation) => conversation.id === currentId
            )
          ) {
            return currentId;
          }

          return result.conversas[0]?.id ?? null;
        });

        setError("");
        setLastUpdate(
          new Date().toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })
        );
      } catch (err) {
        console.error("Erro ao carregar conversas:", err);

        if (mounted) {
          setError("Não foi possível carregar as conversas do Supabase.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadConversations();

    const interval = setInterval(loadConversations, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();

    return conversations.filter((conversation) => {
      return (
        conversation.driver_name.toLowerCase().includes(term) ||
        conversation.driver_phone.includes(term)
      );
    });
  }, [conversations, search]);

  const selected = conversations.find(
    (conversation) => conversation.id === selectedId
  );

  const criticalCount = conversations.filter(
    (conversation) =>
      conversation.status === "pending" &&
      conversation.alert_level === "critical"
  ).length;

  const attentionCount = conversations.filter(
    (conversation) =>
      conversation.status === "pending" &&
      conversation.alert_level === "attention"
  ).length;

  const pendingCount = conversations.filter(
    (conversation) => conversation.status === "pending"
  ).length;

  return (
    <main className="flex min-h-screen flex-col bg-[#f3f5f9] text-[#263449]">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4">
        <div>
          <a href="/" className="text-xs text-blue-600 hover:underline">
            ← Voltar à visão geral
          </a>

          <h1 className="mt-2 text-xl font-bold">Central de conversas</h1>

          <p className="text-xs text-slate-400">
            Monitoramento e acompanhamento dos motoristas
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">
            ● Banco conectado
          </span>

          <span className="text-xs text-slate-400">
            Atualizado: {lastUpdate || "Aguardando..."}
          </span>
        </div>
      </header>

      {error && (
        <div className="mx-4 mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 md:mx-6">
          {error}
        </div>
      )}

      <section className="flex flex-1 flex-col gap-4 p-4 md:flex-row md:p-6">
        {/* LISTA DE MOTORISTAS */}
        <aside className="flex w-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white md:w-[350px] md:shrink-0">
          <div className="border-b border-slate-100 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold">Motoristas</h2>

              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                {conversations.length} conversas
              </span>
            </div>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar motorista..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-400"
            />

            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-red-50 px-3 py-1 text-red-600">
                {criticalCount} críticos
              </span>

              <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">
                {attentionCount} atenção
              </span>

              <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">
                {pendingCount} pendentes
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <p className="p-6 text-center text-sm text-slate-400">
                Carregando conversas...
              </p>
            ) : filtered.length === 0 ? (
              <p className="p-6 text-center text-sm text-slate-400">
                {search
                  ? "Nenhum motorista encontrado."
                  : "Nenhuma conversa registrada."}
              </p>
            ) : (
              filtered.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => setSelectedId(conversation.id)}
                  className={`w-full border-b border-slate-100 p-4 text-left transition hover:bg-slate-50 ${
                    selectedId === conversation.id
                      ? "border-l-4 border-l-blue-600 bg-blue-50/60"
                      : "border-l-4 border-l-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
                      {getInitials(conversation.driver_name)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between gap-2">
                        <p className="truncate text-sm font-bold">
                          {conversation.driver_name}
                        </p>

                        <span className="shrink-0 text-[11px] font-semibold text-slate-500">
                          {conversation.status === "pending"
                            ? `${conversation.wait_minutes} min`
                            : conversation.status === "answered"
                            ? "Respondido"
                            : "Encerrado"}
                        </span>
                      </div>

                      <p className="mt-1 truncate text-xs text-slate-500">
                        {conversation.messages.at(-1)?.body ||
                          "Mensagem sem texto"}
                      </p>

                      <div className="mt-2">
                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-semibold ${getStatusStyle(
                            conversation
                          )}`}
                        >
                          {getStatusLabel(conversation)}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* HISTÓRICO DA CONVERSA */}
        <section className="flex min-h-[650px] min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
          {!selected ? (
            <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-slate-400">
              {loading
                ? "Carregando histórico..."
                : "Selecione uma conversa para visualizar as mensagens."}
            </div>
          ) : (
            <>
              <header className="flex items-center justify-between gap-3 border-b border-slate-100 p-5">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 font-bold text-blue-700">
                    {getInitials(selected.driver_name)}
                  </div>

                  <div className="min-w-0">
                    <h2 className="truncate font-bold">
                      {selected.driver_name}
                    </h2>

                    <p className="text-xs text-slate-400">
                      {formatPhone(selected.driver_phone)}
                    </p>
                  </div>
                </div>

                <span
                  className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold ${getStatusStyle(
                    selected
                  )}`}
                >
                  {getStatusLabel(selected)}
                </span>
              </header>

              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-5 py-3">
                <div>
                  <p className="text-xs text-slate-500">Tempo de espera</p>

                  <p
                    className={`mt-1 text-lg font-bold ${
                      selected.status !== "pending"
                        ? "text-emerald-600"
                        : selected.alert_level === "critical"
                        ? "text-red-600"
                        : selected.alert_level === "alert"
                        ? "text-orange-600"
                        : selected.alert_level === "attention"
                        ? "text-amber-600"
                        : "text-slate-700"
                    }`}
                  >
                    {selected.status === "pending"
                      ? `${selected.wait_minutes} min`
                      : selected.status === "answered"
                      ? "Respondida"
                      : "Encerrada"}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-slate-500">
                    Situação da conversa
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    {selected.status === "pending"
                      ? "Aguardando retorno da equipe"
                      : selected.status === "answered"
                      ? "Respondida pela equipe"
                      : "Conversa encerrada"}
                  </p>
                </div>
              </div>

              <div className="flex-1 space-y-5 overflow-y-auto bg-[#f7f9fc] p-5 md:p-7">
                <p className="text-center text-[11px] text-slate-400">
                  Histórico real de mensagens
                </p>

                {selected.messages.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-400">
                    Nenhuma mensagem registrada nesta conversa.
                  </p>
                ) : (
                  selected.messages.map((msg) => {
                    const fromTeam = msg.direction === "outgoing";
                    const timestamp = msg.message_timestamp || msg.created_at;

                    return (
                      <div
                        key={msg.id}
                        className={`flex ${
                          fromTeam ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm md:max-w-[70%] ${
                            fromTeam
                              ? "rounded-br-sm bg-[#dceeff] text-[#24415f]"
                              : "rounded-bl-sm border border-slate-100 bg-white text-slate-700"
                          }`}
                        >
                          <p className="mb-1 text-[10px] font-bold opacity-60">
                            {fromTeam ? "EQUIPE" : selected.driver_name}
                          </p>

                          <p className="whitespace-pre-wrap text-sm leading-6">
                            {msg.body || `Mensagem do tipo: ${msg.message_type || "não identificado"}`}
                          </p>

                          <p className="mt-2 text-right text-[10px] opacity-50">
                            {formatTime(timestamp, "")}
                            {fromTeam ? " ✓✓" : ""}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="border-t border-slate-100 bg-white p-4">
                <div className="rounded-lg bg-slate-50 p-3 text-center text-xs text-slate-500">
                  <span className="font-semibold">Modo de consulta:</span>{" "}
                  as mensagens são carregadas do WhatsApp pelo banco de dados.
                  O envio de respostas será habilitado em uma próxima etapa.
                </div>
              </div>
            </>
          )}
        </section>
      </section>
    </main>
  );
}
