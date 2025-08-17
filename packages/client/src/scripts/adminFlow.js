import { createAuthClient } from "better-auth/client";
import { adminClient } from "better-auth/client/plugins";

// Create a client instance configured with the admin plugin.
// Adjust the baseURL to match your Better Auth server.
const authClient = createAuthClient({
  baseURL: "http://localhost:3000",
  plugins: [adminClient()],
});

async function signInAdmin() {
  // Sign in as admin to obtain the session.
  // The session is managed by cookies on the server,
  // but in this Node script we'll extract a token from the response.
  const response = await authClient.signIn.email({
    email: "admin2@example.com", // Replace with your admin email
    password: "RecruiterPassword123!", // Replace with your admin password
  });

  if (response.error) {
    throw new Error(`Admin sign in failed: ${response.error.message}`);
  }

  console.log("Admin signed in successfully.");
  // Assume the signIn response returns a session token.
  // In a browser, the token is stored as a cookie, but here we simulate that by extracting it.
  const adminToken = response.data.token; // Adjust property if needed
  if (!adminToken) {
    throw new Error("No session token found in sign in response.");
  }
  console.log("Session token retrieved:", adminToken);
  return adminToken;
}

async function createUser(adminToken) {
  try {
    // Use the admin token to authorize the admin operation.
    // In our case, we pass the token in the Authorization header.
    const newUserResponse = await authClient.admin.createUser({
      name: "Test User",
      email: "test@example.com",
      password: "password123",
      role: "user", // Set the role for the new user (e.g., "user" or "Recruiter" as desired)
      data: {
        customField: "customValue",
      },
      fetchOptions: {
        headers: {
          // Pass the session token; in a production browser environment,
          // cookie-based session management would handle this automatically.
       Cookie: `better-auth.session_token=${adminToken}`,
        },
      },
    });

    if (newUserResponse.error) {
      console.error("User creation error:", newUserResponse.error);
    } else {
      console.log("User created successfully:", newUserResponse.data);
    }
  } catch (error) {
    console.error("Error creating user:", error);
  }
}

async function main() {
  try {
    const adminToken = await signInAdmin();
    await createUser(adminToken);
  } catch (error) {
    console.error("Flow error:", error.message);
  }
}

main();
