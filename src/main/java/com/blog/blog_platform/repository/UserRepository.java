package com.blog.blog_platform.repository;

import com.blog.blog_platform.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;
import java.util.List;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    Boolean existsByUsername(String username);
    Boolean existsByEmail(String email);
    List<User> findTop5ByUsernameContainingIgnoreCaseOrDisplayNameContainingIgnoreCase(String username, String displayName);

    @Modifying
    @Transactional
    @Query("UPDATE User u SET u.followerCount = u.followerCount + 1 WHERE u.id = :userId")
    void incrementFollowerCount(Long userId);

    @Modifying
    @Transactional
    @Query("UPDATE User u SET u.followerCount = CASE WHEN u.followerCount > 0 THEN u.followerCount - 1 ELSE 0 END WHERE u.id = :userId")
    void decrementFollowerCount(Long userId);

    @Modifying
    @Transactional
    @Query("UPDATE User u SET u.followingCount = u.followingCount + 1 WHERE u.id = :userId")
    void incrementFollowingCount(Long userId);

    @Modifying
    @Transactional
    @Query("UPDATE User u SET u.followingCount = CASE WHEN u.followingCount > 0 THEN u.followingCount - 1 ELSE 0 END WHERE u.id = :userId")
    void decrementFollowingCount(Long userId);
}
