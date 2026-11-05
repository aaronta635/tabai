/** Put this student's name where a letter says "con" or "bạn". */
export function addressAsStudent(text: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) return text;
  return text.replace(/(^|[^\p{L}])(con|bạn)(?=$|[^\p{L}])/giu, `$1${trimmed}`);
}
