export class RateLimitError extends Error {
  retryAfter: number;

  constructor(retryAfter: number) {
    super("rate limited");
    this.retryAfter = retryAfter;
  }
}

export class ProfanityError extends Error {
  flagged: { word: string; source: string }[];
  apiMessage: string;

  constructor(
    flagged: { word: string; source: string }[],
    apiMessage?: string,
  ) {
    super("profanity detected");
    this.flagged = flagged;
    this.apiMessage = apiMessage ?? "Profanity was found in the provided text";
  }
}

export class AccountAgeError extends Error {
  constructor(message: string) {
    super(message);
  }
}
