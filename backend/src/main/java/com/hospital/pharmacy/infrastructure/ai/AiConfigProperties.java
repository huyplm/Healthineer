package com.hospital.pharmacy.infrastructure.ai;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.ai")
public class AiConfigProperties {

    private Groq groq = new Groq();
    private OpenFda openfda = new OpenFda();
    private boolean fallbackToMock = true;

    public boolean isRealAiEnabled() {
        return groq.getApiKey() != null && !groq.getApiKey().isBlank();
    }

    public Groq getGroq() { return groq; }
    public void setGroq(Groq groq) { this.groq = groq; }
    public OpenFda getOpenfda() { return openfda; }
    public void setOpenfda(OpenFda openfda) { this.openfda = openfda; }
    public boolean isFallbackToMock() { return fallbackToMock; }
    public void setFallbackToMock(boolean fallbackToMock) { this.fallbackToMock = fallbackToMock; }

    public static class Groq {
        private String apiKey = "";
        private String model = "llama-3.3-70b-versatile";
        private String baseUrl = "https://api.groq.com/openai/v1";

        public String getApiKey() { return apiKey; }
        public void setApiKey(String apiKey) { this.apiKey = apiKey; }
        public String getModel() { return model; }
        public void setModel(String model) { this.model = model; }
        public String getBaseUrl() { return baseUrl; }
        public void setBaseUrl(String baseUrl) { this.baseUrl = baseUrl; }
    }

    public static class OpenFda {
        private String baseUrl = "https://api.fda.gov/drug";

        public String getBaseUrl() { return baseUrl; }
        public void setBaseUrl(String baseUrl) { this.baseUrl = baseUrl; }
    }
}
