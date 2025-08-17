import { authClient } from './auth-test-client';

declare global {
  var __authToken: string;
}

async function testAuthEndpoints() {
  try {
    console.log('Testing auth endpoints...');
    
    // Use the session token we got from creating the admin user
    globalThis.__authToken = '21f47ec7-97c2-48ce-9ffd-6b1624792627';
    console.log('Using session token:', globalThis.__authToken);

    // Get session directly instead of using useSession atom
    const session = await authClient.getSession();
    console.log('GetSession response:', session);

    if (session.error) {
      throw new Error(`GetSession failed: ${session.error.message}`);
    }

    // Try to list users with active session
    const usersResponse = await authClient.admin.listUsers({
      query: {
        limit: 10,
        offset: 0
      }
    });
    console.log('Users list response:', usersResponse);

    if (usersResponse.error) {
      throw new Error(`ListUsers failed: ${usersResponse.error.message}`);
    }

  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

// Run the tests
testAuthEndpoints()
  .then(() => console.log('Tests completed'))
  .catch(console.error);