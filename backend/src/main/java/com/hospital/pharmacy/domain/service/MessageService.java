package com.hospital.pharmacy.domain.service;

import com.hospital.pharmacy.application.dto.message.MessageRequest;
import com.hospital.pharmacy.domain.model.Message;
import com.hospital.pharmacy.domain.model.Prescription;
import com.hospital.pharmacy.domain.model.User;
import com.hospital.pharmacy.domain.repository.MessageRepository;
import com.hospital.pharmacy.domain.repository.PrescriptionRepository;
import com.hospital.pharmacy.domain.repository.UserRepository;
import com.hospital.pharmacy.presentation.exception.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class MessageService {

    private final MessageRepository messageRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final UserRepository userRepository;

    public MessageService(MessageRepository messageRepository, PrescriptionRepository prescriptionRepository, UserRepository userRepository) {
        this.messageRepository = messageRepository;
        this.prescriptionRepository = prescriptionRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<Message> list(Long prescriptionId) {
        List<Message> msgs = messageRepository.findByPrescription_IdOrderByTimestampAsc(prescriptionId);
        // open-in-view is disabled; initialize lazy relations within the transaction boundary
        for (Message m : msgs) {
            if (m.getSender() != null) {
                m.getSender().getFullName();
                if (m.getSender().getRole() != null) m.getSender().getRole().name();
            }
            if (m.getPrescription() != null) {
                m.getPrescription().getId();
            }
        }
        return msgs;
    }

    @Transactional
    public Message send(Long prescriptionId, Long senderId, MessageRequest request) {
        Prescription prescription = prescriptionRepository.findById(prescriptionId)
                .orElseThrow(() -> new NotFoundException("Prescription not found"));
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new NotFoundException("Sender not found"));
        Message m = new Message();
        m.setPrescription(prescription);
        m.setSender(sender);
        m.setContent(request.content());
        m.setMessageType(request.messageType());
        return messageRepository.save(m);
    }
}
