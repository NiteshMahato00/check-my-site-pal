// Phishing detection heuristics

export type DetectionResult = {
  isSafe: boolean;
  score: number; // 0-100, higher = more suspicious
  reasons: string[];
  type: "url" | "email";
  input: string;
};

const PHISHING_URL_PATTERNS = [
  /paypal.*login/i,
  /secure.*verify/i,
  /account.*confirm/i,
  /banking.*update/i,
  /signin.*verify/i,
  /login.*secure/i,
  /verify.*account/i,
  /update.*credentials/i,
  /password.*reset.*urgent/i,
  /free.*prize/i,
  /winner.*claim/i,
  /click.*here.*now/i,
];

const SUSPICIOUS_URL_KEYWORDS = [
  "phishing", "malware", "hack", "steal", "fraud", "scam",
  "trojan", "exploit", "ransom", "botnet", "spyware",
  "paypal-", "apple-", "google-", "microsoft-", "amazon-",
  "faceb00k", "paypa1", "amaz0n", "g00gle", "micros0ft",
];

const SUSPICIOUS_TLDS = [".tk", ".ml", ".ga", ".cf", ".gq", ".xyz", ".top", ".click", ".link"];

const LEGITIMATE_DOMAINS = [
  "google.com", "gmail.com", "youtube.com", "facebook.com",
  "twitter.com", "instagram.com", "linkedin.com", "github.com",
  "microsoft.com", "apple.com", "amazon.com", "netflix.com",
  "spotify.com", "paypal.com", "wikipedia.org", "reddit.com",
  "stackoverflow.com", "w3schools.com", "mdn.mozilla.org",
  "lovable.dev", "vercel.com", "netlify.com",
];

const PHISHING_EMAIL_PATTERNS = [
  /noreply@.*\.(tk|ml|ga|cf|gq)/i,
  /support@.*free\.com/i,
  /security.*alert@/i,
  /account.*verify@/i,
  /urgent.*action@/i,
];

const SUSPICIOUS_EMAIL_DOMAINS = [
  "tempmail.com", "throwaway.email", "mailinator.com",
  "guerrillamail.com", "yopmail.com", "trashmail.com",
  "sharklasers.com", "guerrillamailblock.com",
];

function extractDomain(url: string): string {
  try {
    const withProtocol = url.startsWith("http") ? url : `https://${url}`;
    const parsed = new URL(withProtocol);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return url.toLowerCase();
  }
}

export function detectURL(url: string): DetectionResult {
  const reasons: string[] = [];
  let score = 0;

  const lowerUrl = url.toLowerCase().trim();
  const domain = extractDomain(url);

  // Check if it's a known legitimate domain
  if (LEGITIMATE_DOMAINS.some((d) => domain === d || domain.endsWith(`.${d}`))) {
    return {
      isSafe: true,
      score: 5,
      reasons: ["Domain is a recognized, trusted website"],
      type: "url",
      input: url,
    };
  }

  // IP address instead of domain
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(domain)) {
    score += 35;
    reasons.push("URL uses an IP address instead of a domain name");
  }

  // Suspicious TLDs
  if (SUSPICIOUS_TLDS.some((tld) => domain.endsWith(tld))) {
    score += 30;
    reasons.push(`Uses a high-risk top-level domain (${SUSPICIOUS_TLDS.find((t) => domain.endsWith(t))})`);
  }

  // Phishing patterns in URL
  PHISHING_URL_PATTERNS.forEach((pattern) => {
    if (pattern.test(lowerUrl)) {
      score += 25;
      reasons.push("URL matches known phishing pattern");
    }
  });

  // Suspicious keywords
  SUSPICIOUS_URL_KEYWORDS.forEach((keyword) => {
    if (lowerUrl.includes(keyword)) {
      score += 20;
      reasons.push(`Contains suspicious keyword: "${keyword}"`);
    }
  });

  // Excessive hyphens in domain
  const hyphenCount = (domain.match(/-/g) || []).length;
  if (hyphenCount >= 3) {
    score += 15;
    reasons.push("Domain contains excessive hyphens (common in fake domains)");
  }

  // Long subdomain chain
  const subdomainParts = domain.split(".");
  if (subdomainParts.length > 4) {
    score += 20;
    reasons.push("URL has an unusually deep subdomain structure");
  }

  // Brand name in subdomain (typosquatting)
  const brandNames = ["paypal", "apple", "google", "microsoft", "amazon", "facebook", "netflix", "bank"];
  brandNames.forEach((brand) => {
    if (domain.includes(brand) && !domain.endsWith(`${brand}.com`)) {
      score += 30;
      reasons.push(`Impersonates a trusted brand "${brand}" in a suspicious domain`);
    }
  });

  // Very long URL
  if (url.length > 100) {
    score += 10;
    reasons.push("Unusually long URL (often used to hide malicious destinations)");
  }

  // No HTTPS
  if (url.startsWith("http://") && !url.startsWith("https://")) {
    score += 15;
    reasons.push("Connection is not encrypted (no HTTPS)");
  }

  // Multiple @ symbols
  if ((url.match(/@/g) || []).length > 0) {
    score += 25;
    reasons.push("URL contains '@' symbol (used to redirect to a different host)");
  }

  const cappedScore = Math.min(score, 100);

  if (reasons.length === 0) {
    reasons.push("No obvious phishing indicators found");
  }

  return {
    isSafe: cappedScore < 40,
    score: cappedScore,
    reasons,
    type: "url",
    input: url,
  };
}

