import { createClient } from "@supabase/supabase-js";
const url = process.env.SUPABASE_URL || "https://nleqkimtokqkifwxdenx.supabase.co";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const sb = createClient(url, key);

async function ensure(email, password, fullName, role) {
  const { data: list } = await sb.auth.admin.listUsers({ page: 1, perPage: 200 });
  let user = list.users.find(u => (u.email||"").toLowerCase() === email.toLowerCase());
  if (!user) {
    const { data, error } = await sb.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: fullName } });
    if (error) throw error;
    user = data.user;
    console.log("Created", email, user.id);
  } else {
    await sb.auth.admin.updateUserById(user.id, { password, email_confirm: true });
    console.log("Updated", email, user.id);
  }
  await sb.from("user_roles").upsert({ user_id: user.id, role }, { onConflict: "user_id,role" });
  // Ensure single role row matches
  await sb.from("user_roles").update({ role }).eq("user_id", user.id);
  return user.id;
}

const studentId = await ensure("aluno.teste@dynamic.app", "Teste@2026", "Aluno Teste", "user");
const adminId = await ensure("admin.teste@dynamic.app", "Admin@2026", "Admin Teste", "admin");
console.log({ studentId, adminId });
