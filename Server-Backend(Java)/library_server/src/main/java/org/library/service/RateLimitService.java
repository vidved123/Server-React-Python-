package org.library.service;

import org.springframework.stereotype.Service;

import io.github.resilience4j.ratelimiter.RateLimiter;

@Service
public class RateLimitService {
    private final RateLimiter rateLimiter;

    public RateLimitService(RateLimiter rateLimiter) {
        this.rateLimiter = rateLimiter;
    }

    public boolean tryConsume() {
        return rateLimiter.acquirePermission(); // ✅ Resilience4j handles token consumption
    }
}
