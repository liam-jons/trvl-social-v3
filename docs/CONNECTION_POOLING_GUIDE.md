# Connection Pooling Configuration Guide

## Overview

This guide provides complete setup and configuration instructions for Supabase Connection Pooler (PgBouncer) for the TRVL Social V3 production database.

## What is Connection Pooling?

Connection pooling reuses database connections instead of creating new ones for each request. This significantly improves performance and prevents connection exhaustion under high load.

### Benefits

- **Performance**: Reusing connections eliminates TCP handshake overhead
- **Scalability**: Support more concurrent users with fewer database connections
- **Stability**: Prevents "too many connections" errors
- **Resource Efficiency**: Lower memory usage on database server

### Supabase Connection Pooler

Supabase uses PgBouncer, a lightweight connection pooler that sits between your application and PostgreSQL database.

**Key Features**:
- Transaction pooling mode (recommended for web apps)
- Session pooling mode (for compatibility with certain features)
- Automatic connection management
- Built-in monitoring and metrics

## Configuration

### Step 1: Enable Connection Pooler

#### Via Supabase Dashboard

1. **Navigate to Project Settings**:
   - URL: https://supabase.com/dashboard/project/vhecnqaejsukulaktjob
   - Go to: Settings → Database

2. **Enable Pooler**:
   - Scroll to "Connection Pooling" section
   - Toggle "Enable Connection Pooler"
   - Wait 30-60 seconds for pooler to start

3. **Configure Pool Mode**:
   - **Transaction Mode** (Recommended): Default for most applications
   - **Session Mode**: Only if you need session-level features (temp tables, prepared statements, LISTEN/NOTIFY)

4. **Get Connection Strings**:
   - **Direct Connection** (Port 5432): For migrations and admin tasks
   - **Pooled Connection** (Port 6543): For application queries

### Step 2: Connection String Configuration

#### Production Environment Variables

Update your `.env` or hosting provider settings:

```bash
# Direct connection (for migrations and admin operations)
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-us-east-2.pooler.supabase.com:5432/postgres

# Pooled connection (for application queries) - RECOMMENDED FOR APP
DATABASE_POOLER_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-us-east-2.pooler.supabase.com:6543/postgres

# Supabase client configuration
VITE_SUPABASE_URL=https://vhecnqaejsukulaktjob.supabase.co
VITE_SUPABASE_ANON_KEY=[ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=[SERVICE_ROLE_KEY]
```

#### For TRVL Social V3

Your specific connection strings (replace [PASSWORD]):

```bash
# Direct connection (Port 5432)
DATABASE_URL=postgresql://postgres.vhecnqaejsukulaktjob:[PASSWORD]@aws-0-us-east-2.pooler.supabase.com:5432/postgres

# Pooled connection (Port 6543) - USE THIS FOR APP
DATABASE_POOLER_URL=postgresql://postgres.vhecnqaejsukulaktjob:[PASSWORD]@aws-0-us-east-2.pooler.supabase.com:6543/postgres
```

### Step 3: Application Configuration

#### Supabase Client Setup

