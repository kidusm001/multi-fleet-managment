import { authClient } from './auth-test-client';

async function setupAdmin() {
  try {
    console.log('Setting up admin user...');
    
    // Create admin user using the admin.createUser method as per documentation
    const signupResponse = await authClient.admin.createUser({
      email: 'admin@example.com',
      password: 'AdminPass123!',
      name: 'Admin User',
      role: 'admin'
      // Role is passed directly as a parameter, not in data
    });
    
    console.log('Signup response:', signupResponse);

    // Sign in as the admin
    const auth = await authClient.signIn.email({
      email: 'admin@example.com',
      password: 'AdminPass123!'
    });
    
    if (auth.error) {
      throw new Error(`Sign in failed: ${auth.error.message}`);
    }

    console.log('Sign in successful:', auth.data);

    // Use admin plugin to verify and update role if needed
    if (auth.data?.user?.id) {
      const roleUpdate = await authClient.admin.setRole({
        userId: auth.data.user.id,
        role: 'admin'
      });
      console.log('Role update result:', roleUpdate);
    }

  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  }
}

setupAdmin()
  .then(() => console.log('Admin setup completed'))
  .catch(console.error);