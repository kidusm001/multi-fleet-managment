import { createAuthClient } from "better-auth/client";
import { adminClient } from "better-auth/client/plugins";

// Create a Better Auth client instance with the Admin plugin
const authClient = createAuthClient({
  baseURL: "http://localhost:3000",
  plugins: [adminClient()]
});

// Helper function to upsert a user
async function upsertUser({ email, password, name, role }) {
  try {
    const response = await authClient.signUp.email({
      email,
      password,
      name,
      data: { role }
    });
    
    if (response.error) {
      // If the user already exists, try updating their role
      if (response.error.code === "USER_ALREADY_EXISTS") {
        console.warn(`${name} already exists. Attempting to update role to "${role}".`);
        
        // Sign in as admin to obtain necessary permissions
        const signInResponse = await authClient.signIn.email({
          email: "admin@example.com",
          password: "AdminPass123!"
        });
        if (signInResponse.error) {
          console.error("Admin sign in error:", signInResponse.error);
          return;
        }
        
        // Use the Admin plugin to fetch the user info by email using getUserByEmail instead
        const userDataResponse = await authClient.admin.getUserByEmail({ email });
        if (userDataResponse.error) {
          console.error(`Failed fetching user data for ${name}:`, userDataResponse.error);
          return;
        }
        
        // Set the user role using the admin plugin
        const updatedUser = await authClient.admin.setRole({
          userId: userDataResponse.id,
          role
        });
        if (updatedUser.error) {
          console.error(`${name} role update error:`, updatedUser.error);
        } else {
          console.log(`${name} role updated successfully:`, updatedUser);
        }
      } else {
        console.error(`${name} sign up error:`, response.error);
      }
    } else {
      console.log(`${name} sign up successful:`, response.data);
    }
  } catch (error) {
    console.error(`Error during ${name} sign up:`, error);
  }
}

async function signUpUsers() {
  await upsertUser({
    email: "admin@example.com",
    password: "AdminPass123!",
    name: "Admin User",
    role: "admin",
  });

  await upsertUser({
    email: "recruiter@example.com",
    password: "RecruiterPass123!",
    name: "Recruiter User",
    role: "recruiter", // spelled in lowercase
  });

  await upsertUser({
    email: "manager@example.com",
    password: "ManagerPass123!",
    name: "Manager User",
    role: "manager",
  });
}

signUpUsers();
