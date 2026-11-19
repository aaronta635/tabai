"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { PrimaryButton } from "./PrimaryButton";
import { marketingPath, siteLinks } from "@/lib/marketing/site-links";
import styles from "./SiteShell.module.css";

const LINKS = [
  { to: "/product", label: "Sản phẩm" },
  { to: "/how-it-works", label: "Cách hoạt động" },
  { to: "/faq", label: "Hỏi đáp" },
] as const;

export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isActive = (to: string) => pathname === marketingPath(to) || pathname.startsWith(`${marketingPath(to)}/`);

  return (
    <>
      <a className={styles.skip} href="#main">
        Bỏ qua để đến nội dung chính
      </a>

      <header className={styles.nav}>
        <div className={styles.navInner}>
          <Link href={marketingPath("/")} className={styles.logo} aria-label="PARA — trang chủ">
            <img src={siteLinks.logo} alt="PARA" height={28} />
          </Link>

          <nav className={styles.links} aria-label="Điều hướng chính">
            {LINKS.map((link) => (
              <Link
                key={link.to}
                href={marketingPath(link.to)}
                className={`${styles.link} ${isActive(link.to) ? styles.active : ""}`}
                aria-current={isActive(link.to) ? "page" : undefined}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className={styles.right}>
            <PrimaryButton href={siteLinks.signup}>Dùng thử miễn phí</PrimaryButton>
            <button
              type="button"
              className={styles.menuBtn}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Đóng trình đơn" : "Mở trình đơn"}
              onClick={() => setOpen((value) => !value)}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {open && (
          <nav id="mobile-menu" className={styles.mobile} aria-label="Điều hướng chính">
            {LINKS.map((link) => (
              <Link key={link.to} href={marketingPath(link.to)} className={styles.mobileLink}>
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <main id="main" className={styles.main}>
        {children}
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <img src={siteLinks.logo} alt="PARA" height={24} />
            <p>Góp ý để sửa, không phải để chấm một lần thu.</p>
          </div>
          <nav className={styles.footerLinks} aria-label="Chân trang">
            <a href={siteLinks.mail}>Liên hệ</a>
            <Link href={siteLinks.privacy}>Quyền riêng tư</Link>
            <Link href={siteLinks.terms}>Điều khoản</Link>
            <Link href={siteLinks.dataDeletion}>Xóa dữ liệu</Link>
          </nav>
        </div>
        <p className={styles.copy}>© 2026 PARA</p>
      </footer>
    </>
  );
}
