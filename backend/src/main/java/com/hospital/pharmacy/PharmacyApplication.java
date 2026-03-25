package com.hospital.pharmacy;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.net.URI;

@SpringBootApplication
public class PharmacyApplication {

    public static void main(String[] args) {
        configureDatasourceFromRenderEnv();
        SpringApplication.run(PharmacyApplication.class, args);
    }

    /**
     * Render provides DATABASE_URL like: postgres://user:pass@host:port/db
     * Spring expects jdbc:postgresql://host:port/db and separate username/password.
     */
    private static void configureDatasourceFromRenderEnv() {
        String databaseUrl = System.getenv("DATABASE_URL");
        if (databaseUrl == null || databaseUrl.isBlank()) return;

        if (System.getenv("SPRING_DATASOURCE_URL") != null || System.getProperty("spring.datasource.url") != null) {
            return; // explicitly configured elsewhere
        }

        try {
            URI uri = URI.create(databaseUrl);
            String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase();
            if (!scheme.startsWith("postgres")) return;

            String host = uri.getHost();
            int port = uri.getPort() > 0 ? uri.getPort() : 5432;
            String db = uri.getPath();
            if (db != null && db.startsWith("/")) db = db.substring(1);
            if (host == null || db == null || db.isBlank()) return;

            String jdbcUrl = "jdbc:postgresql://" + host + ":" + port + "/" + db + "?sslmode=require";
            System.setProperty("spring.datasource.url", jdbcUrl);

            String userInfo = uri.getUserInfo(); // user:pass
            if (userInfo != null && !userInfo.isBlank()) {
                String[] parts = userInfo.split(":", 2);
                if (parts.length >= 1 && !parts[0].isBlank()) {
                    System.setProperty("spring.datasource.username", parts[0]);
                }
                if (parts.length == 2 && !parts[1].isBlank()) {
                    System.setProperty("spring.datasource.password", parts[1]);
                }
            }
        } catch (Exception ignored) {
            // If parsing fails, fall back to application.yml defaults.
        }
    }
}
