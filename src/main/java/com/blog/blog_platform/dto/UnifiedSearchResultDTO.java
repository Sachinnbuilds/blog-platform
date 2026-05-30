package com.blog.blog_platform.dto;

import java.util.List;

public class UnifiedSearchResultDTO {
    private List<PostSummaryDTO> posts;
    private List<UserProfileDTO> users;
    private List<TagDTO> tags;

    public UnifiedSearchResultDTO(List<PostSummaryDTO> posts, List<UserProfileDTO> users, List<TagDTO> tags) {
        this.posts = posts;
        this.users = users;
        this.tags = tags;
    }

    public List<PostSummaryDTO> getPosts() { return posts; }
    public void setPosts(List<PostSummaryDTO> posts) { this.posts = posts; }

    public List<UserProfileDTO> getUsers() { return users; }
    public void setUsers(List<UserProfileDTO> users) { this.users = users; }

    public List<TagDTO> getTags() { return tags; }
    public void setTags(List<TagDTO> tags) { this.tags = tags; }
}
