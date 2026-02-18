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

## Testing

The server includes a pre-configured test client for development:

- `client_id`: test-client
- `client_secret`: test-secret
- `redirect_uri`: http://localhost:3001/callback
