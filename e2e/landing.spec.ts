import { expect, test } from "@playwright/test";

test("landing shows the studio entry and keeps an empty code on the page", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByLabel("howl0").first()).toBeVisible();

  const code = page.getByLabel(/Mã lớp|Class code/);
  await expect(code).toBeVisible();
  await page.getByRole("button", { name: /^(Vào lớp|Join)$/ }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("a class code opens the student join path", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel(/Mã lớp|Class code/).fill("SONG1");
  await page.getByRole("button", { name: /^(Vào lớp|Join)$/ }).click();
  await expect(page).toHaveURL(/\/c\/song1$/);
});
