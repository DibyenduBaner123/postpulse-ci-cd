package com.postpulse.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "posts", indexes = {
    @Index(name = "idx_posts_status", columnList = "status"),
    @Index(name = "idx_posts_scheduled_time", columnList = "scheduled_time"),
    @Index(name = "idx_posts_author", columnList = "author_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Post {

    @Id
    @Column(length = 64)
    private String id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private PostStatus status;

    @Column(name = "author_id", nullable = false, length = 64)
    private String authorId;

    @Column(name = "author_name", nullable = false, length = 100)
    private String authorName;

    @Column(name = "scheduled_time")
    private Instant scheduledTime;

    @Column(name = "published_time")
    private Instant publishedTime;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "post_platforms",
        joinColumns = @JoinColumn(name = "post_id"),
        inverseJoinColumns = @JoinColumn(name = "platform_id")
    )
    @Builder.Default
    private Set<SocialPlatform> platforms = new HashSet<>();

    @Column(name = "publish_result_json", columnDefinition = "JSONB")
    private String publishResultJson;

    @Column(name = "analytics_json", columnDefinition = "JSONB")
    private String analyticsJson;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    public enum PostStatus {
        DRAFT,
        SCHEDULED,
        PUBLISHED,
        FAILED,
        CANCELLED
    }
}
