package org.library.config;

import java.time.Duration;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.github.resilience4j.ratelimiter.RateLimiter;
import io.github.resilience4j.ratelimiter.RateLimiterConfig;
import io.github.resilience4j.ratelimiter.RateLimiterRegistry;

@Configuration
public class RateLimitConfig {

    @Bean
    public RateLimiter rateLimiter() {
        // ✅ Define rate limiting configuration
        RateLimiterConfig config = RateLimiterConfig.custom()
                .limitRefreshPeriod(Duration.ofMinutes(1)) // Reset tokens every 1 min
                .limitForPeriod(10) // Allow 10 requests per minute
                .timeoutDuration(Duration.ofMillis(500)) // Wait max 500ms for a token
                .build();

        // ✅ Create RateLimiterRegistry and return RateLimiter
        RateLimiterRegistry rateLimiterRegistry = RateLimiterRegistry.of(config);
        return rateLimiterRegistry.rateLimiter("default");
    }
}
