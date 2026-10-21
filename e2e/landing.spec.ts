import { expect, test } from "@playwright/test";

test("landing opens in Vietnamese and keeps an empty code on the page", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/vi$/);
  await expect(page.getByLabel("PARA").first()).toBeVisible();
  await expect(page.getByRole("button", { name: /^(VI|EN)$/ })).toHaveCount(0);

  const code = page.getByLabel("Mã lớp");
  await expect(code).toBeVisible();
  await page.getByRole("button", { name: "Vào lớp" }).click();
  await expect(page).toHaveURL(/\/vi$/);
});

test("the english address stays in english", async ({ page }) => {
  await page.goto("/en");
  await expect(page).toHaveURL(/\/en$/);
  await expect(page.getByLabel("Class code")).toBeVisible();
  await expect(page.getByRole("button", { name: /^(VI|EN)$/ })).toHaveCount(0);
});

test("a class code opens the student join path", async ({ page }) => {
  await page.goto("/vi");
  await page.getByLabel("Mã lớp").fill("KMPRT");
  await page.getByRole("button", { name: "Vào lớp" }).click();
  await expect(page).toHaveURL(/\/vi\/join\/kmprt$/);
});
