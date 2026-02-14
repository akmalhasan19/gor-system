import "dotenv/config";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function getProjectRefFromTemp() {
  const refPath = resolve(process.cwd(), "supabase/.temp/project-ref");
  if (!existsSync(refPath)) return null;
  const ref = readFileSync(refPath, "utf8").trim();
  return ref || null;
}

async function main() {
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error(
      "SUPABASE_ACCESS_TOKEN is required. Create one in Supabase Dashboard > Account > Access Tokens."
    );
  }

  const projectRef =
    process.env.SUPABASE_PROJECT_REF || getProjectRefFromTemp();
  if (!projectRef) {
    throw new Error(
      "SUPABASE_PROJECT_REF is missing and supabase/.temp/project-ref was not found."
    );
  }

  const url = `https://api.supabase.com/v1/projects/${projectRef}/config/auth`;
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  const response = await fetch(url, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ password_hibp_enabled: true }),
  });

  if (!response.ok) {
    const text = await response.text();
    if (
      response.status === 402 &&
      text.includes("Pro Plans and up")
    ) {
      console.warn(
        "Cannot enable leaked password protection on current plan (requires Supabase Pro or higher)."
      );
      console.warn(
        "Security Advisor warning is expected on Free plan and cannot be removed via SQL or app code."
      );
      return;
    }
    throw new Error(`Failed to update auth config (${response.status}): ${text}`);
  }

  const result = await response.json();
  if (result?.password_hibp_enabled !== true) {
    throw new Error(
      "Auth config updated but password_hibp_enabled is not true in response."
    );
  }

  console.log(
    `Leaked password protection enabled for project ${projectRef}.`
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
