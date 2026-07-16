import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { LoginPage, RegisterPage, AcceptInvitePage, ForgotPasswordPage, ResetPasswordPage } from "../features/auth/pages";
import AuthLayout from "../layouts/AuthLayout";
import AppLayout from "../layouts/AppLayout";
import { DashboardPage, JobsPage, JobDetailPage, TeamPage, SettingsPage, PostJobPage, EditJobPage, CreditsPage, MyQueuePage, PaymentStatusPage } from "../features/host/pages";
import { AdmitPage, CompanyJobsPage, DetailsPage, ExpiredPage, ParticipantJobDetailPage, QueueReservePage, QueueReleasePage, QueueStatusPage, ScreeningQuestionsPage, SessionEntryPage } from "../features/participant/pages";
import ProtectedRoute from "./ProtectedRoute";
import RequireParticipantFlow from "./RequireParticipantFlow";
import RequirePermission from "./RequirePermission";
import { PERMISSIONS } from "@/common/utils/permissions";
import NotFoundPage from "../common/pages/NotFoundPage";
import ErrorPage from "../common/pages/ErrorPage";
import LegacyCalledRedirect from "./LegacyCalledRedirect";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },
  {
    element: <AuthLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "/login",
        element: <LoginPage />,
      },
      {
        path: "/signup",
        element: <RegisterPage />,
      },
      {
        path: "/company/invite/accept",
        element: <AcceptInvitePage />,
      },
      {
        path: "/forgot-password",
        element: <ForgotPasswordPage />,
      },
      {
        path: "/reset-password",
        element: <ResetPasswordPage />,
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "/admin",
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: <Navigate to="dashboard" replace />,
          },
          {
            path: "dashboard",
            element: <DashboardPage />,
          },
          {
            path: "jobs",
            element: <JobsPage />,
          },
          {
            path: "queue",
            element: <MyQueuePage />,
          },
          {
            path: "jobs/post",
            element: <PostJobPage />,
          },
          {
            path: "jobs/:id",
            element: <JobDetailPage />,
          },
          {
            path: "jobs/:id/edit",
            element: <EditJobPage />,
          },
          {
            element: <RequirePermission permission={PERMISSIONS.MANAGE_TEAM} />,
            children: [
              {
                path: "team",
                element: <TeamPage />,
              },
            ],
          },
          {
            path: "settings",
            element: <SettingsPage />,
          },
          {
            path: "credits",
            element: <CreditsPage />,
          },
        ],
      },
      {
        path: "/interviewer",
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: <Navigate to="dashboard" replace />,
          },
          {
            path: "dashboard",
            element: <DashboardPage />,
          },
          {
            path: "jobs",
            element: <JobsPage />,
          },
          {
            path: "queue",
            element: <MyQueuePage />,
          },
          {
            path: "jobs/post",
            element: <PostJobPage />,
          },
          {
            path: "jobs/:id",
            element: <JobDetailPage />,
          },
          {
            path: "jobs/:id/edit",
            element: <EditJobPage />,
          },
          {
            path: "settings",
            element: <SettingsPage />,
          },
        ],
      },
    ],
  },
  {
    path: "/company/:slug",
    errorElement: <NotFoundPage />,
    children: [
      {
        path: "",
        element: <CompanyJobsPage />,
      },
      {
        path: "job/:jobId",
        element: <ParticipantJobDetailPage />,
      },
      {
        path: "screen",
        element: (
          <RequireParticipantFlow requirement="job">
            <ScreeningQuestionsPage />
          </RequireParticipantFlow>
        ),
      },
      {
        path: "details",
        element: (
          <RequireParticipantFlow requirement="screeningPassed">
            <DetailsPage />
          </RequireParticipantFlow>
        ),
      },
      {
        path: "status",
        element: (
          <RequireParticipantFlow requirement="participant">
            <QueueStatusPage />
          </RequireParticipantFlow>
        ),
      },
      {
        path: "called",
        element: <LegacyCalledRedirect />,
      },
      {
        path: "expired",
        element: <ExpiredPage />,
      },
      {
        path: "session",
        element: (
          <RequireParticipantFlow requirement="participant">
            <SessionEntryPage />
          </RequireParticipantFlow>
        ),
      },
    ],
  },
  {
    // Magic link from email: /admit?token=<signed-token>
    // No slug required — token carries all context
    path: "/admit",
    element: <AdmitPage />,
  },
  {
    // N05 email: Reserve My Spot
    path: "/queue/reserve",
    element: <QueueReservePage />,
  },
  {
    // N05 email: Release My Position
    path: "/queue/release",
    element: <QueueReleasePage />,
  },
  {
    path: "/billing/payment-status/:status",
    element: <PaymentStatusPage />,
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

export default function AppRoutes() {
  return <RouterProvider router={router} />;
}
