// Use built-in fetch (Node.js 18+) or add node-fetch if needed
import fs from 'fs';
import path from 'path';

// Configuration
const BASE_URL = 'http://localhost:3000';
const AUTH_ENDPOINT = `${BASE_URL}/api/auth`;

async function signInWithHttp(email: string, password: string) {
    try {
        console.log('🔐 Signing in via HTTP endpoint...');
        
        const response = await fetch(`${AUTH_ENDPOINT}/sign-in/email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                password: password,
            }),
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Sign-in failed:', errorText);
            return null;
        }

        // Extract cookies from the response
        const setCookieHeaders: string[] = [];
        response.headers.forEach((value, name) => {
            if (name.toLowerCase() === 'set-cookie') {
                setCookieHeaders.push(value);
            }
        });
        console.log('🍪 Cookies received:', setCookieHeaders);

        const responseData = await response.json();
        console.log('📦 Response data:', responseData);

        // Find the session cookie
        let sessionCookie = null;
        for (const cookie of setCookieHeaders) {
            if (cookie.includes('better-auth') || cookie.includes('session')) {
                // Extract just the cookie name=value part
                sessionCookie = cookie.split(';')[0];
                break;
            }
        }

        if (sessionCookie) {
            // Save the session cookie
            const authFile = path.join(__dirname, 'http-auth-session.json');
            const sessionData = {
                cookie: sessionCookie,
                fullCookies: setCookieHeaders,
                responseData: responseData,
                timestamp: new Date().toISOString(),
                email: email
            };
            
            fs.writeFileSync(authFile, JSON.stringify(sessionData, null, 2));
            console.log(`✅ Session saved to: ${authFile}`);
            console.log(`🔑 Session cookie: ${sessionCookie}`);
            
            return sessionData;
        } else {
            console.log('⚠️ No session cookie found in response');
            return responseData;
        }

    } catch (error) {
        console.error('❌ HTTP sign-in error:', error);
        return null;
    }
}

async function testAuthenticatedRequest(cookie: string) {
    try {
        console.log('\n🧪 Testing authenticated API call...');
        
        const response = await fetch(`${BASE_URL}/api/vehicles`, {
            method: 'GET',
            headers: {
                'Cookie': cookie,
                'Content-Type': 'application/json',
            },
        });

        console.log('API Response status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Authenticated request successful!');
            console.log('📊 Data received:', Array.isArray(data) ? `${data.length} items` : data);
            return true;
        } else {
            const errorText = await response.text();
            console.log('❌ Authenticated request failed:', errorText);
            return false;
        }

    } catch (error) {
        console.error('❌ Authenticated request error:', error);
        return false;
    }
}

async function loadSavedHttpSession() {
    try {
        const authFile = path.join(__dirname, 'http-auth-session.json');
        if (fs.existsSync(authFile)) {
            const sessionData = JSON.parse(fs.readFileSync(authFile, 'utf-8'));
            console.log(`📂 Loaded HTTP session for ${sessionData.email} from ${sessionData.timestamp}`);
            return sessionData;
        }
    } catch (error) {
        console.error('Error loading HTTP session:', error);
    }
    return null;
}

async function main() {
    console.log('🚀 Testing Better Auth HTTP endpoints...\n');

    // Try to load existing session first
    let sessionData = await loadSavedHttpSession();
    
    if (!sessionData) {
        // Sign in to get a new session
        sessionData = await signInWithHttp('robert.sterling@fleetmanager.com', 'Owner123!');
    }

    if (sessionData && sessionData.cookie) {
        // Test the authenticated request
        const success = await testAuthenticatedRequest(sessionData.cookie);
        
        if (success) {
            console.log('\n🎉 Authentication working! Use this curl command:');
            console.log(`curl -H "Cookie: ${sessionData.cookie}" ${BASE_URL}/api/vehicles`);
        }
    } else {
        console.log('❌ Could not establish authenticated session');
    }
}

// Export functions for use in other scripts
export { signInWithHttp, testAuthenticatedRequest, loadSavedHttpSession };

// Run if executed directly
if (require.main === module) {
    main().catch(console.error);
}
