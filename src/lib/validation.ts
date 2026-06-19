export const passwordRuleMessage = 'A senha precisa ter pelo menos 6 caracteres, uma letra maiuscula e um caractere especial.';

export function isStrongPassword(password: string) {
  return password.length >= 6 && /[A-Z]/.test(password) && /[^A-Za-z0-9]/.test(password);
}

export function onlyDigits(value: string) {
  return value.replace(/\D/g, '');
}

export function normalizeBrazilPhone(value: string) {
  return onlyDigits(value).slice(0, 11);
}

export function isValidBrazilPhone(value?: string | null) {
  if (!value) return true;
  const digits = onlyDigits(value);
  return digits.length === 10 || digits.length === 11;
}

export function formatBrazilWhatsapp(value: string) {
  const digits = normalizeBrazilPhone(value);
  const ddd = digits.slice(0, 2);
  const first = digits.length > 10 ? digits.slice(2, 7) : digits.slice(2, 6);
  const second = digits.length > 10 ? digits.slice(7, 11) : digits.slice(6, 10);

  if (digits.length <= 2) return ddd ? `(${ddd}` : '';
  if (!second) return `(${ddd}) ${first}`;
  return `(${ddd}) ${first}-${second}`;
}
