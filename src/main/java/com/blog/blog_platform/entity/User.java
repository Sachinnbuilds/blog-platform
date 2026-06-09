package com.blog.blog_platform.entity;

import java.util.List;
import java.util.HashSet;
import java.util.Set;
import java.time.LocalDate;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "users")
@Getter
@Setter
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    @JsonIgnore
    private String password;

    @Column(nullable = false)
    private boolean isAdmin = false;

    @Column(nullable = false)
    private int tokenVersion = 0;

    @Column(nullable = false)
    private String displayName;

    @Column(length = 500)
    private String bio;

    @Column(length = 2048)
    private String avatarUrl;

    @Column(length = 512)
    private String website;

    @Column(length = 255)
    private String location;

    @Column(nullable = false)
    private LocalDate joinedAt;

    @Column(nullable = false)
    private int followerCount = 0;

    @Column(nullable = false)
    private int followingCount = 0;

    @ElementCollection
    @CollectionTable(name = "user_interests", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "interest", nullable = false, length = 100)
    @JsonIgnore
    private Set<String> interests = new HashSet<>();

    @JsonIgnore
    @OneToMany(mappedBy = "author", cascade = CascadeType.ALL)
    private List<Post> posts;

    @JsonIgnore
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<Comment> comments;

    @JsonIgnore
    @OneToMany(mappedBy = "follower", cascade = CascadeType.ALL)
    private List<Follow> following;

    @JsonIgnore
    @OneToMany(mappedBy = "following", cascade = CascadeType.ALL)
    private List<Follow> followers;

    @PrePersist
    public void onCreate() {
        if (this.displayName == null || this.displayName.isBlank()) {
            this.displayName = this.username;
        }
        if (this.joinedAt == null) {
            this.joinedAt = LocalDate.now();
        }
    }
}
