
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Alerta = {
  id: string;
  conversation_id: string | null;
  alert_level: string;
  status: string;
  channel: string;
  pending_since: string | null;
  sent_at: string | null;
  driver_name: string;
  driver_phone: string;
};

type Resposta = {
  success: boolean;
  total: number;
  resumo: {
    pending: number;
    sent: number;
    failed: number;
  };
  alertas: Alerta[];
};

export default function AlertasPage() {
  const [dados, setDados] = useState<Resposta | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroNivel, setFiltroNivel] = useState("todos");

  async function carregarAlertas() {
    try {
      const response = await fetch("/api/alertas", {
        cache: "no-store",
      });

      const resultado = await response.json();

      if (!response.ok || !resultado.success) {
        throw new Error("Não foi possível carregar os alertas.");
      }

      setDados(resultado);
      setErro("");
    } catch (error) {
      console.error("Erro ao buscar alertas:", error);
      setErro("Não foi possível carregar os alertas.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarAlertas();

    const intervalo = setInterval(carregarAlertas, 30000);

    return () => clearInterval(intervalo);
  }, []);

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
          classe: "bg-amber-100 text-amber-700",
        };
      case "alert":
        return {
          nome: "Alerta",
          classe: "bg-orange-100 text-orange-700",
        };
      case "critical":
        return {
          nome: "Crítico",
          classe: "bg-red-100 text-red-700",
        };
      default:
        return {
          nome: nivel,
          classe: "bg-slate-100 text-slate-600",
        };
    }
  }

  function statusInfo(status: string) {
    switch (status) {
      case "pending":
        return {
          nome: "Pendente",
          classe: "bg-amber-100 text-amber-700",
        };
      case "sent":
        return {
          nome: "Enviado",
          classe: "bg-green-100 text-green-700",
        };
      case "failed":
        return {
          nome: "Falha",
          classe: "bg-red-100 text-red-700",
        };
      default:
        return {
          nome: status,
          classe: "bg-slate-100 text-slate-600",
        };
    }
  }

  const alertasFiltrados = (dados?.alertas ?? []).filter((alerta) => {
    const termo = busca.toLowerCase();

    const correspondeBusca =
      alerta.driver_name.toLowerCase().includes(termo) ||
      alerta.driver_phone.includes(termo);

    const correspondeStatus =
      filtroStatus === "todos" || alerta.status === filtroStatus;

    const correspondeNivel =
      filtroNivel === "todos" || alerta.alert_level === filtroNivel;

    return correspondeBusca && correspondeStatus && correspondeNivel;
  });

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
        <header className="border-b border-slate-200 bg-white px-6 py-6 md:px-9">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
            Monitor Operacional
          </p>
          <h2 className="mt-1 text-2xl font-bold">
            Gerenciamento de alertas
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Acompanhe as ocorrências e o tempo de espera dos motoristas.
          </p>
        </header>

        <div className="space-y-6 p-6 md:p-9">
          {erro && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {erro}
              <button
                onClick={carregarAlertas}
                className="ml-3 font-semibold underline"
              >
                Tentar novamente
              </button>
            </div>
          )}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Total de alertas</p>
              <p className="mt-3 text-3xl font-bold">
                {dados?.total ?? 0}
              </p>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Pendentes</p>
              <p className="mt-3 text-3xl font-bold text-amber-600">
                {dados?.resumo.pending ?? 0}
              </p>
            </div>

            <div className="rounded-2xl border border-green-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Enviados</p>
              <p className="mt-3 text-3xl font-bold text-green-600">
                {dados?.resumo.sent ?? 0}
              </p>
            </div>

            <div className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Falhas</p>
              <p className="mt-3 text-3xl font-bold text-red-600">
                {dados?.resumo.failed ?? 0}
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h3 className="text-lg font-bold">Filtros de alertas</h3>
              <p className="mt-1 text-sm text-slate-500">
                Pesquise por motorista, telefone, status ou nível.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar motorista ou telefone..."
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />

              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="todos">Todos os status</option>
                <option value="pending">Pendente</option>
                <option value="sent">Enviado</option>
                <option value="failed">Falha</option>
              </select>

              <select
                value={filtroNivel}
                onChange={(e) => setFiltroNivel(e.target.value)}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="todos">Todos os níveis</option>
                <option value="attention">Atenção</option>
                <option value="alert">Alerta</option>
                <option value="critical">Crítico</option>
              </select>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-6">
              <div>
                <h3 className="text-lg font-bold">Histórico de alertas</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {alertasFiltrados.length} ocorrência(s) encontrada(s).
                </p>
              </div>

              <button
                onClick={carregarAlertas}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Atualizar agora
              </button>
            </div>

            {carregando ? (
              <div className="p-10 text-center text-sm text-slate-500">
                Carregando alertas...
              </div>
            ) : alertasFiltrados.length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-500">
                Nenhum alerta encontrado com esses filtros.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-5 py-4">Motorista</th>
                      <th className="px-5 py-4">Nível</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4">Canal</th>
                      <th className="px-5 py-4">Início da pendência</th>
                      <th className="px-5 py-4">Detalhes</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {alertasFiltrados.map((alerta) => {
                      const nivel = nivelInfo(alerta.alert_level);
                      const status = statusInfo(alerta.status);

                      return (
                        <tr key={alerta.id} className="hover:bg-slate-50">
                          <td className="px-5 py-4">
                            <p className="font-semibold text-slate-800">
                              {alerta.driver_name}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {alerta.driver_phone || "Telefone não informado"}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <span className={`rounded-full px-3 py-1 text-xs font-bold ${nivel.classe}`}>
                              {nivel.nome}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <span className={`rounded-full px-3 py-1 text-xs font-bold ${status.classe}`}>
                              {status.nome}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-slate-600">
                            {alerta.channel}
                          </td>

                          <td className="px-5 py-4 text-slate-600">
                            {formatarData(alerta.pending_since)}
                          </td>

                          <td className="px-5 py-4">
                            <Link
                              href={`/alertas/${alerta.id}`}
                              className="font-semibold text-blue-600 hover:text-blue-800"
                            >
                              Ver detalhes →
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <p className="text-center text-xs text-slate-400">
            Atualização automática a cada 30 segundos.
          </p>
        </div>
      </main>
    </div>
  );
}
