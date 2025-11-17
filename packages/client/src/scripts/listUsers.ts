import { authClient } from "../lib/auth-client";


async function listUsers() {
  try {
    // Some builds may not expose an admin surface on authClient; gracefully skip.
    const maybeAdmin: unknown = (authClient as unknown as { admin?: unknown }).admin;
    if (!maybeAdmin || typeof (maybeAdmin as { listUsers?: unknown }).listUsers !== 'function') {
      console.log("Admin user listing not available in this build.");
      return;
    }
  interface ListUsersArgs { query?: { limit?: number } }
  interface ListedUser { id: string; name?: string; email?: string; role?: string | null; createdAt?: string | Date }
  interface ListUsersResult { data: { users: ListedUser[] }; error?: { message: string } | null }
  const users = await (maybeAdmin as { listUsers: (args: ListUsersArgs) => Promise<ListUsersResult> }).listUsers({ query: { limit: 10 } });

    if (users.error) {
      console.error("Error fetching users:", users.error);
      return;
    }

    console.log("\n=== User List ===\n");
    users.data.users.forEach((u, index: number) => {
      console.log(`User ${index + 1}:`);
      console.log(`- ID: ${u.id}`);
      console.log(`- Name: ${u.name ?? '—'}`);
      console.log(`- Email: ${u.email ?? '—'}`);
      console.log(`- Role: ${u.role ?? '—'}`);
      const createdVal = u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—';
      console.log(`- Created: ${createdVal}`);
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