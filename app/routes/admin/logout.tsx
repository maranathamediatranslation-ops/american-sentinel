import { redirect } from "react-router";

import { signOut } from "~/lib/admin";

export async function clientAction() {
  await signOut();
  throw redirect("/admin/login");
}

export function clientLoader() {
  throw redirect("/admin");
}
