import { Variables, ResponseBuilder } from "@fermyon/spin-sdk";
// Auth0 configuration using Spin Variables
function getAuth0Config() {
    return {
        domain: Variables.get("auth0_domain"),
        clientId: Variables.get("auth0_client_id"),
        clientSecret: Variables.get("auth0_client_secret"),
        bookingApiUrl: Variables.get("booking_api_url"),
        reviewsApiUrl: Variables.get("reviews_api_url")
    };
}
// Auth0 login handler
function handleLogin(req, res) {
    const config = getAuth0Config();
    const url = new URL(req.url);
    const redirectUri = url.searchParams.get('redirect_uri') || 'https://alberguecarrascalejo.fermyon.app/callback';
    const state = url.searchParams.get('state') || 'default';
    const authUrl = `https://${config.domain}/authorize?` +
        `response_type=code&` +
        `client_id=${config.clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=openid profile email&` +
        `state=${state}`;
    console.log('🔐 Auth0 Login redirect to:', authUrl);
    res.status(302);
    res.set({ "Location": authUrl });
    res.send();
}
// Auth0 callback handler
async function handleCallback(req, res) {
    const config = getAuth0Config();
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');
    console.log('🔐 Auth0 Callback received:', { code: !!code, error });
    if (error) {
        res.status(400);
        res.set({ "Content-Type": "application/json" });
        res.send(JSON.stringify({ error: 'Authentication failed', details: error }));
        return;
    }
    if (!code) {
        res.status(400);
        res.set({ "Content-Type": "application/json" });
        res.send(JSON.stringify({ error: 'Authorization code not provided' }));
        return;
    }
    try {
        // Exchange code for token
        const tokenResponse = await fetch(`https://${config.domain}/oauth/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                grant_type: 'authorization_code',
                client_id: config.clientId,
                client_secret: config.clientSecret,
                code: code,
                redirect_uri: 'https://alberguecarrascalejo.fermyon.app/callback'
            })
        });
        const tokens = await tokenResponse.json();
        if (!tokenResponse.ok) {
            throw new Error(tokens.error_description || 'Token exchange failed');
        }
        res.status(200);
        res.set({ "Content-Type": "application/json" });
        res.send(JSON.stringify({
            access_token: tokens.access_token,
            id_token: tokens.id_token,
            token_type: tokens.token_type,
            expires_in: tokens.expires_in
        }));
    }
    catch (error) {
        res.status(500);
        res.set({ "Content-Type": "application/json" });
        res.send(JSON.stringify({
            error: 'Token exchange failed',
            message: error.message
        }));
    }
}
// Auth0 logout handler
function handleLogout(req, res) {
    const config = getAuth0Config();
    const url = new URL(req.url);
    const returnTo = url.searchParams.get('returnTo') || 'https://alberguecarrascalejo.fermyon.app';
    const logoutUrl = `https://${config.domain}/v2/logout?` +
        `client_id=${config.clientId}&` +
        `returnTo=${encodeURIComponent(returnTo)}`;
    console.log('🔐 Auth0 Logout redirect to:', logoutUrl);
    res.status(302);
    res.set({ "Location": logoutUrl });
    res.send();
}
// JWT verification middleware
async function verifyAuth0Token(token) {
    const config = getAuth0Config();
    try {
        if (!token || !token.startsWith('eyJ')) {
            throw new Error('Invalid token format');
        }
        // Decode token payload (basic validation)
        const payload = JSON.parse(atob(token.split('.')[1]));
        // Check token expiration
        if (payload.exp && payload.exp < Date.now() / 1000) {
            throw new Error('Token expired');
        }
        // Check audience and issuer
        if (payload.aud !== config.clientId) {
            throw new Error('Invalid audience');
        }
        if (payload.iss !== `https://${config.domain}/`) {
            throw new Error('Invalid issuer');
        }
        return payload;
    }
    catch (error) {
        throw new Error(`Token verification failed: ${error.message}`);
    }
}
// Protected route middleware
async function requireAuth0(req, res) {
    const authHeader = req.headers.get("authorization");
    const token = authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.substring(7)
        : null;
    if (!token) {
        const config = getAuth0Config();
        res.status(401);
        res.set({ "Content-Type": "application/json" });
        res.send(JSON.stringify({
            error: 'Access denied',
            auth_url: `https://${config.domain}/authorize?response_type=code&client_id=${config.clientId}&redirect_uri=${encodeURIComponent('https://alberguecarrascalejo.fermyon.app/callback')}&scope=openid profile email`
        }));
        return false;
    }
    try {
        await verifyAuth0Token(token);
        return true;
    }
    catch (error) {
        const config = getAuth0Config();
        res.status(401);
        res.set({ "Content-Type": "application/json" });
        res.send(JSON.stringify({
            error: 'Invalid token',
            message: error.message,
            auth_url: `https://${config.domain}/authorize?response_type=code&client_id=${config.clientId}&redirect_uri=${encodeURIComponent('https://alberguecarrascalejo.fermyon.app/callback')}&scope=openid profile email`
        }));
        return false;
    }
}
// Main request handler
export async function handleRequest(req) {
    const url = new URL(req.url);
    const res = new ResponseBuilder();
    // Enable CORS
    res.set({
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    });
    if (req.method === 'OPTIONS') {
        res.status(200);
        res.send();
        return res.build();
    }
    // Auth0 routes
    if (url.pathname === '/login') {
        handleLogin(req, res);
        return res.build();
    }
    if (url.pathname === '/callback') {
        await handleCallback(req, res);
        return res.build();
    }
    if (url.pathname === '/logout') {
        handleLogout(req, res);
        return res.build();
    }
    // Protected admin routes
    if (url.pathname.startsWith('/booking/dashboard') || url.pathname.startsWith('/booking/admin')) {
        const isAuthenticated = await requireAuth0(req, res);
        if (!isAuthenticated) {
            return res.build();
        }
        // Continue to proxy to booking service if authenticated
    }
    // Proxy to booking service
    if (url.pathname.startsWith('/booking')) {
        const config = getAuth0Config();
        const targetUrl = `${config.bookingApiUrl}${url.pathname}${url.search}`;
        try {
            const response = await fetch(targetUrl, {
                method: req.method,
                headers: req.headers,
                body: req.method !== 'GET' && req.method !== 'HEAD' ? await req.arrayBuffer() : undefined
            });
            const body = await response.arrayBuffer();
            res.status(response.status);
            // Copy response headers
            response.headers.forEach((value, key) => {
                res.set({ [key]: value });
            });
            res.send(new Uint8Array(body));
        }
        catch (error) {
            res.status(500);
            res.set({ "Content-Type": "application/json" });
            res.send(JSON.stringify({ error: 'Booking service unavailable' }));
        }
        return res.build();
    }
    // Proxy to reviews service (public, no auth required)
    if (url.pathname.startsWith('/reviews')) {
        const config = getAuth0Config();
        const targetUrl = `${config.reviewsApiUrl}${url.pathname}${url.search}`;
        try {
            const response = await fetch(targetUrl, {
                method: req.method,
                headers: req.headers,
                body: req.method !== 'GET' && req.method !== 'HEAD' ? await req.arrayBuffer() : undefined
            });
            const body = await response.arrayBuffer();
            res.status(response.status);
            // Copy response headers
            response.headers.forEach((value, key) => {
                res.set({ [key]: value });
            });
            res.send(new Uint8Array(body));
        }
        catch (error) {
            res.status(500);
            res.set({ "Content-Type": "application/json" });
            res.send(JSON.stringify({ error: 'Reviews service unavailable' }));
        }
        return res.build();
    }
    // Health check
    if (url.pathname === '/health') {
        res.status(200);
        res.set({ "Content-Type": "application/json" });
        res.send(JSON.stringify({
            status: 'Gateway running',
            timestamp: new Date().toISOString(),
            auth0_configured: true
        }));
        return res.build();
    }
    // Default 404
    res.status(404);
    res.set({ "Content-Type": "application/json" });
    res.send(JSON.stringify({ error: 'Not found' }));
    return res.build();
}
