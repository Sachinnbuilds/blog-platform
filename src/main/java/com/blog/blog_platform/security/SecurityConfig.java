package com.blog.blog_platform.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private JwtFilter jwtFilter;

    @Autowired
    private RateLimitFilter rateLimitFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/register").permitAll()
                        .requestMatchers("/api/auth/login").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/posts/me").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/posts/drafts").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/posts/feed").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/posts/editor/{slug}").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/posts").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/posts/trending").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/posts/by-user/{username}").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/posts/{id}").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/posts/slug/{slug}").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/posts/search").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/posts/tag/{slug}").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/tags").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/tags/trending").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/tags/{slug}/posts").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/search/unified").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/stats").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/users/{username}/followers").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/users/{username}/following").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/users/{username}").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/users/{username}/posts").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/comments/{postId}").permitAll()
                        .requestMatchers("/", "/index.html").permitAll()
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .anyRequest().authenticated()
                )
                .addFilterBefore(rateLimitFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(
                "http://localhost:3000",
                "http://localhost:5173",
                "http://localhost:5174",
                "https://blog-platform-production-7165.up.railway.app"
        ));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