export function detectEmail(email: string): DetectionResult {
  const reasons: string[] = [];
  let score = 0;

  const lowerEmail = email.toLowerCase().trim();
  const parts = lowerEmail.split("@");

  if (parts.length !== 2) {
    return {
      isSafe: false,
      score: 90,
      reasons: ["Invalid email format"],
      type: "email",
      input: email,
    };
  }

  const [localPart, emailDomain] = parts;

  // Known disposable/temp mail domains
  if (SUSPICIOUS_EMAIL_DOMAINS.includes(emailDomain)) {
    score += 50;
    reasons.push("Email uses a known disposable/temporary mail service");
  }

  // Phishing patterns
  PHISHING_EMAIL_PATTERNS.forEach((pattern) => {
    if (pattern.test(lowerEmail)) {
      score += 35;
      reasons.push("Email matches known phishing address pattern");
    }
  });

  // Suspicious TLD in email domain
  if (SUSPICIOUS_TLDS.some((tld) => emailDomain.endsWith(tld))) {
    score += 30;
    reasons.push(`Email domain uses a high-risk TLD`);
  }

  // Noreply with suspicious domain
  if (localPart.includes("noreply") || localPart.includes("no-reply")) {
    if (!LEGITIMATE_DOMAINS.includes(emailDomain)) {
      score += 15;
      reasons.push("No-reply sender from an unrecognized domain");
    }
  }

  // Numbers replacing letters (l33tspeak)
  if (/[0-9]/.test(emailDomain.split(".")[0]) && emailDomain.split(".")[0].length < 8) {
    score += 20;
    reasons.push("Domain uses numbers to impersonate letters (typosquatting)");
  }

  // Very long local part
  if (localPart.length > 40) {
    score += 10;
    reasons.push("Unusually long email local part");
  }

  // Legitimate email check
  if (LEGITIMATE_DOMAINS.some((d) => emailDomain === d)) {
    score = Math.max(0, score - 20);
    reasons.push("Email domain belongs to a recognized provider");
  }

  const cappedScore = Math.min(score, 100);

  if (reasons.length === 0) {
    reasons.push("No obvious phishing indicators found");
  }

  return {
    isSafe: cappedScore < 40,
    score: cappedScore,
    reasons,
    type: "email",
    input: email,
  };
}

export function analyze(input: string): DetectionResult {
  const trimmed = input.trim();
  // Determine if it's an email or URL
  if (trimmed.includes("@") && !trimmed.startsWith("http") && !trimmed.startsWith("www")) {
    return detectEmail(trimmed);
  }
  return detectURL(trimmed);
}
