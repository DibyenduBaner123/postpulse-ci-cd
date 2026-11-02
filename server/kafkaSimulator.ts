import { KafkaMessage } from './types.js';

interface ConsumerHandler {
  topic: string;
  groupId: string;
  handler: (message: KafkaMessage) => Promise<boolean>;
}

class KafkaBrokerSimulator {
  private messages: KafkaMessage[] = [];
  private offsets: Record<string, number> = {
    'post-scheduled': 0,
    'post-published': 0,
    'post-failed': 0,
    'post-notifications': 0,
    'post-dlq': 0,
  };
  private processedKeys = new Set<string>(); // Idempotency check cache
  private handlers: ConsumerHandler[] = [];

  constructor() {
    this.registerDefaultConsumers();
  }

  // Publish message to Kafka topic with partition and offset simulation
  public async publish(
    topic: 'post-scheduled' | 'post-published' | 'post-failed' | 'post-notifications' | 'post-dlq',
    key: string,
    payload: Record<string, any>,
    correlationId: string
  ): Promise<KafkaMessage> {
    const currentOffset = this.offsets[topic] || 0;
    this.offsets[topic] = currentOffset + 1;

    // Simulate standard 3-partition hashing on key
    const partition = Math.abs(this.hashString(key)) % 3;

    const message: KafkaMessage = {
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      topic,
      partition,
      offset: currentOffset,
      timestamp: new Date().toISOString(),
      key,
      payload,
      correlationId,
      attempts: 1,
      status: 'PENDING',
    };

    this.messages.push(message);

    // Asynchronous dispatch to registered consumer groups
    setTimeout(() => this.dispatchToConsumers(message), 100);

    return message;
  }

  public registerConsumer(topic: string, groupId: string, handler: (message: KafkaMessage) => Promise<boolean>) {
    this.handlers.push({ topic, groupId, handler });
  }

  private async dispatchToConsumers(message: KafkaMessage) {
    const matchingHandlers = this.handlers.filter((h) => h.topic === message.topic);

    for (const h of matchingHandlers) {
      try {
        // Idempotency check: duplicate event prevention
        const idempotencyKey = `${h.groupId}:${message.key}:${message.topic}`;
        if (this.processedKeys.has(idempotencyKey) && message.attempts === 1) {
          console.log(`[Kafka-Consumer] Idempotency hit: Duplicate skipped for ${idempotencyKey}`);
          message.status = 'PROCESSED';
          continue;
        }

        const success = await h.handler(message);
        if (success) {
          message.status = 'PROCESSED';
          this.processedKeys.add(idempotencyKey);
        } else {
          await this.handleConsumerFailure(message);
        }
      } catch (err) {
        console.error(`[Kafka-Consumer] Error consuming message ${message.eventId}:`, err);
        await this.handleConsumerFailure(message);
      }
    }
  }

  private async handleConsumerFailure(message: KafkaMessage) {
    message.attempts += 1;
    if (message.attempts > 3) {
      // Exceeded max retries -> Move to Dead-Letter Queue (DLQ)
      message.status = 'ROUTED_TO_DLQ';
      await this.publish(
        'post-dlq',
        message.key,
        {
          originalEventId: message.eventId,
          originalTopic: message.topic,
          failedPayload: message.payload,
          totalAttempts: message.attempts,
          failureReason: 'Consumer retry limit exceeded (Max 3 attempts)',
        },
        message.correlationId
      );
      console.warn(`[Kafka-DLQ] Message ${message.eventId} routed to Dead-Letter Queue.`);
    } else {
      // Exponential backoff retry: 500ms, 1000ms, 2000ms
      const delay = Math.pow(2, message.attempts) * 250;
      setTimeout(() => this.dispatchToConsumers(message), delay);
    }
  }

  private registerDefaultConsumers() {
    // Consumer 1: Post Scheduled Event Handler
    this.registerConsumer('post-scheduled', 'scheduler-worker-group', async (msg) => {
      console.log(`[Kafka-Worker] Consumed post-scheduled event for post ${msg.payload.postId}`);
      // Emulate notification generation
      await this.publish(
        'post-notifications',
        msg.key,
        {
          title: 'Post Scheduled Successfully',
          message: `Post ${msg.payload.postId} scheduled for ${msg.payload.scheduledTime} across ${msg.payload.platforms.join(', ')}`,
          type: 'INFO',
        },
        msg.correlationId
      );
      return true;
    });

    // Consumer 2: Post Published Event Handler
    this.registerConsumer('post-published', 'analytics-sync-group', async (msg) => {
      console.log(`[Kafka-Worker] Consumed post-published event for post ${msg.payload.postId}. Updating telemetry cache.`);
      return true;
    });
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }

  public getMessages(topic?: string, limit = 50): KafkaMessage[] {
    const list = topic ? this.messages.filter((m) => m.topic === topic) : this.messages;
    return [...list].reverse().slice(0, limit);
  }

  public getTopicStats() {
    return {
      'post-scheduled': this.messages.filter((m) => m.topic === 'post-scheduled').length,
      'post-published': this.messages.filter((m) => m.topic === 'post-published').length,
      'post-failed': this.messages.filter((m) => m.topic === 'post-failed').length,
      'post-notifications': this.messages.filter((m) => m.topic === 'post-notifications').length,
      'post-dlq': this.messages.filter((m) => m.topic === 'post-dlq').length,
    };
  }

  public replayDlqMessage(eventId: string): boolean {
    const dlqMsg = this.messages.find((m) => m.eventId === eventId && m.topic === 'post-dlq');
    if (!dlqMsg) return false;
    const { originalTopic, failedPayload } = dlqMsg.payload;
    if (originalTopic) {
      this.publish(originalTopic, dlqMsg.key, failedPayload, dlqMsg.correlationId);
      return true;
    }
    return false;
  }
}

export const kafkaSimulator = new KafkaBrokerSimulator();
