import { authClient } from '../lib/auth-client.js';

const createUser = async () => {
  try {
    const newUser = await authClient.admin.createUser({
      name: "Test User",
      email: "test@example.com",
      password: "password123",
      role: "user",
      data: {
        customField: "customValue"
      }
    });

    if (newUser.error) {
      console.error("User creation error:", newUser.error);
    } else {
      console.log("User created successfully:", newUser.data);
    }
  } catch (error) {
    console.error("Error creating user:", error);
  }
};

createUser();