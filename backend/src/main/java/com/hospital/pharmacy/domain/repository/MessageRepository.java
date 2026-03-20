package com.hospital.pharmacy.domain.repository;

import com.hospital.pharmacy.domain.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findByPrescription_IdOrderByTimestampAsc(Long prescriptionId);
}
