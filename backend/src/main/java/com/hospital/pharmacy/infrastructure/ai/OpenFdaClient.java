package com.hospital.pharmacy.infrastructure.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@Component
public class OpenFdaClient {

    private static final Logger log = LoggerFactory.getLogger(OpenFdaClient.class);

    private final AiConfigProperties config;
    private final ObjectMapper objectMapper;
    private final RestClient restClient;

    public OpenFdaClient(AiConfigProperties config, ObjectMapper objectMapper) {
        this.config = config;
        this.objectMapper = objectMapper;
        this.restClient = RestClient.builder()
                .baseUrl(config.getOpenfda().getBaseUrl())
                .build();
    }

    /**
     * Query openFDA for drug interaction information for a given drug name.
     * Returns a list of interaction text snippets from FDA drug labels.
     */
    public List<String> getDrugInteractions(String drugName) {
        List<String> interactions = new ArrayList<>();
        try {
            String encoded = URLEncoder.encode("drug_interactions:\"" + drugName + "\"", StandardCharsets.UTF_8);
            String response = restClient.get()
                    .uri("/label.json?search=" + encoded + "&limit=3")
                    .retrieve()
                    .body(String.class);

            JsonNode root = objectMapper.readTree(response);
            JsonNode results = root.path("results");
            if (results.isArray()) {
                for (JsonNode result : results) {
                    JsonNode interactionField = result.path("drug_interactions");
                    if (interactionField.isArray()) {
                        for (JsonNode txt : interactionField) {
                            String text = txt.asText().trim();
                            if (!text.isEmpty()) {
                                interactions.add(text.length() > 500 ? text.substring(0, 500) + "..." : text);
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.warn("openFDA query failed for drug '{}': {}", drugName, e.getMessage());
        }
        return interactions;
    }

    /**
     * Check interactions between a list of drug names.
     * Returns interaction snippets found for any combination.
     */
    public List<DrugInteractionResult> checkInteractions(List<String> drugNames) {
        List<DrugInteractionResult> results = new ArrayList<>();
        for (int i = 0; i < drugNames.size(); i++) {
            for (int j = i + 1; j < drugNames.size(); j++) {
                String drugA = drugNames.get(i);
                String drugB = drugNames.get(j);
                List<String> snippets = getDrugInteractions(drugA);
                for (String snippet : snippets) {
                    if (snippet.toLowerCase().contains(drugB.toLowerCase())) {
                        results.add(new DrugInteractionResult(drugA, drugB, snippet));
                    }
                }
            }
        }
        return results;
    }

    public record DrugInteractionResult(String drugA, String drugB, String description) {}
}
