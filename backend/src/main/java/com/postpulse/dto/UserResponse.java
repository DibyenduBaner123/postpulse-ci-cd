package com.postpulse.dto;

import com.postpulse.entity.User;
import lombok.Builder;
import lombok.Value;

import java.time.Instant;

@Value
@Builder
public class UserResponse {
    String id;
    String name;
    String email;
    User.Role role;
    String department;
    String avatarUrl;
    Instant createdAt;
    Boolean isActive;

    public static UserResponse from(User user) {
        return UserResponse.builder().id(user.getId()).name(user.getName()).email(user.getEmail())
                .role(user.getRole()).department(user.getDepartment()).avatarUrl(user.getAvatarUrl())
                .createdAt(user.getCreatedAt()).isActive(user.getIsActive()).build();
    }
}
