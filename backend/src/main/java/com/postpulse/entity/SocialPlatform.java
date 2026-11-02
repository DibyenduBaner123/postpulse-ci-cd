package com.postpulse.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "social_platforms")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SocialPlatform {

    @Id
    @Column(length = 32)
    private String id; // 'twitter', 'instagram', 'facebook', 'linkedin', 'youtube'

    @Column(nullable = false, length = 50)
    private String name;

    @Column(nullable = false, length = 16)
    private String color;

    @Column(name = "character_limit", nullable = false)
    private Integer characterLimit;

    @Column(name = "max_media_count", nullable = false)
    private Integer maxMediaCount;

    @Column(name = "media_required")
    private Boolean mediaRequired;

    @Column(name = "max_hashtags")
    private Integer maxHashtags;

    @Column(name = "supports_links")
    private Boolean supportsLinks;
}
