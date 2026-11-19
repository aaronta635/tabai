import styles from "./StepList.module.css";

interface StepListProps {
  items: { title: string; text?: string }[];
}

export const StepList = ({ items }: StepListProps) => (
  <ol className={styles.list}>
    {items.map((item, i) => (
      <li key={item.title} className={styles.item}>
        <span className={styles.num}>{String(i + 1).padStart(2, "0")}</span>
        <h3 className={styles.title}>{item.title}</h3>
        {item.text && <p className={styles.text}>{item.text}</p>}
      </li>
    ))}
  </ol>
);
