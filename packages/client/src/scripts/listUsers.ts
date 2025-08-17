import { authClient } from "../lib/auth-client";

interface User {
  id: string;
  name: string;
  email: string;
  role?: string | null;
  createdAt: Date;
}

async function listUsers() {
  try {
    const users = await authClient.admin.listUsers({
      query: {
        limit: 10
      }
    });

    if (users.error) {
      console.error("Error fetching users:", users.error);
      return;
    }

    console.log("\n=== User List ===\n");
    users.data.users.forEach((user: User, index: number) => {
      console.log(`User ${index + 1}:`);
      console.log(`- ID: ${user.id}`);
      console.log(`- Name: ${user.name}`);
      console.log(`- Email: ${user.email}`);
      console.log(`- Role: ${user.role}`);
      console.log(`- Created: ${new Date(user.createdAt).toLocaleDateString()}`);
      console.log("------------------------");
    });

    console.log(`\nTotal Users: ${users.data.users.length}`);

  } catch (error) {
    if (error instanceof Error) {
      console.error("Error listing users:", error.message);
    } else {
      console.error("Error listing users:", String(error));
    }
  }
}

// Execute the function
listUsers();