package com.blog.blog_platform.repository;

import com.blog.blog_platform.entity.AdminActionLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AdminActionLogRepository extends JpaRepository<AdminActionLog, Long> {
    List<AdminActionLog> findTop20ByOrderByCreatedAtDesc();
}
