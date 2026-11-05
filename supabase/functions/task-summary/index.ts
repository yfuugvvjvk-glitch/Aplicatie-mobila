import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "GET") {
    return response({ error: "Method not allowed" }, 405);
  }

  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return response({ error: "Authentication required" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const publishableKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !publishableKey) {
    return response({ error: "Server configuration is incomplete" }, 500);
  }

  const client = createClient(supabaseUrl, publishableKey, {
    global: { headers: { Authorization: authorization } },
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: userResult, error: userError } = await client.auth.getUser();
  if (userError || !userResult.user) {
    return response({ error: "Invalid or expired session" }, 401);
  }

  const [tasksResult, categoriesResult] = await Promise.all([
    client.from("tasks").select("completed, due_date, priority"),
    client.from("categories").select("id"),
  ]);
  if (tasksResult.error || categoriesResult.error) {
    console.error("Task summary query failed", {
      userId: userResult.user.id,
      tasksError: tasksResult.error?.message,
      categoriesError: categoriesResult.error?.message,
    });
    return response({ error: "Could not load task summary" }, 502);
  }

  const tasks = tasksResult.data ?? [];
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const summary = {
    total: tasks.length,
    completed: tasks.filter((task) => task.completed).length,
    active: tasks.filter((task) => !task.completed).length,
    overdue: tasks.filter((task) => {
      if (task.completed || !task.due_date) return false;
      const dueDate = new Date(task.due_date);
      dueDate.setUTCHours(0, 0, 0, 0);
      return dueDate < today;
    }).length,
    highPriorityActive: tasks.filter(
      (task) => !task.completed && task.priority === "high",
    ).length,
    categories: categoriesResult.data?.length ?? 0,
    generatedAt: new Date().toISOString(),
  };

  return response(summary);
});
