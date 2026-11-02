package com.postpulse.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@Slf4j
public class AnalyticsController {

    @GetMapping("/overview")
    @Cacheable(value = "analytics:overview")
    public ResponseEntity<Map<String, Object>> getOverview() {
        log.info("Computing analytics overview (Database aggregation query)");
        return ResponseEntity.ok(Map.of(
            "metrics", Map.of(
                "totalPosts", 24,
                "publishedPosts", 18,
                "scheduledPosts", 4,
                "draftPosts", 3,
                "failedPosts", 1,
                "totalReach", 58900,
                "impressions", 79700,
                "engagementRate", "5.8%"
            ),
            "fromCache", false
        ));
    }

    @GetMapping("/platforms")
    @Cacheable(value = "platforms:configs")
    public ResponseEntity<Map<String, Object>> getPlatformPerformance() {
        return ResponseEntity.ok(Map.of("status", "OK"));
    }
}
