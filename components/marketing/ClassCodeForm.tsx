"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";
import { Input } from "./Input";
import { Button } from "./Button";
import { siteLinks } from "@/lib/marketing/site-links";
import styles from "./ClassCodeForm.module.css";

export function ClassCodeForm({ className }: { className?: string }) {
  const [code, setCode] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    window.location.assign(`${siteLinks.classBase}${encodeURIComponent(trimmed)}`);
  };

  return (
    <form className={`${styles.form} ${className || ""}`} onSubmit={submit}>
      <label className={styles.label} htmlFor="class-code">
        Đã có mã lớp từ thầy cô?
      </label>
      <div className={styles.row}>
        <Input
          id="class-code"
          className={styles.input}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Nhập mã lớp"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
        />
        <Button type="submit" variant="outline" shape="pill" disabled={!code.trim()}>
          Vào lớp <ArrowRight />
        </Button>
      </div>
    </form>
  );
}
