/**
 * P13 — form behaviour.
 *
 * The forms are real HTML forms that post to Web3Forms and redirect to
 * /thanks, so they work with JavaScript disabled. This adds inline validation
 * on top — on blur, never on keystroke, because validating while someone is
 * still typing their phone number tells them they are wrong before they have
 * finished being right.
 *
 * No CAPTCHA: the honeypot handles spam at this volume, and a CAPTCHA on a
 * six-field B2B form costs more genuine enquiries than it saves.
 */
const forms = document.querySelectorAll<HTMLFormElement>('[data-form]');

for (const form of forms) {
  const messages = JSON.parse(form.dataset.messages ?? '{}') as Record<string, string>;

  const fail = (field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, text: string) => {
    const slot = form.querySelector<HTMLElement>(`[data-error-for="${field.name}"]`);
    field.setAttribute('aria-invalid', 'true');
    if (slot) slot.textContent = text;
  };

  const pass = (field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement) => {
    const slot = form.querySelector<HTMLElement>(`[data-error-for="${field.name}"]`);
    field.removeAttribute('aria-invalid');
    if (slot) slot.textContent = '';
  };

  /* Errors name the problem and the fix, not "invalid input". */
  const check = (field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement): boolean => {
    const value = field.value.trim();
    if (field.required && !value) { fail(field, messages.required ?? 'Required'); return false; }
    if (field.type === 'tel' && value && value.replace(/\D/g, '').length < 10) {
      fail(field, messages.phone ?? 'Enter a phone number we can reach you on.');
      return false;
    }
    if (field.type === 'email' && value && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
      fail(field, messages.email ?? 'That email address looks incomplete.');
      return false;
    }
    pass(field);
    return true;
  };

  const fields = Array.from(
    form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input, select, textarea'),
  ).filter((f) => f.type !== 'hidden' && f.name !== 'botcheck');

  for (const field of fields) {
    field.addEventListener('blur', () => check(field));
    field.addEventListener('input', () => {
      if (field.getAttribute('aria-invalid') === 'true') check(field);
    });
  }

  form.addEventListener('submit', (e) => {
    let ok = true;
    let firstBad: HTMLElement | null = null;
    for (const field of fields) {
      if (!check(field)) { ok = false; firstBad ??= field; }
    }
    if (!ok) {
      e.preventDefault();
      firstBad?.focus();
      return;
    }
    const submit = form.querySelector<HTMLButtonElement>('[type="submit"]');
    if (submit) {
      submit.disabled = true;
      submit.dataset.idle = submit.textContent ?? '';
      submit.textContent = messages.sending ?? 'Sending…';
      /* If the navigation is blocked or fails, give the button back rather
         than leaving a dead form on the screen. */
      setTimeout(() => {
        submit.disabled = false;
        submit.textContent = submit.dataset.idle ?? '';
      }, 12000);
    }
  });
}
