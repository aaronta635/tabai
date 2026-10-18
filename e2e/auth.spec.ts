import { expect, test } from "@playwright/test";

test("login is its own page", async ({ page }) => {
  await page.goto("/login/student");
  await expect(page.getByRole("heading", { name: /Chào lại|Welcome back/ })).toBeVisible();
  await expect(page.getByLabel(/Email/i)).toBeVisible();
  await expect(page.getByRole("link", { name: /Tạo tài khoản|Create an account/ })).toHaveAttribute(
    "href",
    "/signup/student",
  );
});

test("signup is its own page", async ({ page }) => {
  await page.goto("/signup/teacher");
  await expect(page.getByRole("heading", { name: /Tạo phòng tập|Create your practice room/ })).toBeVisible();
  await expect(page.getByLabel(/Mật khẩu|Password/i)).toBeVisible();
  await expect(page.getByRole("link", { name: /Đăng nhập|Sign in/ })).toHaveAttribute("href", "/login/teacher");
});

test("old auth links open login", async ({ page }) => {
  await page.goto("/auth?role=student&error=role_mismatch");
  await expect(page).toHaveURL(/\/login\/student\?error=role_mismatch/);
  await expect(page.getByText(/Email này là tài khoản giáo viên|This email is a teacher account/)).toBeVisible();
});

test("logged-out studio routes send the teacher to login", async ({ page }) => {
  await page.goto("/teacher");
  await expect(page).toHaveURL(/\/login\/teacher/);
});
