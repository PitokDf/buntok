# Queue Driver Capability Matrix

This document describes the delivery guarantees and capabilities of each queue driver in `@buntok/core`.

## Capability Summary

| Feature | Memory | Redis (ioredis) | Bun Redis | BullMQ | RabbitMQ |
|---------|--------|-----------------|-----------|--------|----------|
| **Durability** | process-local | persistent | persistent | persistent | persistent |
| **Delivery** | best-effort | at-least-once | at-least-once | at-least-once | at-least-once |
| **Acknowledgment** | none | driver | driver | driver | driver |
| **Crash Recovery** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Dead Letter** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Priority** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Delay** | ✅ | ✅ | ✅ | ✅ | ✅ (via retry) |
| **Pause/Resume** | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Drain** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Close** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Ordering** | FIFO (by priority) | FIFO (by score) | FIFO (by score) | FIFO (by priority) | FIFO |

## Driver Details

### Memory Queue

- **Use case:** Development, testing, single-process apps.
- **Durability:** Jobs are lost on process crash.
- **Delivery:** Best-effort - no acknowledgment mechanism.
- **Crash recovery:** Not supported. Jobs in flight are lost.
- **Scope:** Process-local. Not shared across instances.

### Redis Queue (ioredis)

- **Use case:** Production workloads requiring persistence.
- **Durability:** Jobs persist in Redis sorted sets.
- **Delivery:** At-least-once. Failed jobs are retried with configurable backoff.
- **Crash recovery:** Jobs in the `processing` set are NOT automatically reclaimed. If a worker crashes mid-processing, those jobs remain in the processing set until manual cleanup or process restart.
- **Acknowledgment:** Implicit via set membership (no explicit ack/nack).
- **Dead letter:** Not implemented. Failed jobs after max retries are logged and discarded.

### Bun Redis Queue

- **Use case:** Production workloads using Bun's native Redis client (zero dependencies).
- **Durability:** Same as ioredis driver.
- **Delivery:** At-least-once with retry.
- **Crash recovery:** Not supported (same limitation as ioredis driver).
- **Acknowledgment:** Implicit via set membership.
- **Dead letter:** Not implemented.

### BullMQ Queue

- **Use case:** Enterprise production workloads requiring reliability.
- **Durability:** Full durability via BullMQ's Redis-backed storage.
- **Delivery:** At-least-once with built-in retry and backoff.
- **Crash recovery:** ✅ BullMQ monitors stalled jobs and automatically reclaims them.
- **Acknowledgment:** Explicit via BullMQ's job completion/failure mechanism.
- **Dead letter:** Not configured by default. Can be added via BullMQ's `failed` event.
- **Note:** BullMQ owns durability and retry semantics. Buntok only exposes `attempts` and `backoff` configuration.

### RabbitMQ Queue

- **Use case:** Production workloads requiring AMQP semantics.
- **Durability:** Full durability via AMQP persistent queues and messages.
- **Delivery:** At-least-once with consumer acknowledgment.
- **Crash recovery:** ✅ Unacknowledged messages are redelivered when consumer disconnects.
- **Acknowledgment:** Explicit via `channel.ack()` / `channel.nack()`.
- **Dead letter:** Not configured by default. When jobs permanently fail, `nack(msg, false, false)` is called which discards the message. To enable dead-letter routing, configure a dead-letter exchange on the queue and use `nack(msg, false, false)` which routes to the DLX.

## Shutdown Behavior

All drivers participate in `app.close()`:

| Driver | Close Behavior | Drain Behavior |
|--------|---------------|----------------|
| Memory | Clears timers, waits for pump to finish | Drains with timeout |
| Redis (ioredis) | Stops poll timer, calls `redis.quit()` | Drains remaining jobs |
| Bun Redis | Stops poll timer, calls `redis.close()` | Drains remaining jobs |
| BullMQ | Calls `worker.close()` then `queue.close()` | Waits for worker to finish |
| RabbitMQ | Cancels consumer, closes channel, closes connection | Drains unacknowledged messages |

## Recommendations

1. **Development:** Use `MemoryQueueDriver`.
2. **Single-server production:** Use `BullmqQueueDriver` for crash recovery, or `RedisQueueDriver` if BullMQ dependency is unwanted.
3. **Multi-server production:** Use `BullmqQueueDriver` or `RabbitmqQueueDriver` for distributed work.
4. **Exactly-once delivery:** Not supported by any driver. Use idempotent job handlers.

## Known Limitations

1. Memory driver loses all jobs on crash.
2. Redis/Bun Redis drivers do not reclaim orphaned jobs after worker crash.
3. No driver supports exactly-once delivery.
4. Dead-letter routing is not implemented for any driver (interface flag exists but is always `false`).
5. `size()` returns `null` for Redis drivers (complexity of counting sorted sets accurately).
