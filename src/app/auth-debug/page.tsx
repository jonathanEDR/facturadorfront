'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';

export default function AuthDebugPage() {
  const { isSignedIn, userId, isLoaded: authLoaded } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>🔍 Debug de Autenticación Clerk</CardTitle>
          <CardDescription>Estado actual de la autenticación</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            
            {/* Estado de Auth */}
            <div className="p-4 border rounded">
              <h3 className="font-semibold mb-2">Auth State</h3>
              <div className="text-sm space-y-1">
                <p><strong>isLoaded:</strong> {authLoaded ? '✅' : '❌'}</p>
                <p><strong>isSignedIn:</strong> {isSignedIn ? '✅' : '❌'}</p>
                <p><strong>userId:</strong> {userId || 'null'}</p>
              </div>
            </div>

            {/* Estado de User */}
            <div className="p-4 border rounded">
              <h3 className="font-semibold mb-2">User State</h3>
              <div className="text-sm space-y-1">
                <p><strong>User Loaded:</strong> {userLoaded ? '✅' : '❌'}</p>
                <p><strong>User ID:</strong> {user?.id || 'null'}</p>
                <p><strong>Email:</strong> {user?.emailAddresses?.[0]?.emailAddress || 'null'}</p>
                <p><strong>First Name:</strong> {user?.firstName || 'null'}</p>
              </div>
            </div>

            {/* Variables de Entorno */}
            <div className="p-4 border rounded">
              <h3 className="font-semibold mb-2">Environment</h3>
              <div className="text-sm space-y-1">
                <p><strong>Publishable Key:</strong> {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? '✅ Set' : '❌ Missing'}</p>
                <p><strong>Key Prefix:</strong> {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.substring(0, 20)}...</p>
              </div>
            </div>

            {/* Debugging Info */}
            <div className="p-4 border rounded">
              <h3 className="font-semibold mb-2">Debug Info</h3>
              <div className="text-sm space-y-1">
                <p><strong>Timestamp:</strong> {typeof window !== 'undefined' ? new Date().toISOString() : 'Server rendering'}</p>
                <p><strong>User Agent:</strong> {typeof window !== 'undefined' ? navigator.userAgent.substring(0, 50) + '...' : 'Server rendering'}</p>
              </div>
            </div>
          </div>

          {/* JSON completo */}
          <div className="mt-6">
            <h3 className="font-semibold mb-2">Complete Auth Object:</h3>
            <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-40">
              {JSON.stringify({ isSignedIn, userId, authLoaded, userLoaded }, null, 2)}
            </pre>
          </div>

          {/* JSON Usuario */}
          <div>
            <h3 className="font-semibold mb-2">Complete User Object:</h3>
            <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-40">
              {JSON.stringify(user ? {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.emailAddresses?.[0]?.emailAddress,
                createdAt: user.createdAt
              } : null, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
