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
   INTEGRATION_TOKEN_ENCRYPTION_KEY=$(openssl rand -base64 32)
   ```

3. In production, update `CONCEPT2_CALLBACK_URL` to your production domain.

## API Endpoints

### Authentication Flow

#### 1. Initiate OAuth Flow
```
GET /api/v1/concept2/authorize?scope=results:read,user:read
```

Redirects the user to Concept2's authorization page.

**Query Parameters:**
- `scope` (optional): Comma-separated list of OAuth scopes. Default: `results:read,user:read`
  - Available scopes: `results:read`, `user:read`, `results:write`

#### 2. OAuth Callback
```
GET /api/v1/concept2/callback
```

Handles the OAuth callback from Concept2. This endpoint:
- Exchanges the authorization code for access and refresh tokens
- Fetches the Concept2 user profile
- Persists encrypted tokens + user id to the `athlete` table via the `connectConcept2` tRPC command
- Redirects back to `/settings/apps`

**Success:** Redirects to `/settings/apps`
**Error:** Redirects to `/settings/apps?oauth_error=<error>&oauth_error_description=<description>`

## Token Management

- Access and refresh tokens are AES-256-GCM encrypted with `INTEGRATION_TOKEN_ENCRYPTION_KEY` and stored on the `athlete` row (`concept2AccessToken`, `concept2RefreshToken`, `concept2TokenExpiresAt`).
- Refresh happens server-side inside `getConcept2AccessToken` (1-hour buffer); the `athlete` row is rewritten with new ciphertext when a refresh succeeds.
- Disconnecting nulls all `concept2*` columns.

## Security

- Tokens are never persisted in cookies — they live encrypted in the database.
- The encryption key must be a base64-encoded 32-byte value (`openssl rand -base64 32`); rotating it invalidates all existing tokens (users must reconnect).
- Client credentials are only used server-side.

## Scopes

- `results:read`: Read workout results
- `user:read`: Read user profile information
- `results:write`: Write workout results

Default scope is `results:read,user:read`. You can customize scopes by passing them as a query parameter to the auth endpoint.
