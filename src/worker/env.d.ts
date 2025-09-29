interface Env {
  DB: D1Database;
  REPORTS_KV: KVNamespace;
  OPENAI_API_KEY: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_PUBLISHABLE_KEY: string;
  MOCHA_USERS_SERVICE_API_KEY: string;
  MOCHA_USERS_SERVICE_API_URL: string;
  RESEND_API_KEY: string;
  RAGATOUILLE_API_URL: string;
  RAGATOUILLE_API_KEY: string;
}
