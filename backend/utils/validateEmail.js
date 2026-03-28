import dns from "dns";
import { promisify } from "util";
import validator from "validator";

const resolveMx = promisify(dns.resolveMx);

// Popular allowed domains (add more as needed)
const ALLOWED_DOMAINS = [
  "gmail.com",
  "yahoo.com",
  "yahoo.com.ph",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "icloud.com",
  "me.com",
  "protonmail.com",
  "proton.me",
];

// Known disposable/fake domains to block
const BLOCKED_DOMAINS = [
  "mailinator.com",
  "tempmail.com",
  "guerrillamail.com",
  "10minutemail.com",
  "throwaway.email",
  "yopmail.com",
  "fakeinbox.com",
  "trashmail.com",
];

export const validateEmail = async (email) => {
  // 1. Basic format check
  if (!validator.isEmail(email)) {
    return { valid: false, reason: "Invalid email format" };
  }

  const domain = email.split("@")[1].toLowerCase();

  // 2. Block disposable domains
  if (BLOCKED_DOMAINS.includes(domain)) {
    return {
      valid: false,
      reason: "Disposable email addresses are not allowed",
    };
  }

  // 3. Only allow known legitimate domains
  if (!ALLOWED_DOMAINS.includes(domain)) {
    return {
      valid: false,
      reason: `Only emails from these providers are allowed: Gmail, Yahoo, Outlook, Hotmail, iCloud, ProtonMail`,
    };
  }

  // 4. MX record check — confirm domain actually receives emails
  try {
    const records = await resolveMx(domain);
    if (!records || records.length === 0) {
      return { valid: false, reason: "Email domain cannot receive emails" };
    }
  } catch {
    return { valid: false, reason: "Email domain does not exist" };
  }

  return { valid: true };
};
