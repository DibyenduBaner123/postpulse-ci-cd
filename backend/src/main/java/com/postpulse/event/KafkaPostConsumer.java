package com.postpulse.event;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.DltHandler;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.annotation.RetryableTopic;
import org.springframework.kafka.retrytopic.DltStrategy;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.retry.annotation.Backoff;
import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class KafkaPostConsumer {

    // In-memory idempotency cache (or Redis backing in production)
    private final Set<String> processedMessageKeys = ConcurrentHashMap.newKeySet();

    @RetryableTopic(
        attempts = "3",
        backoff = @Backoff(delay = 1000, multiplier = 2.0),
        dltStrategy = DltStrategy.FAIL_ON_ERROR,
        include = {RuntimeException.class}
    )
    @KafkaListener(topics = "post-scheduled", groupId = "postpulse-workers-v1")
    public void consumeScheduledEvent(
            PostScheduledEvent event,
            @Header(KafkaHeaders.RECEIVED_KEY) String key,
            @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
            @Header(KafkaHeaders.OFFSET) long offset) {

        log.info("Processing post-scheduled event for key={} [Partition: {}, Offset: {}, CorrelationId: {}]",
                key, partition, offset, event.getCorrelationId());

        // Idempotency check
        String idempotencyKey = String.format("%s:%s", key, event.getEventId());
        if (processedMessageKeys.contains(idempotencyKey)) {
            log.warn("Duplicate event detected for key {}. Skipping execution for idempotency guarantee.", idempotencyKey);
            return;
        }

        try {
            // Process the scheduled publication
            executeSimulatedPublish(event);
            processedMessageKeys.add(idempotencyKey);
            log.info("Successfully processed scheduled publication for post {}", event.getPostId());
        } catch (Exception e) {
            log.error("Error executing publication task for post {}: {}", event.getPostId(), e.getMessage());
            throw new RuntimeException("Task execution failed, triggering retry", e);
        }
    }

    @DltHandler
    public void handleDeadLetterQueue(
            PostScheduledEvent failedEvent,
            @Header(KafkaHeaders.RECEIVED_KEY) String key,
            @Header(KafkaHeaders.EXCEPTION_MESSAGE) String errorMessage) {

        log.error("CRITICAL: Message key={} routed to Dead-Letter Queue (DLQ). Reason: {}", key, errorMessage);
        // Persist failure status to database and alert operators
    }

    private void executeSimulatedPublish(PostScheduledEvent event) {
        // Platform API delivery simulation logic
        log.info("Simulating delivery of post {} across platforms: {}", event.getPostId(), event.getPlatforms());
    }
}
