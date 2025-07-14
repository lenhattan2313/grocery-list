import { signOut } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function SignOutPage() {
  await signOut({ redirectTo: "/signin" });
  redirect("/signin");
}
