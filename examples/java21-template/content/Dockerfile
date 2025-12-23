# Use the official OpenJDK 21 image as the base image
FROM eclipse-temurin:21-jdk-jammy

# Set the working directory inside the container
WORKDIR /app

# Copy the Maven project files
COPY pom.xml .
COPY src ./src

# Build the application using Maven
RUN apt-get update && apt-get install -y maven && mvn clean package -DskipTests

# Expose the port the app runs on (assuming 8080, adjust if needed)
EXPOSE 8080

# Run the application
CMD ["java", "-jar", "target/${{ values.name }}-1.0-SNAPSHOT.jar"]