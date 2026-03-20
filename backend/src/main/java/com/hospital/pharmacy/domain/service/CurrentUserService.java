package com.hospital.pharmacy.domain.service;

import com.hospital.pharmacy.domain.model.User;
import com.hospital.pharmacy.domain.repository.UserRepository;
import com.hospital.pharmacy.presentation.exception.NotFoundException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

@Service
public class CurrentUserService {

    private final UserRepository userRepository;

    public CurrentUserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User currentUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!(principal instanceof Jwt jwt)) {
            throw new NotFoundException("Authenticated principal not found");
        }
        Long userId = Long.parseLong(jwt.getSubject());
        return userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));
    }
}