The Supabase JS client automatically uses connection pooling when accessing the database:

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'X-Client-Info': 'trvl-social-v3',
    },
  },
})
```

**Note**: The Supabase client uses the pooler automatically via the REST API. No additional configuration needed.

#### Direct Database Access (Server-Side)

If using direct PostgreSQL connections (e.g., in serverless functions):

```typescript
// Example: Using postgres.js with pooling
import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_POOLER_URL!, {
  max: 1, // Maximum 1 connection per serverless function instance
  idle_timeout: 20,
  connect_timeout: 10,
})
```

**Important**: In serverless environments, use 1 connection per function instance to avoid exhausting the pool.

## Recommended Settings

### Production Configuration

| Setting | Recommended Value | Reason |
|---------|-------------------|--------|
| **Pool Mode** | Transaction | Best for stateless web apps |
| **Max Connections** | 15-20 | Balance concurrency vs resources |
| **Default Pool Size** | 10 | Adequate for most workloads |
| **Reserve Pool** | 5 | Emergency connections for admin |
| **Max Client Connections** | 100 | Allow burst traffic |
| **Server Idle Timeout** | 600s (10 min) | Keep connections warm |
| **Query Timeout** | 30s | Prevent runaway queries |

### Pool Mode Comparison

#### Transaction Mode (RECOMMENDED)

**How it works**: Connection returned to pool after each transaction

**Pros**:
- ✅ Highest connection efficiency
- ✅ Best for web applications
- ✅ Supports most queries
- ✅ Better performance under load

**Cons**:
- ❌ No prepared statements across transactions
- ❌ No temporary tables
- ❌ No LISTEN/NOTIFY

**Use for**:
- Web applications
- API servers
- REST endpoints
- Most CRUD operations

#### Session Mode

**How it works**: Connection tied to client for entire session

**Pros**:
- ✅ Full PostgreSQL compatibility
- ✅ Supports prepared statements
- ✅ Supports temporary tables
- ✅ Supports LISTEN/NOTIFY

**Cons**:
- ❌ Lower connection efficiency
- ❌ Higher resource usage
- ❌ Lower concurrency support

**Use for**:
- Long-running queries
- Analytics workloads
- Database maintenance
- Features requiring session state

### Connection Limits

Understand Supabase connection limits for your plan:

| Plan | Max Connections | Pooler Max |
|------|----------------|------------|
| Free | 60 | 200 |
| Pro | 200 | 200 |
| Team | 300+ | 200 |
| Enterprise | Custom | Custom |

**TRVL Social V3**: Pro plan → 200 max connections

## When to Use Which Connection

### Use Pooled Connection (Port 6543) For:

✅ Application queries (CRUD operations)
✅ API endpoints
✅ User-facing features
✅ High-concurrency workloads
✅ Short-lived queries (< 5s)

### Use Direct Connection (Port 5432) For:

✅ Database migrations
✅ Schema changes (ALTER TABLE, CREATE INDEX)
✅ Long-running analytics queries
✅ Database backups (pg_dump)
✅ Administrative operations
✅ LISTEN/NOTIFY operations

## Monitoring & Troubleshooting

### Check Connection Pool Status

#### Via Supabase Dashboard

1. Navigate to: Database → Reports
2. View "Database" tab
3. Check "Active Connections" graph
4. Monitor "Connection Pool Utilization"

**Healthy Status**:
- Active connections < 80% of max
- No "connection refused" errors
- Steady connection count (not spiky)

#### Via SQL Query

```sql
-- Check current connections
SELECT
  count(*) as total_connections,
  count(*) FILTER (WHERE state = 'active') as active,
  count(*) FILTER (WHERE state = 'idle') as idle,
  max(now() - query_start) as longest_query
FROM pg_stat_activity
WHERE datname = 'postgres';
```

#### Via PgBouncer Stats

```sql
-- Connect to pooler and check stats
SHOW POOLS;
SHOW CLIENTS;
SHOW SERVERS;
```

### Common Issues & Solutions

#### Issue 1: "Too Many Connections"

**Symptoms**:
```
FATAL: remaining connection slots are reserved for non-replication superuser connections
```

**Causes**:
- Connection leaks in application code
- Not closing connections properly
- Pool exhausted by long queries

**Solutions**:
1. **Immediate**: Increase pool size in dashboard
2. **Short-term**: Restart connection pooler
3. **Long-term**: Fix connection leaks in code

```typescript
// Bad: Connection not closed
const { data } = await supabase.from('table').select()
// ... connection left open

// Good: Supabase client handles connection lifecycle automatically
const { data, error } = await supabase.from('table').select()
// Connection returned to pool automatically
```

#### Issue 2: Slow Query Performance

**Symptoms**: Queries slower through pooler than direct connection

**Causes**:
- Query waiting for available connection
- Pool size too small
- Long queries blocking pool

**Solutions**:
1. Increase pool size
2. Optimize slow queries (add indexes)
3. Move long queries to direct connection
4. Implement query timeout

```typescript
// Set query timeout
const { data, error } = await supabase
  .from('table')
  .select()
  .abortSignal(AbortSignal.timeout(5000)) // 5 second timeout
```

#### Issue 3: Connection Timeouts

**Symptoms**: `connect ETIMEDOUT` errors

**Causes**:
- Network issues
- Pooler overloaded
- Database under heavy load

**Solutions**:
1. Implement retry logic with exponential backoff
2. Increase connection timeout
3. Check Supabase status page

```typescript
// Implement retry logic
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)))
    }
  }
  throw new Error('Max retries exceeded')
}

// Use it
const data = await withRetry(() =>
  supabase.from('table').select()
)
```

#### Issue 4: Prepared Statement Errors

**Symptoms**: `prepared statement does not exist` errors

**Cause**: Using prepared statements with Transaction mode

**Solution**: Switch to Session mode (not recommended) or avoid prepared statements

### Performance Monitoring

#### Key Metrics to Track

1. **Connection Pool Utilization**: Target < 80%
2. **Average Query Time**: Target < 100ms
3. **Connection Wait Time**: Target < 10ms
4. **Error Rate**: Target < 0.1%
5. **Connection Churn**: Steady (not spiky)

#### Set Up Alerts

Configure alerts for:
- Connection pool > 90% utilized
- Connection errors > 10/minute
- Query time > 5s sustained
- Connection refused errors

## Best Practices

### Development vs Production

#### Development (Local)
```bash
# Use direct connection for easier debugging
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.vhecnqaejsukulaktjob.supabase.co:5432/postgres
```

#### Staging
```bash
# Use pooled connection (same as production)
DATABASE_URL=postgresql://postgres.vhecnqaejsukulaktjob:[PASSWORD]@aws-0-us-east-2.pooler.supabase.com:6543/postgres
```

#### Production
```bash
# Always use pooled connection
DATABASE_URL=postgresql://postgres.vhecnqaejsukulaktjob:[PASSWORD]@aws-0-us-east-2.pooler.supabase.com:6543/postgres
```

### Connection Lifecycle

```typescript
// ✅ GOOD: Let Supabase client manage connections
async function getUserBookings(userId: string) {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('user_id', userId)

  return { data, error }
}

