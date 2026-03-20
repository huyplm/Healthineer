package com.hospital.pharmacy.presentation;

import com.hospital.pharmacy.application.dto.message.MessageRequest;
import com.hospital.pharmacy.application.dto.message.MessageResponse;
import com.hospital.pharmacy.application.mapper.ResponseMapper;
import com.hospital.pharmacy.domain.service.CurrentUserService;
import com.hospital.pharmacy.domain.service.MessageService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/prescriptions/{prescriptionId}/messages")
@Validated
@Tag(name = "Messages")
public class MessageController {

    private final MessageService messageService;
    private final CurrentUserService currentUserService;

    public MessageController(MessageService messageService, CurrentUserService currentUserService) {
        this.messageService = messageService;
        this.currentUserService = currentUserService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('DOCTOR','PHARMACIST','ADMIN')")
    public List<MessageResponse> list(@PathVariable Long prescriptionId) {
        return messageService.list(prescriptionId).stream().map(ResponseMapper::toMessageResponse).toList();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('DOCTOR','PHARMACIST','ADMIN')")
    public MessageResponse send(@PathVariable Long prescriptionId, @Valid @RequestBody MessageRequest request) {
        return ResponseMapper.toMessageResponse(
                messageService.send(prescriptionId, currentUserService.currentUser().getId(), request)
        );
    }
}
