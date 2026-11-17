import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://railan18farias-lang.github.io",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return response({ error: "Método não permitido." }, 405);

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  let secretKeys: Record<string, string> = {};
  try { secretKeys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}"); } catch { /* use compatible individual environment values below */ }
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SECRET_KEY") || secretKeys.default;
  if (!url || !anonKey || !serviceKey) return response({ error: "A configuração segura da função está incompleta." }, 500);

  const authorization = req.headers.get("Authorization") || "";
  const token = authorization.replace(/^Bearer\s+/i, "");
  if (!token) return response({ error: "Sessão necessária." }, 401);

  const callerClient = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: callerData, error: authError } = await callerClient.auth.getUser(token);
  if (authError || !callerData.user) return response({ error: "Sessão inválida ou expirada." }, 401);

  const adminDb = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: callerStaff } = await adminDb.from("site_staff").select("role").eq("user_id", callerData.user.id).maybeSingle();
  if (callerStaff?.role !== "admin") return response({ error: "Somente administradores podem gerenciar a equipe." }, 403);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return response({ error: "Requisição inválida." }, 400); }

  if (body.action === "list") {
    const { data: staff, error } = await adminDb.from("site_staff").select("user_id,role,created_at").order("created_at");
    if (error) return response({ error: "Não foi possível carregar os acessos." }, 500);
    const members = await Promise.all((staff || []).map(async (entry) => {
      const { data } = await adminDb.auth.admin.getUserById(entry.user_id);
      return { user_id: entry.user_id, role: entry.role, email: data.user?.email || "Conta sem e-mail" };
    }));
    return response({ members });
  }

  if (body.action === "invite") {
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const role = body.role;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !["admin", "developer"].includes(String(role))) {
      return response({ error: "Informe um e-mail válido e uma função permitida." }, 400);
    }
    let targetUser: { id: string } | null = null;
    for (let page = 1; page <= 20 && !targetUser; page++) {
      const { data, error } = await adminDb.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) return response({ error: "Não foi possível verificar as contas existentes." }, 500);
      targetUser = data.users.find((user) => user.email?.toLowerCase() === email) || null;
      if (data.users.length < 1000) break;
    }
    if (!targetUser) {
      const { data, error } = await adminDb.auth.admin.inviteUserByEmail(email, {
        redirectTo: "https://railan18farias-lang.github.io/Projeto-Viva-Santar-m/admin.html",
      });
      if (error || !data.user) return response({ error: error?.message || "Não foi possível enviar o convite." }, 400);
      targetUser = { id: data.user.id };
    }
    const { data: currentTarget } = await adminDb.from("site_staff").select("role").eq("user_id", targetUser.id).maybeSingle();
    if (currentTarget?.role === "admin" && role === "developer") {
      const { count, error } = await adminDb.from("site_staff").select("user_id", { count: "exact", head: true }).eq("role", "admin");
      if (error) return response({ error: "Não foi possível conferir os administradores." }, 500);
      if ((count || 0) <= 1) return response({ error: "Não é permitido rebaixar o último administrador." }, 409);
    }
    const { error } = await adminDb.from("site_staff").upsert({ user_id: targetUser.id, role });
    if (error) return response({ error: "Conta localizada, mas não foi possível atualizar a função." }, 500);
    return response({ success: true });
  }

  if (body.action === "remove") {
    const userId = typeof body.user_id === "string" ? body.user_id : "";
    const { data: target } = await adminDb.from("site_staff").select("role").eq("user_id", userId).maybeSingle();
    if (!target) return response({ error: "Acesso não encontrado." }, 404);
    if (target.role === "admin") {
      const { count, error } = await adminDb.from("site_staff").select("user_id", { count: "exact", head: true }).eq("role", "admin");
      if (error) return response({ error: "Não foi possível conferir os administradores." }, 500);
      if ((count || 0) <= 1) return response({ error: "Não é permitido remover o último administrador." }, 409);
    }
    const { error } = await adminDb.from("site_staff").delete().eq("user_id", userId);
    if (error) return response({ error: "Não foi possível remover o acesso." }, 500);
    return response({ success: true });
  }

  return response({ error: "Ação desconhecida." }, 400);
});
