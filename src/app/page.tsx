
"use client";

import { useEffect, useMemo, useState } from "react";


type Pendencia = {
  conversation_id: string;
  driver_id: string;
  driver_name: string | null;
  driver_phone: string;
  pending_since: string;
  last_message_at: string;
  wait_minutes: number;
  alert_level: "normal" | "attention" | "alert" | "critical";
  last_message_body: string | null;
  last_message_direction: "incoming" | "outgoing" | null;
};


const menu = [
  ["▦", "Visão geral"],
  ["☏", "Conversas"],
  ["◷", "Pendências"],
  ["♙", "Motoristas"],
  ["▤", "Relatórios"],
  ["⚙", "Configurações"],
];

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

function statusLabel(status: Pendencia["alert_level"]) {
  const labels = {
    normal: "Normal",
    attention: "Atenção",
    alert: "Alerta",
    critical: "Crítico",
  };

  return labels[status] ?? "Normal";
}

function statusStyle(status: Pendencia["alert_level"]) {
  const styles = {
    normal: "bg-emerald-50 text-emerald-700",
    attention: "bg-amber-50 text-amber-700",
    alert: "bg-orange-50 text-orange-700",
    critical: "bg-red-50 text-red-600",
  };

  return styles[status] ?? styles.normal;
}

