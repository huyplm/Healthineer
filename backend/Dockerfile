FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

COPY pom.xml ./
COPY mvnw mvnw
COPY mvnw.cmd mvnw.cmd
COPY .mvn .mvn
RUN chmod +x mvnw || true

RUN ./mvnw -q -DskipTests dependency:go-offline

COPY src ./src
RUN ./mvnw -q -DskipTests package

FROM eclipse-temurin:21-jre
WORKDIR /app

ENV JAVA_OPTS=""
COPY --from=build /app/target/*-SNAPSHOT.jar /app/app.jar

EXPOSE 8080
CMD ["sh","-c","java $JAVA_OPTS -jar /app/app.jar"]

# Optional / deploy only. For local dev, run backend with .\mvnw.cmd spring-boot:run and PostgreSQL on host.
# Stage 1: build with Maven inside Docker (no local Maven needed)
FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /build

COPY pom.xml .
RUN mvn dependency:go-offline -B

COPY src ./src
RUN mvn package -DskipTests -B

# Stage 2: run with JRE
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=builder /build/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
