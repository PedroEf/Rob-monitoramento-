
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Detalhes = {
  alerta: {
    id: string;
    conversation_id: string;
    alert_level: string;
    status: string;
    channel: string;
    pending_since: string | null;
    sent_at: string | null;
  };
  conversa: {
    id: string;
    status: string;
    pending_since: string | null;
    last_message_at: string | null;
  };
  motorista: {
    id?: string;
    name: string;
    phone: string;
  };
  tempo_espera_minutos: number | null;
  mensagens: {
    id: string;
    direction: string;
    message_type: string;
    body: string | null;
    message_status: string | null;
    message_timestamp: string | null;
  }[];
};

export default function DetalheAlertaPage() {
  const params = useParams();
  const id = params.id as string;

  const [dados, setDados] = useState<Detalhes | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregarDetalhes() {
    try {
      const response = await fetch(`/api/alertas/${id}`, {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Não foi possível carregar os detalhes.");
      }

      setDados(data);
      setErro("");
    } catch (error) {
      console.error("Erro ao carregar detalhes:", error);
      setErro("Não foi possível carregar os detalhes deste alerta.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarDetalhes();
  }, [id]);

  function formatarData(data: string | null) {
    if (!data) return "Não informado";

    return new Date(data).toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function nivelInfo(nivel: string) {
    switch (nivel) {
      case "attention":
        return {
          nome: "Atenção",
          tempo: "10 minutos",
          classe: "bg-amber-100 text-amber-700",
          borda: "border-amber-200",
        };
      case "alert":
        return {
          nome: "Alerta",
          tempo: "20 minutos",
          classe: "bg-orange-100 text-orange-700",
          borda: "border-orange-200",
        };
      case "critical":
        return {
          nome: "Crítico",
          tempo: "40 minutos",
          classe: "bg-red-100 text-red-700",
          borda: "border-red-200",
        };
      default:
        return {
          nome: nivel,
          tempo: "Não informado",
          classe: "bg-slate-100 text-slate-600",
          borda: "border-slate-200",
        };
    }
  }

  function formatarTempo(minutos: number | null) {
    if (minutos === null) return "Não calculado";

    const horas = Math.floor(minutos / 60);
    const restante = minutos % 60;

    if (horas > 0) {
      return `${horas}h ${restante}min`;
    }

    return `${restante} minutos`;
  }

  if (carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">
        Carregando detalhes do alerta...
      </div>
    );
  }

  if (erro || !dados) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 p-6">
        <p className="text-red-600">{erro || "Alerta não encontrado."}</p>
        <Link
          href="/alertas"
          className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white"
        >
          Voltar aos alertas
        </Link>
      </div>
    );
  }

  const nivel = nivelInfo(dados.alerta.alert_level);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col bg-[#142238] text-white md:flex">
        <div className="border-b border-white/10 px-7 py-7">
          <h1 className="text-2xl font-bold tracking-wide">
            MONITOR<span className="text-blue-400">+</span>
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Monitoramento operacional
          </p>
        </div>

        <nav className="flex-1 space-y-2 px-4 py-6">
          <Link
            href="/"
            className="block rounded-xl px-4 py-3 text-sm text-slate-300 hover:bg-white/10"
          >
            ◫ Dashboard
          </Link>

          <Link
            href="/conversas"
            className="block rounded-xl px-4 py-3 text-sm text-slate-300 hover:bg-white/10"
          >
            ▤ Conversas
          </Link>

          <Link
            href="/alertas"
            className="block rounded-xl bg-blue-500/20 px-4 py-3 text-sm font-semibold text-blue-300"
          >
            ◉ Gerenciamento de alertas
          </Link>
        </nav>

        <div className="border-t border-white/10 p-5">
          <p className="text-xs text-slate-400">Monitor Operacional</p>
          <p className="mt-1 text-sm text-slate-300">Central de controle</p>
        </div>
      </aside>

      <main className="min-h-screen md:ml-64">
        <header className="border-b border-slate-200 bg-white px-6 py-5 md:px-9">
          <Link
            href="/alertas"
            className="text-sm font-semibold text-blue-600 hover:text-blue-800"
          >
            ← Voltar ao gerenciamento de alertas
          </Link>

          <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-blue-600">
            Monitor Operacional
          </p>

          <h2 className="mt-1 text-2xl font-bold">
            Detalhamento do alerta
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Informações completas da ocorrência e da conversa.
          </p>
        </header>

        <div className="space-y-6 p-6 md:p-9">
          <section className={`rounded-2xl border ${nivel.borda} bg-white p-6 shadow-sm`}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">Motorista</p>
                <h3 className="mt-1 text-2xl font-bold">
                  {dados.motorista.name}
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Telefone: {dados.motorista.phone || "Não informado"}
                </p>
              </div>

              <span className={`rounded-full px-4 py-2 text-sm font-bold ${nivel.classe}`}>
                {nivel.nome} · {nivel.tempo}
              </span>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Tempo de espera</p>
              <p className="mt-3 text-2xl font-bold text-red-600">
                {formatarTempo(dados.tempo_espera_minutos)}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Status do alerta</p>
              <p className="mt-3 text-xl font-bold capitalize">
                {dados.alerta.status === "pending"
                  ? "Pendente"
                  : dados.alerta.status === "sent"
                    ? "Enviado"
                    : dados.alerta.status === "failed"
                      ? "Falha"
                      : dados.alerta.status}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Status da conversa</p>
              <p className="mt-3 text-xl font-bold capitalize">
                {dados.conversa.status === "pending"
                  ? "Pendente"
                  : dados.conversa.status === "answered"
                    ? "Respondida"
                    : dados.conversa.status === "closed"
                      ? "Encerrada"
                      : dados.conversa.status}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Canal</p>
              <p className="mt-3 text-xl font-bold uppercase">
                {dados.alerta.channel}
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold">Horários da ocorrência</h3>

            <div className="mt-5 grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Início da pendência
                </p>
                <p className="mt-2 font-semibold">
                  {formatarData(dados.alerta.pending_since)}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Última mensagem
                </p>
                <p className="mt-2 font-semibold">
                  {formatarData(dados.conversa.last_message_at)}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Envio do alerta
                </p>
                <p className="mt-2 font-semibold">
                  {formatarData(dados.alerta.sent_at)}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Identificação da conversa
                </p>
                <p className="mt-2 break-all text-xs font-medium text-slate-600">
                  {dados.conversa.id}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-6">
              <h3 className="text-lg font-bold">Histórico da conversa</h3>
              <p className="mt-1 text-sm text-slate-500">
                Mensagens registradas para esta conversa.
              </p>
            </div>

            <div className="space-y-4 p-6">
              {dados.mensagens.length === 0 && (
                <p className="py-8 text-center text-sm text-slate-400">
                  Nenhuma mensagem encontrada.
                </p>
              )}

              {dados.mensagens.map((mensagem) => {
                const recebida = mensagem.direction === "incoming";

                return (
                  <div
                    key={mensagem.id}
                    className={`flex ${recebida ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-4 sm:max-w-[70%] ${
                        recebida
                          ? "rounded-tl-sm bg-slate-100 text-slate-800"
                          : "rounded-tr-sm bg-blue-600 text-white"
                      }`}
                    >
                      <p className="mb-2 text-xs font-bold opacity-70">
                        {recebida ? "Motorista" : "Operação"}
                      </p>

                      <p className="whitespace-pre-wrap break-words text-sm">
                        {mensagem.body || `[${mensagem.message_type}]`}
                      </p>

                      <p className="mt-3 text-right text-[10px] opacity-60">
                        {formatarData(mensagem.message_timestamp)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <div className="flex flex-wrap justify-between gap-3">
            <Link
              href="/alertas"
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              ← Voltar aos alertas
            </Link>

            <Link
              href="/conversas"
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Abrir central de conversas →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
