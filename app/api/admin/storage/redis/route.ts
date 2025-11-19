/**
 * Redis Storage Information API
 * GET /api/admin/storage/redis - Get Redis storage stats and health
 */

import { NextRequest } from "next/server";
import { getRedisClient, getRedisStatus } from "@/lib/cache/redis-client";
import { apiResponse, apiError } from "@/lib/api-response";

interface RedisStats {
  connected: boolean;
  enabled: boolean;
  version: string | null;
  uptime: number | null;
  memory: {
    usedMemory: string | null;
    usedMemoryHuman: string | null;
    usedMemoryPeak: string | null;
    usedMemoryPeakHuman: string | null;
    maxMemory: string | null;
    maxMemoryHuman: string | null;
    memoryFragmentationRatio: number | null;
  };
  stats: {
    totalConnectionsReceived: number | null;
    totalCommandsProcessed: number | null;
    instantaneousOpsPerSec: number | null;
    keyspaceHits: number | null;
    keyspaceMisses: number | null;
    hitRate: number | null;
    evictedKeys: number | null;
    expiredKeys: number | null;
  };
  keyspace: {
    dbIndex: number;
    keys: number;
    expires: number;
    avgTtl: number;
  }[];
  clients: {
    connectedClients: number | null;
    blockedClients: number | null;
  };
}

function parseRedisInfo(info: string): Record<string, string> {
  const lines = info.split('\r\n');
  const result: Record<string, string> = {};
  
  for (const line of lines) {
    if (line && !line.startsWith('#')) {
      const [key, value] = line.split(':');
      if (key && value) {
        result[key] = value;
      }
    }
  }
  
  return result;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export async function GET(req: NextRequest) {
  try {
    const status = getRedisStatus();
    
    if (!status.enabled) {
      return apiResponse({
        stats: {
          connected: false,
          enabled: false,
          version: null,
          uptime: null,
          memory: {
            usedMemory: null,
            usedMemoryHuman: null,
            usedMemoryPeak: null,
            usedMemoryPeakHuman: null,
            maxMemory: null,
            maxMemoryHuman: null,
            memoryFragmentationRatio: null,
          },
          stats: {
            totalConnectionsReceived: null,
            totalCommandsProcessed: null,
            instantaneousOpsPerSec: null,
            keyspaceHits: null,
            keyspaceMisses: null,
            hitRate: null,
            evictedKeys: null,
            expiredKeys: null,
          },
          keyspace: [],
          clients: {
            connectedClients: null,
            blockedClients: null,
          },
        } as RedisStats,
      });
    }

    const client = getRedisClient();
    if (!client || !status.connected) {
      return apiResponse({
        stats: {
          connected: false,
          enabled: true,
          version: null,
          uptime: null,
          memory: {
            usedMemory: null,
            usedMemoryHuman: null,
            usedMemoryPeak: null,
            usedMemoryPeakHuman: null,
            maxMemory: null,
            maxMemoryHuman: null,
            memoryFragmentationRatio: null,
          },
          stats: {
            totalConnectionsReceived: null,
            totalCommandsProcessed: null,
            instantaneousOpsPerSec: null,
            keyspaceHits: null,
            keyspaceMisses: null,
            hitRate: null,
            evictedKeys: null,
            expiredKeys: null,
          },
          keyspace: [],
          clients: {
            connectedClients: null,
            blockedClients: null,
          },
        } as RedisStats,
      });
    }

    // Get Redis INFO
    const [serverInfo, memoryInfo, statsInfo, clientsInfo, keyspaceInfo] = await Promise.all([
      client.info('server'),
      client.info('memory'),
      client.info('stats'),
      client.info('clients'),
      client.info('keyspace'),
    ]);

    const server = parseRedisInfo(serverInfo);
    const memory = parseRedisInfo(memoryInfo);
    const stats = parseRedisInfo(statsInfo);
    const clients = parseRedisInfo(clientsInfo);
    const keyspace = parseRedisInfo(keyspaceInfo);

    // Parse keyspace info
    const keyspaceData: RedisStats['keyspace'] = [];
    for (const [key, value] of Object.entries(keyspace)) {
      if (key.startsWith('db')) {
        const dbIndex = parseInt(key.substring(2));
        const parts = value.split(',');
        const keysMatch = parts[0]?.match(/keys=(\d+)/);
        const expiresMatch = parts[1]?.match(/expires=(\d+)/);
        const avgTtlMatch = parts[2]?.match(/avg_ttl=(\d+)/);
        
        keyspaceData.push({
          dbIndex,
          keys: keysMatch ? parseInt(keysMatch[1]) : 0,
          expires: expiresMatch ? parseInt(expiresMatch[1]) : 0,
          avgTtl: avgTtlMatch ? parseInt(avgTtlMatch[1]) : 0,
        });
      }
    }

    const keyspaceHits = parseInt(stats.keyspace_hits || '0');
    const keyspaceMisses = parseInt(stats.keyspace_misses || '0');
    const totalKeyspaceOps = keyspaceHits + keyspaceMisses;
    const hitRate = totalKeyspaceOps > 0 ? keyspaceHits / totalKeyspaceOps : 0;

    const redisStats: RedisStats = {
      connected: true,
      enabled: true,
      version: server.redis_version || null,
      uptime: parseInt(server.uptime_in_seconds || '0'),
      memory: {
        usedMemory: memory.used_memory || null,
        usedMemoryHuman: memory.used_memory_human || null,
        usedMemoryPeak: memory.used_memory_peak || null,
        usedMemoryPeakHuman: memory.used_memory_peak_human || null,
        maxMemory: memory.maxmemory || null,
        maxMemoryHuman: memory.maxmemory_human || null,
        memoryFragmentationRatio: parseFloat(memory.mem_fragmentation_ratio || '0'),
      },
      stats: {
        totalConnectionsReceived: parseInt(stats.total_connections_received || '0'),
        totalCommandsProcessed: parseInt(stats.total_commands_processed || '0'),
        instantaneousOpsPerSec: parseInt(stats.instantaneous_ops_per_sec || '0'),
        keyspaceHits,
        keyspaceMisses,
        hitRate,
        evictedKeys: parseInt(stats.evicted_keys || '0'),
        expiredKeys: parseInt(stats.expired_keys || '0'),
      },
      keyspace: keyspaceData,
      clients: {
        connectedClients: parseInt(clients.connected_clients || '0'),
        blockedClients: parseInt(clients.blocked_clients || '0'),
      },
    };

    return apiResponse({ stats: redisStats });
  } catch (error) {
    console.error("Failed to get Redis stats:", error);
    return apiError(
      error instanceof Error ? error.message : "Failed to retrieve Redis statistics",
      500
    );
  }
}

