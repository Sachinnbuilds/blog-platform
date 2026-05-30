package com.blog.blog_platform.dto;

public class AuthorStatsDTO {
    private long publishedCount;
    private long draftCount;
    private long totalLikes;
    private long totalViews;
    private int followerCount;

    public AuthorStatsDTO(long publishedCount, long draftCount, long totalLikes, long totalViews, int followerCount) {
        this.publishedCount = publishedCount;
        this.draftCount = draftCount;
        this.totalLikes = totalLikes;
        this.totalViews = totalViews;
        this.followerCount = followerCount;
    }

    public long getPublishedCount() { return publishedCount; }
    public void setPublishedCount(long publishedCount) { this.publishedCount = publishedCount; }

    public long getDraftCount() { return draftCount; }
    public void setDraftCount(long draftCount) { this.draftCount = draftCount; }

    public long getTotalLikes() { return totalLikes; }
    public void setTotalLikes(long totalLikes) { this.totalLikes = totalLikes; }

    public long getTotalViews() { return totalViews; }
    public void setTotalViews(long totalViews) { this.totalViews = totalViews; }

    public int getFollowerCount() { return followerCount; }
    public void setFollowerCount(int followerCount) { this.followerCount = followerCount; }
}
