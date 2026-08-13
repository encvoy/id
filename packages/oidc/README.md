# OIDC Server

OpenID Connect Provider server based on oidc-provider v9.

## Installation

```bash
npm install
```

## Database Setup

Generate Prisma client before running the server:

```bash
npx prisma generate
```

## Running the Server

### Development mode

```bash
npm run dev
```

### Production mode

```bash
npm start
```

## Configuration

The server runs on port 3000 by default. You can change this using the `OIDC_PORT` environment variable.

### Environment Variables

- `OIDC_PORT` - Server port (default: 3000)
- `DATABASE_URL` - Database connection string
- `REDIS_URL` - Redis connection string for session storage
- `DOMAIN` - Base domain for the OIDC server

## Endpoints

- **Discovery**: `/.well-known/openid-configuration`
- **Authorization**: `/auth`
- **Token**: `/token`
- **UserInfo**: `/me`
- **Introspection**: `/token/introspection`
- **Revocation**: `/token/revocation`
- **Health Check**: `/health`

## Features

- OpenID Connect 1.0 compliant
- OAuth 2.0 authorization server
- Support for multiple grant types:
  - Authorization Code
  - Refresh Token
  - Client Credentials
- PKCE (Proof Key for Code Exchange) support
- JWT and reference tokens
- Session management
- Client registration and management
- Multi-factor authentication support

## Development

### Database Migrations

Run database migrations:

```bash
npx prisma migrate dev
```

### Reset Database

Reset database to initial state:

```bash
npx prisma migrate reset
```

On the next OIDC startup, the server compares the database installation
fingerprint with its Redis marker and removes stale ID/OIDC authorization
state before becoming ready. A normal restart with the same database keeps
sessions intact, so a separate Redis flush is not required. Redis ACLs must
allow `SCAN`, `EVAL`, `UNLINK`, and `PUBLISH` for this synchronization.

The first startup after upgrading from a version without the marker performs
a one-time cleanup and signs out existing sessions.

## Testing

The server includes a pre-configured test client for development:

- `client_id`: test-client
- `client_secret`: test-secret
- `redirect_uri`: http://localhost:3001/callback
