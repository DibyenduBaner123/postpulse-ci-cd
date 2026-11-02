package com.postpulse.event;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
@Slf4j
public class KafkaPostProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public static final String TOPIC_SCHEDULED = "post-scheduled";
    public static final String TOPIC_PUBLISHED = "post-published";
    public static final String TOPIC_FAILED = "post-failed";
    public static final String TOPIC_DLQ = "post-dlq";

    public void publishScheduledEvent(PostScheduledEvent event) {
        log.info("Publishing PostScheduledEvent to topic {} with key {} [CorrelationId: {}]",
                TOPIC_SCHEDULED, event.getPostId(), event.getCorrelationId());

        CompletableFuture<SendResult<String, Object>> future = kafkaTemplate.send(TOPIC_SCHEDULED, event.getPostId(), event);

        future.whenComplete((result, ex) -> {
            if (ex != null) {
                log.error("Failed to send Kafka event for post {}: {}", event.getPostId(), ex.getMessage(), ex);
            } else {
                log.info("Event sent successfully to partition {} offset {}",
                        result.getRecordMetadata().partition(),
                        result.getRecordMetadata().offset());
            }
        });
    }

    public void sendToDlq(String key, Object payload, String reason) {
        log.warn("Routing dead message {} to {} due to: {}", key, TOPIC_DLQ, reason);
        kafkaTemplate.send(TOPIC_DLQ, key, payload);
    }
}
