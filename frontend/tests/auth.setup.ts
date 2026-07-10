import { test as setup, expect } from "@playwright/test";
import { execSync } from "child_process";
import fs from "fs";

const authFile = "playwright/.auth/user.json";

setup("authenticate", async ({ page }) => {
  // Ensure the directory exists
  fs.mkdirSync("playwright/.auth", { recursive: true });

  const testEmail = "e2e_test@budgetsetu.local";
  const testPassword = "Password123!";
  
  // Register the user directly via API for speed
  const response = await page.request.post("/api/auth/register", {
    data: {
      fullName: "E2E Tester",
      email: testEmail,
      password: testPassword
    }
  });
  
  // Mark email as verified directly in the database (since this is a test env)
  try {
    execSync("docker exec budgetsetu_postgres psql -U budgetsetu_user -d budgetsetu -c \"UPDATE users SET email_verified = true WHERE email = 'e2e_test@budgetsetu.local';\"");
  } catch (err) {
    console.error("Failed to set email_verified", err);
  }

  // Now perform the UI login
  await page.goto("/login");
  await page.getByPlaceholder("arjun@example.com").fill(testEmail);
  await page.getByPlaceholder("••••••••").fill(testPassword);
  await page.getByRole("button", { name: "Sign In", exact: true }).click();

  // Wait until we reach the dashboard
  await expect(page).toHaveURL(/.*\/dashboard/);
  
  // Verify Dashboard text is visible to ensure we are logged in fully
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

  // End of authentication steps.
  // Save the browser state (cookies, localStorage) to the authFile
  await page.context().storageState({ path: authFile });
});
