import { content, type Locale } from "@/lib/site/content";
import { ParaIcon } from "@/components/site/ParaIcon";
/** No backend is connected. Disabled controls cannot imply a saved submission. */
export function WaitlistForm({ locale }: { locale: Locale }) {
  const page = content[locale].waitlist;
  return (
    <form className="waitlist-form" aria-describedby="waitlist-unavailable">
      <p className="form-note" id="waitlist-unavailable">
        <ParaIcon name="alert" />
        {page.unavailable}
      </p>
      <div className="site-field">
        <label htmlFor="waitlist-name">
          {page.nameLabel} <span aria-hidden="true">*</span>
        </label>
        <input
          id="waitlist-name"
          name="name"
          type="text"
          autoComplete="name"
          required
          disabled
        />
      </div>
      <div className="site-field">
        <label htmlFor="waitlist-email">
          {page.emailLabel} <span aria-hidden="true">*</span>
        </label>
        <input
          id="waitlist-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled
        />
      </div>
      <button
        className="button button-primary form-submit"
        disabled
        type="submit"
      >
        {page.button}
      </button>
      <p className="consent-note">{page.consent}</p>
    </form>
  );
}
