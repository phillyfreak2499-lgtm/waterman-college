import { usernameToEmail } from "@/lib/accounts";
import { chancellorProvisioningConfig, assertChancellorSetupToken } from "@/lib/chancellor-config.server";
import { getSql } from "@/lib/db";
import { writeAudit } from "@/lib/rbac";

/** One-time, token-protected Chancellor provisioning. Never exposed as a server function. */
export async function provisionChancellor(setupToken: string) {
  assertChancellorSetupToken(setupToken);
  const { username, password } = chancellorProvisioningConfig();
  const sql = await getSql();
  const email = usernameToEmail(username);
  const existingChancellor = await sql<{ user_id: string }>`
    select user_id from user_profiles where rbac_role = 'super-admin' limit 1
  `;
  if (existingChancellor.length) throw new Error("The Chancellor is already provisioned.");
  const existingIdentity = await sql<{ id: string }>`
    select u.id
    from "user" u
    left join user_profiles p on p.user_id = u.id
    where lower(u.email) = ${email} or lower(p.username) = ${username}
    limit 1
  `;
  if (existingIdentity.length) {
    throw new Error("The configured Chancellor username is already in use.");
  }

  const { auth } = await import("@/lib/auth/server");
  const context = await auth.$context;
  const hash = await context.password.hash(password);
  const user = await context.internalAdapter.createUser({
    email,
    name: "Chancellor",
    emailVerified: true,
  });
  if (!user?.id) throw new Error("Could not create the Chancellor account.");
  await context.internalAdapter.linkAccount({
    userId: user.id,
    providerId: "credential",
    accountId: user.id,
    password: hash,
  });
  await sql`
    insert into user_profiles (
      user_id, access_role, username, first_name, last_name, title,
      account_status, rbac_role, must_change_password, created_at
    ) values (
      ${user.id}, 'admin', ${username}, 'Chancellor', 'Office', 'Chancellor',
      'approved', 'super-admin', true, now()
    )
  `;
  await writeAudit(user.id, "Chancellor", "chancellor.provisioned", "Initial account provisioned");
  return user.id;
}
