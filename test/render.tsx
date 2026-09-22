import { render, type RenderOptions } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import en from "@/messages/en.json";

type Namespace = keyof typeof en;

export function renderWithIntl(
  ui: React.ReactElement,
  namespaces: Namespace[] = ["teacher"],
  options?: Omit<RenderOptions, "wrapper">,
) {
  const messages = Object.fromEntries(namespaces.map((ns) => [ns, en[ns]]));
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>,
    options,
  );
}
