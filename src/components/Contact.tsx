
import { getSupabaseClient } from '@/lib/supabase';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import {
  AlertCircle,
  Check,
  Copy,
  Loader2,
  MessageCircle,
  Send,
} from 'lucide-react';
import { websiteTypes, type WebsiteType } from '@/config';
import { PREFILL_EVENT } from '@/lib/contactBus';

type FormData = {
  name: string;
  businessName: string;
  phone: string;
  email: string;
  websiteType: WebsiteType | '';
  message: string;
  consent: boolean;
  company_website: string;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

const initialForm: FormData = {
  name: '',
  businessName: '',
  phone: '',
  email: '',
  websiteType: '',
  message: '',
  consent: false,
  company_website: '',
};

const inputClass =
  'w-full rounded-xl border border-white/10 bg-neutral-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-[#c5ff00]/60 focus:ring-1 focus:ring-[#c5ff00]/30 aria-[invalid=true]:border-red-500/60';

function FieldError({ message }: { message?: string }) {
  if (!message) return null;

  return <p className="mt-2 text-sm text-red-400">{message}</p>;
}

// Named export: matches import { Contact } from './components/Contact'
export function Contact() {
  const [form, setForm] = useState<FormData>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const handlePrefill = (event: Event) => {
      const customEvent = event as CustomEvent<{
        websiteType?: WebsiteType;
      }>;

      if (customEvent.detail?.websiteType) {
        setForm((previous) => ({
          ...previous,
          websiteType: customEvent.detail!.websiteType ?? '',
        }));

        formRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    };

    window.addEventListener(PREFILL_EVENT, handlePrefill);

    return () => {
      window.removeEventListener(PREFILL_EVENT, handlePrefill);
    };
  }, []);

  const updateField = <K extends keyof FormData>(
    field: K,
    value: FormData[K],
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [field]: undefined,
    }));

    setSuccess('');
    setErrorMessage('');
  };

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = 'Please enter your name.';
    }

    if (!form.businessName.trim()) {
      nextErrors.businessName = 'Please enter your shop or business name.';
    }

    const cleanPhone = form.phone.trim();

    if (!cleanPhone) {
      nextErrors.phone = 'Please enter your phone number.';
    } else if (!/^[+()\d\s.-]{7,20}$/.test(cleanPhone)) {
      nextErrors.phone = 'Please enter a valid phone number.';
    }

    if (
      form.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
    ) {
      nextErrors.email = 'Please enter a valid email address.';
    }

    if (!form.websiteType) {
      nextErrors.websiteType = 'Please select a website type.';
    }

    if (form.message.trim().length < 10) {
      nextErrors.message =
        'Please describe your requirements in at least 10 characters.';
    }

    if (!form.consent) {
      nextErrors.consent =
        'Please confirm that we may contact you about this enquiry.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildEnquiryText = () =>
    [
      'Website enquiry',
      `Name: ${form.name.trim()}`,
      `Business: ${form.businessName.trim()}`,
      `Phone: ${form.phone.trim()}`,
      `Email: ${form.email.trim() || 'Not provided'}`,
      `Website type: ${form.websiteType}`,
      `Requirements: ${form.message.trim()}`,
    ].join('\n');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildEnquiryText());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setErrorMessage(
        'Could not copy automatically. Please select and copy your enquiry manually.',
      );
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccess('');
    setErrorMessage('');

    if (isSubmitting || !validate()) return;

    // Basic honeypot. Server-side validation and rate limiting
    // are still needed for a production deployment.
    if (form.company_website.trim()) {
      setSuccess('Thanks! Your enquiry has been received.');
      setForm(initialForm);
      return;
    }

    const supabase = getSupabaseClient();

    if (!supabase) {
      setErrorMessage(
        'The enquiry service is not configured. Please check your environment variables and try again later.',
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('enquiries').insert({
        name: form.name.trim(),
        business_name: form.businessName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        business_type: String(form.websiteType),
        requirements: form.message.trim(),
        subject: 'Website enquiry',
        consent_at: new Date().toISOString(),
        source: 'portfolio-contact-form',
      });

      if (error) {
        // Keep technical details in the developer console, not the UI.
        console.error('Supabase enquiry error:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          status: error.status,
        });

        setErrorMessage(
          'Your enquiry could not be submitted. Please check your connection and try again later.',
        );
        return;
      }

      setSuccess(
        'Thanks! Your enquiry has been submitted successfully. I’ll get back to you soon.',
      );

      setForm(initialForm);
      setErrors({});
    } catch (error) {
      console.error('Enquiry submission failed:', error);

      setErrorMessage(
        'Something went wrong while submitting your enquiry. Please try again later.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="mb-12 max-w-2xl">
          <p className="mb-3 font-mono text-sm uppercase tracking-[0.2em] text-[#c5ff00]">
            Let’s work together
          </p>

          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">
            Let’s build your website.
          </h2>

          <p className="mt-4 text-base leading-7 text-neutral-400">
            Tell me about your shop or business, what you need, and how I can
            help you get online.
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1fr_1.5fr]">
          <aside className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
            <h3 className="text-xl font-semibold text-white">
              Have a project in mind?
            </h3>

            <p className="mt-3 leading-7 text-neutral-400">
              Share your requirements through this form. Please include
              accurate contact details so I can follow up about your project.
            </p>

            <div className="mt-8 space-y-4 text-sm text-neutral-300">
              <div className="flex items-center gap-3">
                <MessageCircle size={18} className="text-[#c5ff00]" />
                <span>Website enquiries and project discussions</span>
              </div>
            </div>
          </aside>

          <form
            ref={formRef}
            onSubmit={handleSubmit}
            noValidate
            className="space-y-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-8"
          >
            {success && (
              <div
                role="status"
                className="flex gap-3 rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-300"
              >
                <Check size={20} className="shrink-0" />
                <p>{success}</p>
              </div>
            )}

            {errorMessage && (
              <div
                role="alert"
                className="flex gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
              >
                <AlertCircle size={20} className="shrink-0" />
                <p>{errorMessage}</p>
              </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-medium text-neutral-200"
                >
                  Your name *
                </label>

                <input
                  id="name"
                  name="name"
                  autoComplete="name"
                  required
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  aria-invalid={Boolean(errors.name)}
                  className={inputClass}
                  placeholder="Enter your name"
                />

                <FieldError message={errors.name} />
              </div>

              <div>
                <label
                  htmlFor="businessName"
                  className="mb-2 block text-sm font-medium text-neutral-200"
                >
                  Shop / business name *
                </label>

                <input
                  id="businessName"
                  name="businessName"
                  autoComplete="organization"
                  required
                  value={form.businessName}
                  onChange={(e) =>
                    updateField('businessName', e.target.value)
                  }
                  aria-invalid={Boolean(errors.businessName)}
                  className={inputClass}
                  placeholder="Your shop name"
                />

                <FieldError message={errors.businessName} />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="phone"
                  className="mb-2 block text-sm font-medium text-neutral-200"
                >
                  Phone number *
                </label>

                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  required
                  value={form.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  aria-invalid={Boolean(errors.phone)}
                  className={inputClass}
                  placeholder="Your contact number"
                />

                <FieldError message={errors.phone} />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-neutral-200"
                >
                  Email address
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  aria-invalid={Boolean(errors.email)}
                  className={inputClass}
                  placeholder="you@example.com (optional)"
                />

                <FieldError message={errors.email} />
              </div>
            </div>

            <div>
              <label
                htmlFor="websiteType"
                className="mb-2 block text-sm font-medium text-neutral-200"
              >
                What type of website do you need? *
              </label>

              <select
                id="websiteType"
                name="websiteType"
                required
                value={form.websiteType}
                onChange={(e) =>
                  updateField('websiteType', e.target.value as WebsiteType | '')
                }
                aria-invalid={Boolean(errors.websiteType)}
                className={inputClass}
              >
                <option value="">Select a website type</option>

                {websiteTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>

              <FieldError message={errors.websiteType} />
            </div>

            <div>
              <label
                htmlFor="message"
                className="mb-2 block text-sm font-medium text-neutral-200"
              >
                Tell me about your requirements *
              </label>

              <textarea
                id="message"
                name="message"
                rows={5}
                required
                value={form.message}
                onChange={(e) => updateField('message', e.target.value)}
                aria-invalid={Boolean(errors.message)}
                className={inputClass}
                placeholder="What should your website do? Mention the pages, features, or style you have in mind."
              />

              <FieldError message={errors.message} />
            </div>

            {/* Basic spam honeypot */}
            <div
              aria-hidden="true"
              className="absolute -left-[10000px] h-px w-px overflow-hidden"
            >
              <label htmlFor="company_website">Leave this field empty</label>

              <input
                id="company_website"
                name="company_website"
                tabIndex={-1}
                autoComplete="off"
                value={form.company_website}
                onChange={(e) =>
                  updateField('company_website', e.target.value)
                }
              />
            </div>

            <div>
              <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-neutral-400">
                <input
                  type="checkbox"
                  required
                  checked={form.consent}
                  onChange={(e) => updateField('consent', e.target.checked)}
                  className="mt-1 accent-[#c5ff00]"
                />

                <span>
                  I agree to be contacted about this website enquiry using the
                  contact details I provided. *
                </span>
              </label>

              <FieldError message={errors.consent} />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#c5ff00] px-6 py-4 font-semibold text-black transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Sending enquiry…
                </>
              ) : (
                <>
                  <Send size={18} />
                  Send enquiry
                </>
              )}
            </button>

            <div className="flex flex-wrap gap-3 border-t border-white/10 pt-5">
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-sm text-neutral-300 transition hover:bg-white/5"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied' : 'Copy enquiry'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
