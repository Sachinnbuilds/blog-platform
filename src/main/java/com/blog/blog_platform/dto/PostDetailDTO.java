package com.blog.blog_platform.dto;

import com.blog.blog_platform.entity.PostStatus;

import java.time.LocalDateTime;
import java.util.List;

public class PostDetailDTO {
    private Long id;
    private String title;
    private String slug;
    private String content;
    private String summary;
    private String thumbnail;
    private String readTime;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private int likes;
    private int viewCount;
    private int commentCount;
    private PostStatus status;
    private boolean likedByCurrentUser;
    private String authorUsername;
    private String authorDisplayName;
    private List<TagDTO> tags;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }

    public String getThumbnail() { return thumbnail; }
    public void setThumbnail(String thumbnail) { this.thumbnail = thumbnail; }

    public String getReadTime() { return readTime; }
    public void setReadTime(String readTime) { this.readTime = readTime; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public int getLikes() { return likes; }
    public void setLikes(int likes) { this.likes = likes; }

    public int getViewCount() { return viewCount; }
    public void setViewCount(int viewCount) { this.viewCount = viewCount; }

    public int getCommentCount() { return commentCount; }
    public void setCommentCount(int commentCount) { this.commentCount = commentCount; }

    public PostStatus getStatus() { return status; }
    public void setStatus(PostStatus status) { this.status = status; }

    public boolean isLikedByCurrentUser() { return likedByCurrentUser; }
    public void setLikedByCurrentUser(boolean likedByCurrentUser) { this.likedByCurrentUser = likedByCurrentUser; }

    public String getAuthorUsername() { return authorUsername; }
    public void setAuthorUsername(String authorUsername) { this.authorUsername = authorUsername; }

    public String getAuthorDisplayName() { return authorDisplayName; }
    public void setAuthorDisplayName(String authorDisplayName) { this.authorDisplayName = authorDisplayName; }

    public List<TagDTO> getTags() { return tags; }
    public void setTags(List<TagDTO> tags) { this.tags = tags; }
}
