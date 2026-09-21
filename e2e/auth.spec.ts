import { expect, test } from "@playwright/test";

test("auth asks which role first", async ({ page }) => {
  await page.goto("/auth");
  await expect(page.getByRole("heading", { name: /Bạn dùng howl0 thế nào\?|How do you use howl0\?/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Tôi dạy lớp|I run the class/ })).toBeVisible();
});

test("tutor auth shows the sign-in form", async ({ page }) => {
  await page.goto("/auth?role=tutor");
  await expect(page.getByRole("heading", { name: /Thầy đăng nhập|Teacher sign in/ })).toBeVisible();
  await expect(page.getByLabel(/Email/i)).toBeVisible();
  await expect(page.getByLabel(/Mật khẩu|Password/i)).toBeVisible();
});

test("student auth shows the sign-in form", async ({ page }) => {
  await page.goto("/auth?role=student");
  await expect(page.getByRole("heading", { name: /Học viên đăng nhập|Student sign in/ })).toBeVisible();
  await expect(page.getByLabel(/Email/i)).toBeVisible();
});

test("student auth does not open a teacher session from a tutor email bounce", async ({ page }) => {
  await page.goto("/auth?role=student&error=role_mismatch");
  await expect(page.getByText(/Email này là tài khoản giáo viên|This email is a teacher account/)).toBeVisible();
  await expect(page).toHaveURL(/role=student/);
});

test("logged-out studio routes send the teacher to auth", async ({ page }) => {
  await page.goto("/teacher");
  await expect(page).toHaveURL(/\/auth/);
});
