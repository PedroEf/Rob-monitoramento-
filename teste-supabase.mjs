
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

try {
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log("Testando acesso à tabela drivers...");

  const { data, error } = await supabase
    .from("drivers")
    .select("id")
    .limit(1);

  if (error) {
    console.log("Falha na consulta ao Supabase.");
    console.log("Código:", error.code);
    console.log("Mensagem:", error.message);
    process.exit(1);
  }

  console.log("CONEXÃO COM SUPABASE REALIZADA COM SUCESSO!");
  console.log("Tabela drivers acessível:", Array.isArray(data));

} catch (error) {
  console.log("Não foi possível estabelecer a conexão.");
  console.log("Tipo:", error.name);
  console.log("Mensagem:", error.message);
  process.exit(1);
}
