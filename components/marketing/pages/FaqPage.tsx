import { PageHead } from "../PageHead";
import { Section } from "../Section";
import { TryCta } from "../TryCta";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "../Accordion";
import { faqItems } from "@/lib/marketing/faq-items";
import styles from "./FaqPage.module.css";

export function FaqPage() {
  return (
  <>
    <PageHead
      eyebrow="Câu hỏi thường gặp"
      title="Một vài điều cần biết về PARA."
      lead="PARA vẫn đang được thử và hoàn thiện. Một số phần có thể thay đổi."
    />

    <Section>
      <div className={styles.faq}>
        <Accordion>
          {faqItems.map((f, i) => (
            <AccordionItem key={f.q} value={`item-${i}`}>
              <AccordionTrigger>{f.q}</AccordionTrigger>
              <AccordionContent>{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Section>

    <TryCta />
  </>
  );
}
