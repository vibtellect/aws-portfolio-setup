import com.github.jengelman.gradle.plugins.shadow.tasks.ShadowJar

plugins {
    kotlin("jvm") version "1.9.21"
    kotlin("plugin.serialization") version "1.9.21"
    id("com.github.johnrengelman.shadow") version "8.1.1"
    application
}

group = "com.vibtellect.benchmark"
version = "1.0.0"

repositories {
    mavenCentral()
}

dependencies {
    // Kotlin
    implementation("org.jetbrains.kotlin:kotlin-stdlib")

    // Ktor
    implementation("io.ktor:ktor-server-core:2.3.7")
    implementation("io.ktor:ktor-server-netty:2.3.7")
    implementation("io.ktor:ktor-serialization-kotlinx-json:2.3.7")
    implementation("io.ktor:ktor-server-content-negotiation:2.3.7")
    implementation("io.ktor:ktor-server-cors:2.3.7")
    implementation("io.ktor:ktor-server-call-logging:2.3.7")

    // AWS Lambda
    implementation("com.amazonaws:aws-lambda-java-core:1.2.3")
    implementation("com.amazonaws:aws-lambda-java-events:3.11.3")

    // AWS SDK v2
    implementation("software.amazon.awssdk:dynamodb:2.21.42")
    implementation("software.amazon.awssdk:dynamodb-enhanced:2.21.42")

    // Serialization
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.2")

    // UUID
    implementation("com.benasher44:uuid:0.8.2")

    // Logging
    implementation("ch.qos.logback:logback-classic:1.4.14")
    implementation("io.github.microutils:kotlin-logging-jvm:3.0.5")

    // Testing
    testImplementation("org.jetbrains.kotlin:kotlin-test")
    testImplementation("io.ktor:ktor-server-tests:2.3.7")
    testImplementation("org.junit.jupiter:junit-jupiter:5.10.1")
}

application {
    mainClass.set("com.vibtellect.benchmark.ApplicationKt")
}

tasks.test {
    useJUnitPlatform()
}

kotlin {
    jvmToolchain(21)
}

tasks.withType<ShadowJar> {
    archiveBaseName.set("bootstrap")
    archiveClassifier.set("")
    archiveVersion.set("")
    mergeServiceFiles()

    manifest {
        attributes["Main-Class"] = "com.vibtellect.benchmark.ApplicationKt"
    }
}

// Task to prepare for Lambda deployment
tasks.register<Copy>("prepareLambda") {
    dependsOn("shadowJar")
    from("build/libs/bootstrap.jar")
    into("build/lambda")
    rename { "bootstrap.jar" }
}
