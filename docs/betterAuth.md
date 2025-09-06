# Better Auth — Server & Client Guide (Prisma + Email/Password + Express)

> Assumes you installed `better-auth`, `@prisma/client`, `prisma` (dev), and have an Express + Node/TypeScript project.

---

## 1. Install & basic files

```bash
# install packages (example)
npm install better-auth @prisma/client
npm install -D prisma
# if using FastAPI/other services, install relevant libs separately
```

Create a server `auth.ts` (or `auth/index.ts`) to centralize Better Auth configuration and adapter wiring.

---

## 2. Prisma adapter (server side)

`auth.ts` — setup Better Auth with Prisma adapter:

```ts
// server/auth.ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql", // or "sqlite", "mysql" etc.
  }),
  // other options (see below): emailAndPassword, emailVerification, password config...
});
```

**Notes**

* If you use a custom Prisma output directory, import your generated `PrismaClient` from that path.
* To generate/migrate Better Auth schema (only generation supported):

  ```bash
  npx @better-auth/cli@latest generate
  ```

---

## 3. Email & Password authenticator (server config)

Enable email/password in `auth.ts` and wire verification/reset callbacks:

```ts
// server/auth.ts (continuing)
import { sendEmail } from "./email"; // your implementation

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    // requireEmailVerification: true,  // optional: block signin until verified
    minPasswordLength: 8,
    maxPasswordLength: 128,
    sendResetPassword: async ({ user, url, token }, request) => {
      await sendEmail({
        to: user.email,
        subject: "Reset your password",
        text: `Reset link: ${url}`,
      });
    },
    onPasswordReset: async ({ user }, request) => {
      console.log(`Password for ${user.email} reset`);
    },
  },
  emailVerification: {
    // callback used to send verification email
    sendVerificationEmail: async ({ user, url, token }, request) => {
      await sendEmail({
        to: user.email,
        subject: "Verify your email",
        text: `Verify here: ${url}`,
      });
    },
  },
  // optional: custom password hasher (default uses scrypt)
  /* password: { 
       hash: async (plain) => ..., 
       verify: async (plain, hash) => ... 
     } */
});
```

**Password hashing**

* Better Auth uses `scrypt` by default (node native). You can override via `passwordHasher` or `emailAndPassword.password` custom `hash`/`verify` functions.

---

## 4. Server-side API usage (Express examples)

You do **not** have to re-implement auth logic — call `auth.api.*` handlers from your Express routes (or forward requests). Use incoming cookies for session-bound endpoints.

```ts
// server/routes/authRoutes.ts
import express from "express";
import { auth } from "../auth";

const router = express.Router();

// Sign up
router.post("/signup", async (req, res) => {
  try {
    const data = await auth.api.signUpEmail({
      body: {
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        image: req.body.image,         // optional depending on config
        callbackURL: req.body.callbackURL,
      },
      // if any headers required, you can include them
    });
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err });
  }
});

// Sign in (pass incoming cookies if needed)
router.post("/signin", async (req, res) => {
  try {
    const data = await auth.api.signInEmail({
      body: {
        email: req.body.email,
        password: req.body.password,
        rememberMe: !!req.body.rememberMe,
        callbackURL: req.body.callbackURL,
      },
      headers: { cookie: req.headers.cookie ?? "" }, // preserve cookies for session
    });
    // auth.api may set cookies in response headers; return them or let framework handle
    res.json(data);
  } catch (err) {
    res.status(401).json({ error: err });
  }
});

// Request password reset
router.post("/request-reset", async (req, res) => {
  const data = await auth.api.requestPasswordReset({
    body: { email: req.body.email, redirectTo: req.body.redirectTo },
  });
  res.json(data);
});

// Reset password (front-end posts newPassword + token)
router.post("/reset-password", async (req, res) => {
  const data = await auth.api.resetPassword({
    body: { newPassword: req.body.newPassword, token: req.body.token },
  });
  res.json(data);
});

// Sign out
router.post("/signout", async (req, res) => {
  await auth.api.signOut({ headers: { cookie: req.headers.cookie ?? "" } });
  res.json({ ok: true });
});

export default router;
```

**Session cookies & headers**

* Many server-side endpoints require the session cookie. Forward `req.headers.cookie` into `auth.api.*` calls as shown.
* If you use proxy / reverse proxy be sure cookies are forwarded and secure flags set (Secure, HttpOnly, SameSite as per your deployment).

---

## 5. Express integration patterns

There are two pragmatic approaches:

**A. Proxy endpoints** (recommended when you want full control / custom behavior)

* Create Express routes that call `auth.api.*` as above, perform any extra checks, and respond. This gives you control over headers, logging, rate limiting, and error mapping.

**B. Direct handler mounting** (if better-auth exposes ready-made handlers)

* If Better Auth provides a ready `expressHandler`, mount it at `/api/auth`. (Check the library exports if available.)

Either approach, ensure:

* Cookie settings are correct (Secure for HTTPS).
* CSRF protections for forms if you rely on cookies.
* Rate-limiting on signIn/signUp endpoints.

