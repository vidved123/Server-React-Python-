package library.org.library_server;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@SpringBootApplication
@EnableJpaRepositories(basePackages = "org.library.repository")
@EntityScan(basePackages = "org.library.entity")
public class LibraryServerApplication {

	public static void main(String[] args) {
		SpringApplication.run(LibraryServerApplication.class, args);
	}
}

@Configuration
class CorsConfig {
	@Bean
	public WebMvcConfigurer customCorsConfigurer() {
		return new WebMvcConfigurer() {
			@Override
			public void addCorsMappings(@NonNull CorsRegistry registry) {
				registry.addMapping("/**")
						.allowedOrigins("http://localhost:5173") // Consider externalizing this
						.allowedMethods("GET", "POST", "PUT", "DELETE")
						.allowCredentials(true)
						.allowedHeaders("Authorization", "Content-Type");
			}
		};
	}
}
