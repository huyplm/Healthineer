package com.hospital.pharmacy.application.dto.message;

import java.time.LocalDateTime;

public record MessageResponse(
        Long id,
        Long prescriptionId,
        Long senderId,
        String senderName,
        String senderRole,
        String content,
        LocalDateTime timestamp,
        String messageType
) {
}
