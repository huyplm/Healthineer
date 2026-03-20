package com.hospital.pharmacy.application.dto.ai;

import java.util.List;

public record AiInteractionResponse(
        String id,
        String severity,
        String message,
        List<String> drugsInvolved,
        String recommendation
) {
}
