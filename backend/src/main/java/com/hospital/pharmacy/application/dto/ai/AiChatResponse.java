package com.hospital.pharmacy.application.dto.ai;

public record AiChatResponse(
        String id,
        String role,
        String content,
        String createdAt
) {
}
