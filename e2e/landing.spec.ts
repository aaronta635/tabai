import { expect, test } from "@playwright/test";

test("landing opens in Vietnamese and keeps an empty code on the page", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/vi$/);
  await expect(page.getByLabel("PARA").first()).toBeVisible();
  await expect(page.getByRole("button", { name: /^(VI|EN)$/ })).toHaveCount(0);

  await expect(page.getByRole("heading", { level: 1 })).toContainText("Thấy mình tiến bộ.");
  await expect(page.getByRole("navigation", { name: "Điều hướng chính" }).getByRole("link")).toHaveCount(3);

  const code = page.getByLabel("Mã lớp");
  await expect(code).toBeVisible();
  await expect(page.getByRole("button", { name: "Vào lớp" })).toBeDisabled();
  await expect(page).toHaveURL(/\/vi$/);
});

test("the vietnamese landing does not scroll sideways on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/vi");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
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
