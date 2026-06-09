package com.blog.blog_platform.dto;

import com.blog.blog_platform.entity.PostStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public class PostUpsertRequest {
    @NotBlank
    @Size(max = 180)
    private String title;

    @NotBlank
    @Size(max = 50000)
    private String content;

    @Size(max = 500)
    private String summary;

    @Size(max = 2048)
    private String thumbnail;

    private List<String> tags;
    private PostStatus status = PostStatus.PUBLISHED;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }

    public String getThumbnail() { return thumbnail; }
    public void setThumbnail(String thumbnail) { this.thumbnail = thumbnail; }

    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }

    public PostStatus getStatus() { return status; }
    public void setStatus(PostStatus status) { this.status = status; }
}
