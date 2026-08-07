import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const inviter = userData.user;
    const body = await req.json();
    const { email, role, companyId } = body;

    if (!email || !role || !companyId) {
      return new Response(JSON.stringify({ error: "Dados incompletos" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify inviter is a gestor or admin of the company
    const { data: membership } = await supabase
      .from("company_members")
      .select("role, is_platform_admin")
      .eq("user_id", inviter.id)
      .eq("company_id", companyId)
      .maybeSingle();

    if (!membership || (membership.role !== "admin" && membership.role !== "gestor" && !membership.is_platform_admin)) {
      return new Response(JSON.stringify({ error: "Sem permissão para convidar" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Gestor cannot invite admins
    if (membership.role === "gestor" && role === "admin") {
      return new Response(JSON.stringify({ error: "Gestores não podem convidar administradores" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user already exists
    const { data: existingMembers } = await supabase
      .from("company_members")
      .select("id")
      .eq("email", email)
      .eq("company_id", companyId)
      .maybeSingle();

    if (existingMembers) {
      return new Response(JSON.stringify({ error: "Usuário já pertence a esta empresa" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check max users
    const { data: company } = await supabase
      .from("companies")
      .select("max_users, name")
      .eq("id", companyId)
      .maybeSingle();

    if (company) {
      const { count } = await supabase
        .from("company_members")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId)
        .eq("active", true);

      if (count >= company.max_users) {
        return new Response(JSON.stringify({ error: `Limite de ${company.max_users} usuários atingido` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Create invite record
    const { data: invite, error: inviteErr } = await supabase
      .from("invites")
      .insert({
        company_id: companyId,
        email,
        role,
        invited_by: inviter.id,
      })
      .select()
      .single();

    if (inviteErr) {
      return new Response(JSON.stringify({ error: "Erro ao criar convite: " + inviteErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate invite link
    const siteUrl = Deno.env.get("SITE_URL") || "https://jhqfjalmfzhmdpcyziyv.supabase.co";
    const inviteLink = `${siteUrl}/#/convite/${invite.token}`;

    // Try to send email (if email service is configured)
    // For now, we just return the invite link
    return new Response(JSON.stringify({
      success: true,
      inviteLink,
      message: `Convite criado para ${email}`,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
