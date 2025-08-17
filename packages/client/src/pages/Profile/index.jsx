import React from 'react';
import { Card } from '@components/Common/UI/Card';
import { Button } from '@components/Common/UI/Buttonutton';
import { useAuth } from '@contexts/AuthContext';

export default function Profile() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Profile</h2>
        <p className="text-muted-foreground">
          Manage your personal information and preferences.
        </p>
      </div>

      <div className="grid gap-6">
        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center">
              <span className="text-2xl font-semibold text-slate-600">
                {user?.name?.[0] || 'U'}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-medium">{user?.name || 'User'}</h3>
              <p className="text-sm text-muted-foreground">{user?.email || 'No email set'}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Personal Information</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Full Name</label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                placeholder="Enter your full name"
                value={user?.name || ''}
                readOnly
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <input
                type="email"
                className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                placeholder="Enter your email"
                value={user?.email || ''}
                readOnly
              />
            </div>
            <Button variant="outline">Update Information</Button>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Preferences</h3>
          <div className="space-y-4">
            {/* Preferences content will go here */}
            <p className="text-muted-foreground">Preferences settings coming soon...</p>
          </div>
        </Card>
      </div>
    </div>
  );
} 