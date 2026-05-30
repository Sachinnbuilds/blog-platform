package com.blog.blog_platform.dto;

public class PlatformStatsDTO {
    private long totalUsers;
    private long totalPosts;
    private long totalTags;

    public PlatformStatsDTO(long totalUsers, long totalPosts, long totalTags) {
        this.totalUsers = totalUsers;
        this.totalPosts = totalPosts;
        this.totalTags = totalTags;
    }

    public long getTotalUsers() { return totalUsers; }
    public void setTotalUsers(long totalUsers) { this.totalUsers = totalUsers; }

    public long getTotalPosts() { return totalPosts; }
    public void setTotalPosts(long totalPosts) { this.totalPosts = totalPosts; }

    public long getTotalTags() { return totalTags; }
    public void setTotalTags(long totalTags) { this.totalTags = totalTags; }
}
