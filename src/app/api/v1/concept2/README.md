# Concept2 OAuth Integration

This directory contains the OAuth 2.0 implementation for Concept2 Logbook integration.

## Setup

1. Register your application at https://log.concept2.com/developers to get:
   - Client ID
   - Client Secret

2. Configure environment variables in `.env.local`:
   ```
   CONCEPT2_CLIENT_ID=your_client_id
   CONCEPT2_CLIENT_SECRET=your_client_secret
   CONCEPT2_CALLBACK_URL=http://localhost:3000/api/v1/concept2/callback
   ```

3. In production, update `CONCEPT2_CALLBACK_URL` to your production domain.

## API Endpoints

### Authentication Flow

#### 1. Initiate OAuth Flow
```
GET /api/v1/concept2/auth?scope=results:read,user:read
```

Redirects the user to Concept2's authorization page. The user will be asked to grant permission to your application.

**Query Parameters:**
- `scope` (optional): Comma-separated list of OAuth scopes. Default: `results:read,user:read`
  - Available scopes: `results:read`, `user:read`, `results:write`

#### 2. OAuth Callback
```
GET /api/v1/concept2/callback
```

Handles the OAuth callback from Concept2. This endpoint:
- Exchanges the authorization code for access and refresh tokens
- Stores tokens securely in HTTP-only cookies
- Redirects back to the home page

**Success:** Redirects to `/`  
**Error:** Redirects to `/?oauth_error=<error>&oauth_error_description=<description>`

#### 3. Refresh Token
```
POST /api/v1/concept2/refresh
```

Refreshes the access token using the stored refresh token. This is automatically called by the results endpoint when the token is expired.

**Response:**
```json
{
  "success": true
}
```

### Data Access

#### 4. Fetch Results
```
GET /api/v1/concept2/results
```

Fetches workout results from Concept2. This endpoint:
- Automatically refreshes the token if expired
- Forwards query parameters to Concept2 API
- Returns results in JSON format

**Query Parameters:** (All optional, forwarded to Concept2 API)
- Common parameters include pagination, date ranges, etc.

**Success Response:**
```json
{
  "data": [...],
  // Additional fields from Concept2 API
}
```

**Error Response:**
```json
{
  "error": "Authentication required",
  "auth_url": "/api/v1/concept2/auth"
}
```

## Token Management

- **Access Token:** Stored in HTTP-only cookie, expires in 1 hour
- **Refresh Token:** Stored in HTTP-only cookie, expires in 90 days
- **Token Expiry:** Tracked separately to enable automatic refresh

The results endpoint automatically refreshes expired tokens before making API calls.

## Security

- All tokens are stored in HTTP-only cookies to prevent XSS attacks
- Cookies are marked as `secure` in production
- Client credentials are never exposed to the client
- Token refresh is handled server-side

## Error Handling

OAuth errors are redirected to the home page with query parameters:
- `oauth_error`: Error code from Concept2
- `oauth_error_description`: Human-readable error description

API errors return appropriate HTTP status codes:
- `401`: Authentication required (redirect user to `/api/v1/concept2/auth`)
- `500`: Server error

## Usage Example

```typescript
// Initiate OAuth flow
<a href="/api/v1/concept2/auth">Connect Concept2</a>

// Fetch results
const response = await fetch('/api/v1/concept2/results');
if (response.status === 401) {
  // Redirect user to authenticate
  window.location.href = '/api/v1/concept2/auth';
} else {
  const data = await response.json();
  console.log(data);
}
```

## Scopes

- `results:read`: Read workout results
- `user:read`: Read user profile information
- `results:write`: Write workout results

Default scope is `results:read,user:read`. You can customize scopes by passing them as a query parameter to the auth endpoint.
