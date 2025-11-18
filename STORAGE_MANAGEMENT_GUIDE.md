# Storage Management Guide

## Overview

The NeuReed admin panel now includes comprehensive storage management capabilities for both PostgreSQL and Redis. This feature allows administrators to monitor storage usage, view detailed statistics, and perform maintenance operations directly from the web interface.

## Features

### PostgreSQL Storage Management

#### Information Displayed

1. **Database Overview**
   - Total database size
   - Cache hit ratio (indicates query performance)
   - Active database connections
   - Total connections vs. max connections

2. **Table Statistics**
   - Table sizes (top 10 largest tables)
   - Total size (table + indexes)
   - Table size (data only)
   - Index size
   - Row count

3. **Connection Information**
   - Maximum allowed connections
   - Current active connections
   - Idle connections

4. **Index Usage Statistics**
   - Top 20 most-used indexes
   - Index scan counts
   - Tuple reads and fetches

5. **Vacuum Statistics**
   - Last vacuum timestamp
   - Last auto-vacuum timestamp
   - Last analyze timestamp
   - Last auto-analyze timestamp

#### Maintenance Operations

1. **VACUUM**
   - Reclaims storage occupied by dead tuples
   - Helps prevent transaction ID wraparound
   - Can be run on all tables or a specific table
   - **When to use**: Regularly, especially after large DELETE or UPDATE operations

2. **ANALYZE**
   - Updates statistics used by the query planner
   - Improves query performance by helping the planner choose optimal execution plans
   - **When to use**: After significant data changes or bulk inserts

3. **VACUUM ANALYZE**
   - Combines both VACUUM and ANALYZE operations
   - Most commonly used maintenance command
   - **When to use**: As part of regular maintenance schedule

4. **REINDEX**
   - Rebuilds indexes to remove bloat and improve performance
   - Can be resource-intensive
   - **When to use**: When indexes have become bloated or corrupted

### Redis Storage Management

#### Information Displayed

1. **Memory Overview**
   - Used memory (current)
   - Used memory (human-readable format)
   - Peak memory usage
   - Memory fragmentation ratio
   - Max memory limit (if configured)

2. **Cache Performance**
   - Hit rate percentage
   - Total keyspace hits
   - Total keyspace misses
   - Evicted keys count
   - Expired keys count

3. **Operations Statistics**
   - Total commands processed
   - Operations per second (instantaneous)
   - Total connections received

4. **Keyspace Information**
   - Total number of keys
   - Keys with expiration set
   - Average TTL
   - Database index information

5. **Client Information**
   - Connected clients
   - Blocked clients

#### Maintenance Operations

1. **SAVE**
   - Performs a synchronous save of the dataset to disk
   - Blocks all clients until complete
   - **When to use**: Before critical operations or maintenance windows
   - **Warning**: Can cause brief service interruption

2. **BGSAVE**
   - Performs a background save of the dataset to disk
   - Non-blocking operation
   - **When to use**: Regular backups without service interruption
   - **Recommended**: Use this instead of SAVE for production systems

3. **BGREWRITEAOF**
   - Rewrites the Append-Only File (AOF) to optimize it
   - Reduces AOF file size
   - **When to use**: When AOF file has grown large
   - **Note**: Only relevant if AOF persistence is enabled

4. **FLUSHDB**
   - Deletes all keys in the current database
   - **Warning**: Destructive operation - requires confirmation
   - **When to use**: Development/testing environments only

5. **FLUSHALL**
   - Deletes all keys in all databases
   - **Warning**: Highly destructive - requires confirmation
   - **When to use**: Complete reset scenarios only

## API Endpoints

### PostgreSQL Endpoints

#### Get Storage Statistics
```
GET /api/admin/storage/postgres
```

Returns comprehensive PostgreSQL storage information including database size, table sizes, connection info, cache hit ratio, index usage, and vacuum statistics.

**Response Example:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "databaseSize": "24 MB",
      "tables": [...],
      "connectionInfo": {
        "maxConnections": 100,
        "currentConnections": 5,
        "activeConnections": 2,
        "idleConnections": 3
      },
      "cacheHitRatio": 0.99,
      "indexUsage": [...],
      "vacuumStats": [...]
    }
  }
}
```

#### Run Maintenance Operation
```
POST /api/admin/storage/postgres/maintenance
Content-Type: application/json

{
  "operation": "vacuum_analyze",
  "table": "Article" // optional, omit to run on all tables
}
```

**Operations:**
- `vacuum` - Run VACUUM
- `analyze` - Run ANALYZE
- `vacuum_analyze` - Run VACUUM ANALYZE
- `reindex` - Rebuild indexes

**Response Example:**
```json
{
  "success": true,
  "data": {
    "message": "VACUUM ANALYZE completed on all tables",
    "duration": "1234ms"
  }
}
```

### Redis Endpoints

#### Get Storage Statistics
```
GET /api/admin/storage/redis
```

Returns comprehensive Redis storage information including memory usage, cache performance, operations stats, and keyspace information.

**Response Example:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "connected": true,
      "enabled": true,
      "version": "7.0.0",
      "memory": {
        "usedMemoryHuman": "1.27M",
        "usedMemoryPeakHuman": "2.15M",
        "memoryFragmentationRatio": 1.05
      },
      "stats": {
        "hitRate": 0.95,
        "keyspaceHits": 1234,
        "keyspaceMisses": 56
      },
      "keyspace": [...],
      "clients": {
        "connectedClients": 3
      }
    }
  }
}
```

