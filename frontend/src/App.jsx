import { BrowserRouter, Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";
import HomePage from "./pages/HomePage";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import PostDetailPage from "./pages/PostDetailPage";
import CreatePostPage from "./pages/CreatePostPage";
import EditPostPage from "./pages/EditPostPage";
import DashboardPage from "./pages/DashboardPage";
import AdminPage from "./pages/AdminPage";
import NotFoundPage from "./pages/NotFoundPage";
import OnboardingWizard from "./pages/OnboardingWizard";
import UserProfilePage from "./pages/UserProfilePage";
import EditProfilePage from "./pages/EditProfilePage";
import FollowListPage from "./pages/FollowListPage";
import SearchResultsPage from "./pages/SearchResultsPage";
import TagFeedPage from "./pages/TagFeedPage";

export default function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <AuthProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<LandingPage />} />
            <Route path="feed" element={<HomePage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="posts/:slug" element={<PostDetailPage />} />
            <Route path="search" element={<SearchResultsPage />} />
            <Route path="tag/:slug" element={<TagFeedPage />} />
            <Route path="u/:username" element={<UserProfilePage />} />
            <Route path="u/:username/followers" element={<FollowListPage type="followers" />} />
            <Route path="u/:username/following" element={<FollowListPage type="following" />} />

            <Route element={<ProtectedRoute />}>
              <Route path="welcome" element={<OnboardingWizard />} />
              <Route path="create" element={<CreatePostPage />} />
              <Route path="edit/:slug" element={<EditPostPage />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="settings/profile" element={<EditProfilePage />} />
            </Route>

            <Route element={<ProtectedRoute requireAdmin />}>
              <Route path="admin" element={<AdminPage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
