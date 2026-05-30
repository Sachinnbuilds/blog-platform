package com.blog.blog_platform.security;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Component
public class RateLimitFilter implements Filter {

    private final Map<String, UserRateLimit> requestCounts = new ConcurrentHashMap<>();
    private static final int MAX_REQUESTS_PER_MINUTE = 20;

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        // Only rate limit registration and login to prevent spam
        String path = httpRequest.getRequestURI();
        if (path.startsWith("/api/auth/register") || path.startsWith("/api/auth/login")) {
            String clientIp = getClientIp(httpRequest);
            UserRateLimit rateLimit = requestCounts.computeIfAbsent(clientIp, k -> new UserRateLimit());

            if (rateLimit.isLimitExceeded()) {
                httpResponse.setStatus(429);
                httpResponse.getWriter().write("Too many requests. Please try again later.");
                return;
            }
        }

        chain.doFilter(request, response);
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0];
    }

    private static class UserRateLimit {
        private int count = 0;
        private long timestamp = System.currentTimeMillis();

        public synchronized boolean isLimitExceeded() {
            long now = System.currentTimeMillis();
            if (now - timestamp > TimeUnit.MINUTES.toMillis(1)) {
                count = 1;
                timestamp = now;
                return false;
            }
            count++;
            return count > MAX_REQUESTS_PER_MINUTE;
        }
    }
}
