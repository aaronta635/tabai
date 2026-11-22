import { Fragment } from "react";

/** Server-rendered, selectable text; GSAP only transforms the word wrappers. */
export function EditorialMotionText({ text }: { text: string }) {
  const words = text.split(" ");
  return words.map((word, index) => (
    <Fragment key={`${word}-${index}`}>
      <span className="ed-motion-word">{word}</span>
      {index < words.length - 1 ? " " : ""}
    </Fragment>
  ));
}
