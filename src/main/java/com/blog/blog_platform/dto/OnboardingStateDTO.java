package com.blog.blog_platform.dto;

public class OnboardingStateDTO {
    private boolean completed;
    private int selectedInterestCount;

    public OnboardingStateDTO(boolean completed, int selectedInterestCount) {
        this.completed = completed;
        this.selectedInterestCount = selectedInterestCount;
    }

    public boolean isCompleted() { return completed; }
    public void setCompleted(boolean completed) { this.completed = completed; }

    public int getSelectedInterestCount() { return selectedInterestCount; }
    public void setSelectedInterestCount(int selectedInterestCount) { this.selectedInterestCount = selectedInterestCount; }
}
