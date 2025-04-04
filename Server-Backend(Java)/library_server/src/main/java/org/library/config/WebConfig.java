package org.library.config;

import org.library.filter.RateLimitFilter;
import org.library.service.RateLimitService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class WebConfig {

    @Bean
    public RateLimitFilter rateLimitingFilter(RateLimitService rateLimitService) {
        return new RateLimitFilter(rateLimitService);
    }
}
