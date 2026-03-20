package com.hospital.pharmacy.infrastructure.security;

import com.hospital.pharmacy.domain.model.User;
import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.text.ParseException;
import java.time.Instant;
import java.util.Date;

@Component
public class JwtService {

    private final String issuer;
    private final String secret;
    private final long expirationMinutes;
    private final JwtDecoder jwtDecoder;

    public JwtService(
            @Value("${app.jwt.issuer}") String issuer,
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-minutes}") long expirationMinutes,
            JwtDecoder jwtDecoder
    ) {
        this.issuer = issuer;
        this.secret = secret;
        this.expirationMinutes = expirationMinutes;
        this.jwtDecoder = jwtDecoder;
    }

    public String generate(User user) {
        Instant now = Instant.now();
        JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                .issuer(issuer)
                .subject(user.getId().toString())
                .claim("username", user.getUsername())
                .claim("role", user.getRole().name())
                .issueTime(Date.from(now))
                .expirationTime(Date.from(now.plusSeconds(expirationMinutes * 60)))
                .build();
        SignedJWT signedJWT = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), claimsSet);
        try {
            signedJWT.sign(new MACSigner(secret.getBytes(StandardCharsets.UTF_8)));
            return signedJWT.serialize();
        } catch (JOSEException e) {
            throw new IllegalStateException("Cannot generate JWT", e);
        }
    }

    public Jwt decode(String token) {
        return jwtDecoder.decode(token);
    }

    public Long userIdFromBearer(String bearerToken) {
        String raw = bearerToken.startsWith("Bearer ") ? bearerToken.substring(7) : bearerToken;
        try {
            SignedJWT jwt = SignedJWT.parse(raw);
            return Long.parseLong(jwt.getJWTClaimsSet().getSubject());
        } catch (ParseException e) {
            throw new IllegalArgumentException("Invalid bearer token");
        }
    }
}
