import React from 'react';
import { authClient } from '@/lib/auth-client';
import { Button } from '@components/Common/UI/Button';

/**
 * Example component showing how to use Fayda authentication
 * This can be used in any component where you want to offer Fayda login
 */
export function FaydaAuthExample() {
  const handleFaydaSignIn = async () => {
    try {
      await authClient.signIn.oauth2({
        providerId: 'fayda',
        callbackURL: '/dashboard' // Where to redirect after successful login
      });
    } catch (error) {
      console.error('Fayda sign-in error:', error);
      // Handle error (show toast, etc.)
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Sign in with Fayda</h3>
      
      <Button
        onClick={handleFaydaSignIn}
        className="flex items-center justify-center w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
      >
        <svg 
          className="w-5 h-5 mr-2" 
          viewBox="0 0 24 24" 
          fill="currentColor"
        >
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-2.5 16.5h-2v-9h2v9zm-1-10.5c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25zm8 10.5h-2v-4.5c0-1.38-1.12-2.5-2.5-2.5s-2.5 1.12-2.5 2.5v4.5h-2v-9h2v1.5c.69-1.125 1.91-1.5 3-1.5 2.21 0 4 1.79 4 4v5z"/>
        </svg>
        Continue with Fayda
      </Button>

      <div className="text-sm text-gray-600">
        <h4 className="font-medium mb-2">How it works:</h4>
        <ol className="list-decimal list-inside space-y-1">
          <li>Click the &quot;Continue with Fayda&quot; button</li>
          <li>You&apos;ll be redirected to Fayda&apos;s authentication page</li>
          <li>Sign in with your Fayda credentials</li>
          <li>You&apos;ll be redirected back to your dashboard</li>
          <li>Your Fayda account will be linked to your local account if you&apos;re already logged in</li>
        </ol>
      </div>
    </div>
  );
}

export default FaydaAuthExample;