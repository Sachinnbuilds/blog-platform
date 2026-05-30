package com.blog.blog_platform.dto;

import jakarta.validation.constraints.Size;

public class UpdateProfileRequest {
    @Size(max = 255)
    private String displayName;

    @Size(max = 500)
    private String bio;

    @Size(max = 512)
    private String website;

    @Size(max = 255)
    private String location;

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public String getWebsite() { return website; }
    public void setWebsite(String website) { this.website = website; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
}
