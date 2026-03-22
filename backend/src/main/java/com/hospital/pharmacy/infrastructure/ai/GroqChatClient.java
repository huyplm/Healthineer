package com.hospital.pharmacy.infrastructure.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.List;
import java.util.Map;

@Component
public class GroqChatClient {

    private static final Logger log = LoggerFactory.getLogger(GroqChatClient.class);

    private final AiConfigProperties config;
    private final ObjectMapper objectMapper;
    private final RestClient restClient;

    public GroqChatClient(AiConfigProperties config, ObjectMapper objectMapper) {
        this.config = config;
        this.objectMapper = objectMapper;
        this.restClient = RestClient.builder()
                .baseUrl(config.getGroq().getBaseUrl())
                .build();
    }

    public boolean isAvailable() {
        return config.isRealAiEnabled();
    }

    /**
     * Send a chat completion request to Groq and return the assistant's text content.
     */
    public String chat(String systemPrompt, String userMessage) {
        return chat(systemPrompt, userMessage, 0.3);
    }

    public String chat(String systemPrompt, String userMessage, double temperature) {
        Map<String, Object> body = Map.of(
                "model", config.getGroq().getModel(),
                "messages", List.of(
                        Map.of("role", "system", "content", systemPrompt),
                        Map.of("role", "user", "content", userMessage)
                ),
                "temperature", temperature,
                "max_tokens", 2048
        );

        try {
            String jsonBody = objectMapper.writeValueAsString(body);

            String response = restClient.post()
                    .uri("/chat/completions")
                    .header("Authorization", "Bearer " + config.getGroq().getApiKey())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(jsonBody)
                    .retrieve()
                    .body(String.class);

            JsonNode root = objectMapper.readTree(response);
            return root.path("choices").get(0).path("message").path("content").asText();
        } catch (Exception e) {
            log.error("Groq API call failed: {}", e.getMessage(), e);
            throw new GroqApiException("Groq API call failed: " + e.getMessage(), e);
        }
    }

    /**
     * Call Groq and parse the response as JSON into the target type.
     * The system prompt should instruct the model to return valid JSON only.
     */
    public <T> T chatAsJson(String systemPrompt, String userMessage, Class<T> targetType) {
        String raw = chat(systemPrompt, userMessage, 0.2);
        String cleaned = extractJsonBlock(raw);
        try {
            return objectMapper.readValue(cleaned, targetType);
        } catch (Exception e) {
            log.warn("Failed to parse Groq JSON response, raw: {}", raw);
            throw new GroqApiException("Failed to parse Groq response as " + targetType.getSimpleName(), e);
        }
    }

    private String extractJsonBlock(String text) {
        int start = text.indexOf("```json");
        if (start >= 0) {
            int end = text.indexOf("```", start + 7);
            if (end > start) {
                return text.substring(start + 7, end).trim();
            }
        }
        start = text.indexOf("```");
        if (start >= 0) {
            int end = text.indexOf("```", start + 3);
            if (end > start) {
                return text.substring(start + 3, end).trim();
            }
        }
        int arrStart = text.indexOf('[');
        int objStart = text.indexOf('{');
        if (arrStart >= 0 && (objStart < 0 || arrStart < objStart)) return text.substring(arrStart);
        if (objStart >= 0) return text.substring(objStart);
        return text;
    }

    public static class GroqApiException extends RuntimeException {
        public GroqApiException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
