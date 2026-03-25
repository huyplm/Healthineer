FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# Backend build context from monorepo root
COPY backend/pom.xml ./backend/pom.xml

WORKDIR /app/backend
RUN mvn -q -DskipTests dependency:go-offline
COPY backend/src ./src
RUN mvn -q -DskipTests package

FROM eclipse-temurin:21-jre
WORKDIR /app

ENV JAVA_OPTS=""
COPY --from=build /app/backend/target/*-SNAPSHOT.jar /app/app.jar

EXPOSE 8080
CMD ["sh","-c","java $JAVA_OPTS -jar /app/app.jar"]