export default function Home() {
  const [active, setActive] = useState("Visão geral");
  const [search, setSearch] = useState("");
  const [pendencias, setPendencias] = useState<Pendencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdate, setLastUpdate] = useState("");

  useEffect(() => {
    let mounted = true;

    async function carregarPendencias() {
      try {
        const response = await fetch("/api/pendencias", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Erro HTTP ${response.status}`);
        }

        const result = await response.json();

        if (!result.success || !Array.isArray(result.pendencias)) {
          throw new Error("Resposta inválida da API.");
        }

        if (mounted) {
          setPendencias(result.pendencias);
          setError("");
          setLastUpdate(
            new Date().toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })
          );
        }
      } catch (err) {
        console.error("Erro ao carregar pendências:", err);

        if (mounted) {
          setError("Não foi possível carregar os dados do Supabase.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    carregarPendencias();

    const interval = setInterval(carregarPendencias, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const filtered = useMemo(() => {
    return pendencias.filter((p) => {
      const name = (p.driver_name ?? "").toLowerCase();
      const phone = p.driver_phone ?? "";

      return (
        name.includes(search.toLowerCase()) ||
        phone.includes(search)
      );
    });
  }, [pendencias, search]);

  const totalPendentes = pendencias.length;

  const emAtencao = pendencias.filter(
    (p) => p.alert_level === "attention"
  ).length;

  const emAlerta = pendencias.filter(
    (p) => p.alert_level === "alert"
  ).length;

  const criticas = pendencias.filter(
    (p) => p.alert_level === "critical"
  ).length;

  const tempoMedio = totalPendentes
    ? Math.round(
        pendencias.reduce((total, p) => total + p.wait_minutes, 0) /
          totalPendentes
      )
    : 0;

  const maioresTempos = [...pendencias]
    .sort((a, b) => b.wait_minutes - a.wait_minutes)
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-[#f4f6fa] text-[#202b3c] md:flex">
      <aside className="w-full bg-[#142238] p-5 text-white md:min-h-screen md:w-[245px] md:shrink-0">
        <div className="mb-10 px-2 text-xl font-bold tracking-wide">
          MONITOR<span className="text-blue-400">+</span>
          <p className="mt-1 text-xs font-normal text-slate-400">
            GESTÃO OPERACIONAL
          </p>
        </div>

        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[2px] text-slate-500">
          Menu principal
        </p>

        <nav className="flex flex-wrap gap-2 md:block">
          {menu.map(([icon, label]) => (
            <button
              key={label}
              onClick={() => {
  if (label === "Conversas") {
    window.location.href = "/conversas";
} else if (
  label === "Alertas" ||
  label === "Gerenciamento de alertas" ||
  label === "Pendências"
) {
    window.location.href = "/alertas";
  } else {
    setActive(label);
  }
}}
              className={`mb-2 flex items-center gap-3 rounded-lg px-4 py-3 text-left text-sm transition ${
                active === label
                  ? "bg-[#254365] text-white"
                  : "text-slate-300 hover:bg-[#20334c]"
              }`}
            >
              <span className="text-lg">{icon}</span>
              {label}
            </button>
          ))}
        </nav>

        <div className="mt-10 hidden rounded-xl border border-slate-700 p-4 md:block">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <span
              className={`h-2 w-2 rounded-full ${
                error ? "bg-red-400" : "bg-emerald-400"
              }`}
            />
            {error ? "Falha na conexão" : "Banco conectado"}
          </div>
          <p className="text-xs leading-5 text-slate-400">
            Dados consultados diretamente no Supabase.
          </p>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-5 md:p-8">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-1 text-sm text-slate-500">
              Monitoramento / {active}
            </p>
            <h1 className="text-2xl font-bold">{active}</h1>
            <p className="mt-1 text-sm text-slate-500">
              Acompanhamento das conversas e respostas dos motoristas
            </p>
          </div>

          <div className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">
            ● Dados do Supabase
          </div>
        </header>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Conversas pendentes",
              value: totalPendentes,
              note: "Aguardando resposta",
              color: "text-slate-800",
            },
            {
              label: "Em atenção",
              value: emAtencao,
              note: "Entre 10 e 19 minutos",
              color: "text-amber-600",
            },
            {
              label: "Em alerta",
              value: emAlerta,
              note: "Entre 20 e 39 minutos",
              color: "text-orange-600",
            },
            {
              label: "Situação crítica",
              value: criticas,
              note: "40 minutos ou mais",
              color: "text-red-600",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <p className="text-sm text-slate-500">{item.label}</p>
              <p className={`my-3 text-3xl font-bold ${item.color}`}>
                {loading ? "—" : item.value}
              </p>
              <p className="text-xs text-slate-400">{item.note}</p>
            </div>
          ))}
        </section>

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Tempo médio de espera
            </p>
            <p className="my-3 text-3xl font-bold text-blue-700">
              {loading ? "—" : `${tempoMedio} min`}
            </p>
            <p className="text-xs text-slate-400">
              Considerando as conversas pendentes
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Última atualização</p>
            <p className="my-3 text-2xl font-bold text-slate-800">
              {lastUpdate || "Aguardando..."}
            </p>
            <p className="text-xs text-slate-400">
              Atualização automática a cada 30 segundos
            </p>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.6fr_1fr]">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
              <div>
                <h2 className="font-bold">
                  Conversas aguardando resposta
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  Pendências consultadas em tempo real pelo banco
                </p>
              </div>

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar motorista..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 sm:w-52"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500">
                  <tr>
                    <th className="px-5 py-4 font-medium">MOTORISTA</th>
                    <th className="px-5 py-4 font-medium">
                      ÚLTIMA MENSAGEM
                    </th>
                    <th className="px-5 py-4 font-medium">ESPERA</th>
                    <th className="px-5 py-4 font-medium">STATUS</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-400">
                        Carregando pendências...
                      </td>
                    </tr>
                  ) : filtered.map((p) => (
                    <tr
                      key={p.conversation_id}
                      className="border-t border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold">
                          {p.driver_name || "Motorista sem nome"}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {formatPhone(p.driver_phone)}
                        </p>
                      </td>

                      
<td className="px-5 py-4 text-slate-600">
  <div className="max-w-[260px]">
    <p className="truncate" title={p.last_message_body || ""}>
      {p.last_message_body || "Mensagem sem texto"}
    </p>

    <p className="mt-1 text-[11px] text-slate-400">
      {p.last_message_direction === "incoming"
        ? "Recebida do motorista"
        : p.last_message_direction === "outgoing"
        ? "Enviada pela equipe"
        : "Tipo de mensagem não identificado"}
    </p>
  </div>
</td>


                      <td className="px-5 py-4 font-semibold">
                        {p.wait_minutes} min
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(
                            p.alert_level
                          )}`}
                        >
                          {statusLabel(p.alert_level)}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {!loading && filtered.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="p-8 text-center text-slate-400"
                      >
                        {search
                          ? "Nenhum motorista encontrado."
                          : "Nenhuma conversa pendente no momento."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-bold">Maiores tempos de espera</h2>
            <p className="mb-3 mt-1 text-xs text-slate-400">
              Motoristas com pendências mais antigas
            </p>

            {loading ? (
              <p className="py-6 text-sm text-slate-400">
                Carregando...
              </p>
            ) : maioresTempos.length === 0 ? (
              <p className="py-6 text-sm text-slate-400">
                Nenhuma pendência registrada.
              </p>
            ) : (
              maioresTempos.map((p, i) => (
                <div
                  key={p.conversation_id}
                  className="flex items-center justify-between gap-3 border-b border-slate-100 py-4 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">
                        {p.driver_name || "Motorista sem nome"}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Aguardando retorno
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-sm font-bold ${
                      p.alert_level === "critical"
                        ? "text-red-600"
                        : p.alert_level === "alert"
                        ? "text-orange-600"
                        : p.alert_level === "attention"
                        ? "text-amber-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {p.wait_minutes} min
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        <p className="mt-6 text-center text-xs text-slate-400">
          Monitor Operacional • Dados consultados no Supabase
        </p>
      </main>
    </div>
  );
}