#### Run Maintenance Operation
```
POST /api/admin/storage/redis/maintenance
Content-Type: application/json

{
  "operation": "bgsave"
}
```

**Operations:**
- `save` - Synchronous save
- `bgsave` - Background save
- `bgrewriteaof` - Rewrite AOF file
- `flushdb` - Delete all keys in current DB (requires confirmation)
- `flushall` - Delete all keys in all DBs (requires confirmation)

**Response Example:**
```json
{
  "success": true,
  "data": {
    "message": "Background save initiated",
    "duration": "15ms"
  }
}
```

## Accessing the Storage Management Interface

1. Navigate to the admin dashboard: `/admin/dashboard`
2. Click on the "Storage" tab in the left sidebar
3. View PostgreSQL and Redis statistics
4. Use the maintenance operation buttons to perform tasks

## Best Practices

### PostgreSQL Maintenance

1. **Regular VACUUM ANALYZE**: Run weekly or after significant data changes
2. **Monitor Cache Hit Ratio**: Should be > 0.95 (95%) for optimal performance
3. **Watch Connection Counts**: Ensure you're not hitting max_connections limit
4. **Index Maintenance**: REINDEX tables with low index scan counts or high bloat
5. **Table Size Monitoring**: Identify growing tables and plan for scaling

### Redis Maintenance

1. **Monitor Memory Usage**: Keep usage below 80% of max_memory
2. **Check Hit Rate**: Should be > 0.90 (90%) for effective caching
3. **Regular BGSAVE**: Schedule background saves for data persistence
4. **Memory Fragmentation**: Ratio should be close to 1.0; restart Redis if > 1.5
5. **Eviction Policy**: Configure appropriate eviction policy based on use case

### Performance Indicators

#### PostgreSQL Warning Signs
- Cache hit ratio < 0.90 (90%)
- High number of idle connections
- Large table sizes without recent vacuum
- Indexes with zero scans (unused indexes)

#### Redis Warning Signs
- Hit rate < 0.80 (80%)
- Memory fragmentation ratio > 1.5
- High number of evicted keys
- Memory usage consistently near max_memory

## Troubleshooting

### PostgreSQL Issues

**Problem**: Low cache hit ratio
- **Solution**: Increase `shared_buffers` in PostgreSQL configuration
- **Solution**: Run ANALYZE to update statistics

**Problem**: High connection count
- **Solution**: Implement connection pooling (e.g., PgBouncer)
- **Solution**: Increase `max_connections` if resources allow

**Problem**: Large table sizes
- **Solution**: Run VACUUM to reclaim dead tuple space
- **Solution**: Consider partitioning large tables

### Redis Issues

**Problem**: High memory usage
- **Solution**: Configure `maxmemory` and eviction policy
- **Solution**: Review key expiration strategies
- **Solution**: Clear unused keys

**Problem**: Low hit rate
- **Solution**: Review caching strategy and TTL values
- **Solution**: Increase cache size if possible
- **Solution**: Implement cache warming for frequently accessed data

**Problem**: High memory fragmentation
- **Solution**: Restart Redis during low-traffic period
- **Solution**: Enable `activedefrag` in Redis configuration

## Security Considerations

1. **Access Control**: Storage management endpoints should only be accessible to administrators
2. **Destructive Operations**: FLUSHDB and FLUSHALL require confirmation dialogs
3. **Monitoring**: Log all maintenance operations for audit purposes
4. **Backup**: Always ensure backups are current before running maintenance operations

## Automation

Consider automating regular maintenance tasks:

### PostgreSQL
```bash
# Example cron job for weekly VACUUM ANALYZE
0 2 * * 0 curl -X POST http://localhost:3000/api/admin/storage/postgres/maintenance \
  -H "Content-Type: application/json" \
  -d '{"operation":"vacuum_analyze"}'
```

### Redis
```bash
# Example cron job for daily BGSAVE
0 3 * * * curl -X POST http://localhost:3000/api/admin/storage/redis/maintenance \
  -H "Content-Type: application/json" \
  -d '{"operation":"bgsave"}'
```

## Future Enhancements

Potential improvements for future versions:

1. **Scheduled Maintenance**: Configure automatic maintenance schedules via UI
2. **Alerting**: Email/webhook notifications for storage issues
3. **Historical Trends**: Graph storage usage over time
4. **Query Analysis**: PostgreSQL slow query log integration
5. **Redis Key Analysis**: Identify largest keys and memory usage by pattern
6. **Backup Management**: Integrated backup and restore functionality
7. **Multi-Database Support**: Manage multiple PostgreSQL/Redis instances

## Related Documentation

- [PostgreSQL VACUUM Documentation](https://www.postgresql.org/docs/current/sql-vacuum.html)
- [Redis Persistence Documentation](https://redis.io/docs/management/persistence/)
- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Redis Memory Optimization](https://redis.io/docs/management/optimization/memory-optimization/)

