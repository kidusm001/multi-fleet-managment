// scripts/signInRecruiter.js
import { createAuthClient } from "better-auth/client";

// Create a Better Auth client instance with the base URL of your auth server.
const authClient = createAuthClient({
  baseURL: "http://localhost:3000",
});

async function signInRecruiter() {
  try {
    // Attempt to sign in the recruiter using email and password
    const response = await authClient.signIn.email({
      email: "admin2@example.com",       // Use the recruiter's email
      password: "RecruiterPassword123!",      // Use the corresponding password
    });

    if (response.error) {
      console.error("Sign in error:", response.error);
    } else {
      console.log("Recruiter sign in successful:", response.data);
    }
  } catch (error) {
    console.error("Error during sign in:", error);
  }
}

signInRecruiter();