---

## 6. Client-side usage (browser / SPA)

Create an `auth-client.ts` helper that calls auth client methods (the docs expose `authClient` semantics):

```ts
// client/auth-client.ts (pseudo)
// how you get authClient depends on library; assume `authClient` global or SDK import
import { createAuthClient } from "better-auth/client"; // pseudocode

export const authClient = createAuthClient({
  // optional base url, fetch wrapper, etc.
});

// Sign up (client)
const { data, error } = await authClient.signUp.email({
  name: "John Doe",
  email: "john.doe@example.com",
  password: "password1234",
  image: "https://example.com/avatar.png",
  callbackURL: "https://yourapp.com/verify-callback",
});

// Sign in
const { data: signinData, error: signinErr } = await authClient.signIn.email({
  email: "john.doe@example.com",
  password: "password1234",
  rememberMe: true,
  callbackURL: "https://yourapp.com/dashboard",
});

// Sign out with redirect hook
await authClient.signOut({
  fetchOptions: {
    onSuccess: () => {
      // supplant router push to login
      window.location.href = "/login";
    },
  },
});
```

**Client-side password reset flows**

* `authClient.requestPasswordReset({ email, redirectTo })` → server sends email with token
* `authClient.resetPassword({ token, newPassword })` on the reset page

**sendVerificationEmail**

* `authClient.sendVerificationEmail({ email, callbackURL })` triggers server to send verification link (server-side `sendVerificationEmail` implementation must exist).

---

## 7. Email verification & reset details (server callbacks)

* `sendVerificationEmail({ user, url, token }, request)` — you implement sending an email that includes `url` (verification link).
* `sendResetPassword({ user, url, token }, request)` — you implement sending a reset link that contains a one-time token.
* `onPasswordReset({ user }, request)` — hook executed after password reset.

**Require email verification**

```ts
export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
});
```

When enabled, signin attempts for unverified accounts should trigger `sendVerificationEmail` and return a 403-ish error; client should surface a helpful message.

---

## 8. Password management & security recommendations

* Default hashing: `scrypt` (good fallback if `argon2id` unavailable). OWASP recommends `argon2id` where possible; choose secure parameters.
* Allow custom hashing by providing `password.hash` and `password.verify` in config.
* Enforce strong password policy: min length (≥8), consider checks for common passwords or breached-password API.
* On `changePassword`, support `revokeOtherSessions` option to invalidate other sessions after a credential change.
* Protect endpoints with rate limits (especially sign-in and password reset).

---

## 9. Prisma Schema & CLI tips

* Use the Better Auth CLI to generate schema pieces required by the adapter:

  ```bash
  npx @better-auth/cli@latest generate
  ```
* The adapter supports schema generation, but not automated migrations — run `prisma migrate` yourself if you modify models.
* Ensure your Prisma schema includes the tables/models expected by Better Auth (the CLI generator will scaffold these).

---

## 10. Example full minimal flow (signup → verify → signin)

1. **Client**: calls `authClient.signUp.email({...})` → sends POST `/signup` to your Express route.
2. **Server**: your Express `/signup` route calls `auth.api.signUpEmail({ body })`.
3. **Server**: Better Auth triggers `emailVerification.sendVerificationEmail` (your implementation sends email with token & `callbackURL`).
4. **User**: clicks link, lands on frontend route that verifies token via server-side `auth.api` or redirect handling.
5. **Client**: after verification, user signs in via `authClient.signIn.email({...})`, server returns session cookie.
6. **Client**: authenticated requests use cookies or token as per your session setup.

---

## 11. Logging, observability & deployment notes

* Log high-level events: signIn success/failure, password reset requests, verification attempts — avoid storing PII in logs.
* Set cookies with `Secure`, `HttpOnly`, `SameSite` appropriate to your deployment.
* In production, use TLS everywhere and rotate keys/secrets (use a vault for secret management).

---

## 12. Quick reference mapping (API names used in examples)

* Server-side exported API functions (as used above):
  `auth.api.signUpEmail`, `auth.api.signInEmail`, `auth.api.signOut`, `auth.api.requestPasswordReset`, `auth.api.resetPassword`, `auth.api.changePassword`.

* Client-side helper functions:
  `authClient.signUp.email`, `authClient.signIn.email`, `authClient.signOut`, `authClient.requestPasswordReset`, `authClient.resetPassword`, `authClient.changePassword`, `authClient.sendVerificationEmail`.

(Exact import names for client SDK may vary depending on Better Auth package; consult your installed package exports.)

---

## 13. Useful links (from your references)

* Better Auth docs: [https://www.better-auth.com/docs/](https://www.better-auth.com/docs/)
* Email & password: [https://www.better-auth.com/docs/authentication/email-password](https://www.better-auth.com/docs/authentication/email-password)
* Prisma adapter: [https://www.better-auth.com/docs/adapters/prisma](https://www.better-auth.com/docs/adapters/prisma)
* Express integration: [https://www.better-auth.com/docs/integrations/express](https://www.better-auth.com/docs/integrations/express)

---

