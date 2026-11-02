package com.postpulse.controller;

import com.postpulse.entity.Post;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
@Slf4j
public class PostController {

    @GetMapping
    public ResponseEntity<Page<Post>> getPosts(
            @RequestParam(required = false) Post.PostStatus status,
            @RequestParam(required = false) String platform,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        log.info("Querying posts with status={}, platform={}, search={}, pageable={}", status, platform, search, pageable);
        // Repository query with pagination
        return ResponseEntity.ok(Page.empty(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Post> getPostById(@PathVariable String id) {
        log.info("Retrieving post with ID: {}", id);
        return ResponseEntity.ok(new Post());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EDITOR')")
    @CacheEvict(value = "analytics:overview", allEntries = true)
    public ResponseEntity<Post> createPost(@RequestBody Post post) {
        log.info("Creating post across platforms. Evicting analytics cache.");
        return ResponseEntity.status(HttpStatus.CREATED).body(post);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EDITOR')")
    @CacheEvict(value = "analytics:overview", allEntries = true)
    public ResponseEntity<Post> updatePost(@PathVariable String id, @RequestBody Post post) {
        log.info("Updating post with ID: {}", id);
        return ResponseEntity.ok(post);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @CacheEvict(value = "analytics:overview", allEntries = true)
    public ResponseEntity<Void> deletePost(@PathVariable String id) {
        log.info("Permanently deleting post with ID: {}", id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/publish")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EDITOR')")
    @CacheEvict(value = "analytics:overview", allEntries = true)
    public ResponseEntity<Post> publishPostNow(@PathVariable String id) {
        log.info("Executing immediate publication for post: {}", id);
        return ResponseEntity.ok(new Post());
    }
}