// ❌ BAD: Creating new client instance per request
async function getUserBookings(userId: string) {
  const client = createClient(url, key) // Don't do this!
  const { data, error } = await client
    .from('bookings')
    .select('*')
    .eq('user_id', userId)

  return { data, error }
}
```

### Serverless Functions

```typescript
// ✅ GOOD: Reuse client instance across invocations
import { supabase } from '../lib/supabase'

export default async function handler(req, res) {
  const { data } = await supabase.from('table').select()
  res.json(data)
}

// ❌ BAD: Creating client in every invocation
export default async function handler(req, res) {
  const supabase = createClient(url, key) // Creates new connections!
  const { data } = await supabase.from('table').select()
  res.json(data)
}
```

### Graceful Shutdown

```typescript
// For long-running processes, close connections on shutdown
process.on('SIGTERM', async () => {
  console.log('Closing database connections...')
  // Supabase client doesn't require explicit closing
  // But if using raw postgres.js:
  // await sql.end({ timeout: 5 })
  process.exit(0)
})
```

## Load Testing

### Test Connection Pool Under Load

```bash
# Install k6 for load testing
brew install k6

# Create load test script
cat > load-test.js << 'EOF'
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '1m', target: 50 },  // Ramp up to 50 users
    { duration: '3m', target: 50 },  // Stay at 50 users
    { duration: '1m', target: 100 }, // Ramp up to 100 users
    { duration: '3m', target: 100 }, // Stay at 100 users
    { duration: '1m', target: 0 },   // Ramp down
  ],
};

export default function() {
  const res = http.get('https://your-app.com/api/adventures');

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
EOF

# Run load test
k6 run load-test.js
```

**Monitor during test**:
- Connection pool utilization
- Query response times
- Error rates
- Database CPU/memory usage

## Migration Guide

### Migrating from Direct to Pooled Connection

1. **Update Environment Variables**:
```bash
# Old (direct)
DATABASE_URL=postgresql://...@db.xxx.supabase.co:5432/postgres

# New (pooled)
DATABASE_URL=postgresql://...@aws-0-us-east-2.pooler.supabase.com:6543/postgres
```

2. **Test in Staging**:
   - Deploy to staging with pooled connection
   - Run full test suite
   - Monitor for errors
   - Load test if possible

3. **Deploy to Production**:
   - Update production environment variables
   - Deploy application
   - Monitor connection pool metrics
   - Be ready to rollback if issues

4. **Monitor for 48 Hours**:
   - Watch connection pool utilization
   - Check for connection errors
   - Verify query performance
   - Monitor application errors

## Documentation & Resources

### Supabase Documentation
- [Connection Pooling Guide](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [PgBouncer Configuration](https://supabase.com/docs/guides/database/pgbouncer)

### PgBouncer Documentation
- [Official Docs](https://www.pgbouncer.org/usage.html)
- [Configuration Parameters](https://www.pgbouncer.org/config.html)

### Related Documentation
- [MIGRATION_PLAN.md](../MIGRATION_PLAN.md) - Overall migration strategy
- [INDEX_OPTIMIZATION_STRATEGY.md](INDEX_OPTIMIZATION_STRATEGY.md) - Query optimization
- [DEPLOYMENT.md](../DEPLOYMENT.md) - Production deployment checklist

## Verification Checklist

### Pre-Production
- [ ] Connection pooler enabled in Supabase Dashboard
- [ ] Pool mode set to "Transaction"
- [ ] Connection strings configured in environment
- [ ] Application tested with pooled connection
- [ ] Load testing completed
- [ ] Monitoring configured

### Post-Deployment
- [ ] No connection errors in logs
- [ ] Pool utilization < 80%
- [ ] Query performance acceptable
- [ ] Application functioning normally
- [ ] Monitoring dashboards showing healthy metrics

---

**Document Version**: 1.0
**Last Updated**: October 1, 2025
**Next Review**: November 1, 2025
**Contact**: Database Administrator
