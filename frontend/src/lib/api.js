import { http } from "./http";

export const api = {
  register: async (body) => (await http.post("/api/auth/register", body)).data,
  login: async (body) => (await http.post("/api/auth/login", body)).data,
  currentUser: async () => (await http.get("/api/users/me")).data,
  logoutAll: async () => (await http.post("/api/users/logout-all")).data,
  getUserProfile: async (username) => (await http.get(`/api/users/${encodeURIComponent(username)}`)).data,
  getUserPosts: async (username, params = {}) =>
    (await http.get(`/api/users/${encodeURIComponent(username)}/posts`, { params })).data,
  updateProfile: async (payload) => (await http.put("/api/users/me/profile", payload)).data,
  saveInterests: async (interests) => (await http.post("/api/users/me/interests", { interests })).data,
  getOnboardingState: async () => (await http.get("/api/users/me/onboarding-state")).data,
  changePassword: async (payload) => (await http.put("/api/users/me/password", payload)).data,
  followUser: async (username) => (await http.post(`/api/users/${encodeURIComponent(username)}/follow`)).data,
  unfollowUser: async (username) => (await http.delete(`/api/users/${encodeURIComponent(username)}/follow`)).data,
  isFollowing: async (username) => (await http.get(`/api/users/${encodeURIComponent(username)}/is-following`)).data,
  getFollowers: async (username, params = {}) =>
    (await http.get(`/api/users/${encodeURIComponent(username)}/followers`, { params })).data,
  getFollowing: async (username, params = {}) =>
    (await http.get(`/api/users/${encodeURIComponent(username)}/following`, { params })).data,
  getPosts: async (params = {}) => (await http.get("/api/posts", { params })).data,
  getTrendingPosts: async (params = {}) => (await http.get("/api/posts/trending", { params })).data,
  getFeed: async (params = {}) => (await http.get("/api/posts/feed", { params })).data,
  getMyPosts: async (params = {}) => (await http.get("/api/posts/me", { params })).data,
  getDrafts: async (params = {}) => (await http.get("/api/posts/drafts", { params })).data,
  searchPosts: async (keyword, params = {}) =>
    (await http.get("/api/posts/search", { params: { q: keyword, ...params } })).data,
  getPostsByTag: async (slug, params = {}) =>
    (await http.get(`/api/posts/tag/${encodeURIComponent(slug)}`, { params })).data,
  getPostBySlug: async (slug) => (await http.get(`/api/posts/slug/${encodeURIComponent(slug)}`)).data,
  getEditablePostBySlug: async (slug) => (await http.get(`/api/posts/editor/${encodeURIComponent(slug)}`)).data,
  createPost: async (payload) => (await http.post("/api/posts", payload)).data,
  updatePost: async (postId, payload) =>
    (await http.put(`/api/posts/${postId}`, payload)).data,
  deletePost: async (postId) => (await http.delete(`/api/posts/${postId}`)).data,
  likePost: async (postId) => (await http.post(`/api/posts/${postId}/like`)).data,
  getComments: async (postId, params = {}) =>
    (await http.get(`/api/comments/${postId}`, { params })).data,
  addComment: async (postId, content) =>
    (await http.post(`/api/comments/${postId}`, { content })).data,
  editComment: async (commentId, content) =>
    (await http.put(`/api/comments/${commentId}`, { content })).data,
  deleteComment: async (commentId) => (await http.delete(`/api/comments/${commentId}`)).data,
  getTags: async () => (await http.get("/api/tags")).data,
  getTrendingTags: async () => (await http.get("/api/tags/trending")).data,
  getTagPosts: async (slug, params = {}) =>
    (await http.get(`/api/tags/${encodeURIComponent(slug)}/posts`, { params })).data,
  unifiedSearch: async (q) => (await http.get("/api/search/unified", { params: { q } })).data,
  getPlatformStats: async () => (await http.get("/api/stats")).data,
  getAuthorStats: async () => (await http.get("/api/stats/me")).data,
  getAdminStats: async () => (await http.get("/api/admin/stats")).data,
  getAdminActivity: async () => (await http.get("/api/admin/activity")).data,
  getAdminUsers: async () => (await http.get("/api/admin/users")).data,
  makeAdmin: async (userId) => (await http.put(`/api/admin/users/${userId}/make-admin`)).data,
  deleteAdminUser: async (userId) => (await http.delete(`/api/admin/users/${userId}`)).data,
  deleteAdminPost: async (postId) => (await http.delete(`/api/admin/posts/${postId}`)).data,
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return (await http.post("/api/uploads/image", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    })).data;
  }
};
