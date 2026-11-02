package com.postpulse.event;

import lombok.*;

import java.io.Serializable;
import java.time.Instant;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostScheduledEvent implements Serializable {

    private String eventId;
    private String postId;
    private Instant scheduledTime;
    private List<String> platforms;
    private String authorId;
    private String correlationId;
    private int attempt;
}
