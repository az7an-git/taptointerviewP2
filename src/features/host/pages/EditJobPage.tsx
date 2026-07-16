import { ArrowLeft } from "lucide-react";
import { StepLoadingState } from "@/common/ui/StepLoadingState";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import PageHeader from "@/common/ui/PageHeader";
import { JobForm } from "../components";
import { Job } from "@/types/job";
import { jobsApi } from "@/api/jobsApi";
import { toast } from "sonner";
import React from "react";

const formatApiError = (msg: any): string => {
  if (typeof msg !== 'string') return "An unexpected error occurred. Please check your inputs.";

  let clean = msg.replace(/"/g, "");
  clean = clean.replace(/salary_range_from/g, "Minimum salary");
  clean = clean.replace(/salary_range_to/g, "Maximum salary");
  clean = clean.replace(/employment_type/g, "Employment type");
  clean = clean.replace(/title/g, "Job title");
  clean = clean.replace(/location/g, "Location");
  clean = clean.replace(/department/g, "Department");
  clean = clean.replace(/description/g, "Description");
  clean = clean.replace(/requirements/g, "Requirements");

  return clean.charAt(0).toUpperCase() + clean.slice(1);
};

const parseJoiError = (msg: any): Record<string, string> => {
  if (typeof msg !== 'string') return {};

  if (msg.includes('salary_range_from')) {
    return { salary: "Minimum salary must be greater than or equal to 50." };
  }
  if (msg.includes('salary_range_to')) {
    return { salary: "Maximum salary must be greater than or equal to 100." };
  }
  if (msg.includes('title')) {
    return { title: "Job title is invalid." };
  }
  if (msg.includes('location')) {
    return { location: "Location is invalid." };
  }
  if (msg.includes('employment_type')) {
    return { type: "Employment type is invalid." };
  }
  if (msg.includes('department')) {
    return { department: "Department is invalid." };
  }
  if (msg.includes('description')) {
    return { description: "Description is invalid." };
  }
  if (msg.includes('requirements')) {
    return { requirements: "Requirements are invalid." };
  }

  return {};
};

export default function EditJobPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const fromSource = location.state?.from || "details";
  const basePath = user?.role === 'interviewer' ? '/interviewer' : '/admin';
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [job, setJob] = React.useState<Job | null>(null);
  const [apiErrors, setApiErrors] = React.useState<Record<string, string>>({});
  const closedRedirectHandled = React.useRef(false);

  const isClosedJob = (status: string) => status.toLowerCase() === "closed";

  React.useEffect(() => {
    if (user?.role === 'interviewer') {
      navigate('/interviewer/jobs', { replace: true });
      return;
    }

    const fetchJob = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const response = await jobsApi.getJob(id);
        const fetchedJob = response.data;
        if (isClosedJob(fetchedJob.status)) {
          if (!closedRedirectHandled.current) {
            closedRedirectHandled.current = true;
            toast.error("Closed jobs are archived and cannot be edited.");
          }
          navigate(`${basePath}/jobs`);
          return;
        }
        setJob(fetchedJob);
      } catch (error) {
        console.error("Failed to fetch job for editing:", error);
        toast.error("Job not found or failed to load");
        navigate(`${basePath}/jobs`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchJob();
  }, [id, navigate, basePath, user?.role]);

  const handleSubmit = async (data: Partial<Job>) => {
    setIsSaving(true);
    setApiErrors({});
    try {
      await jobsApi.updateJob(id!, data);
      toast.success("Job updated successfully");
      if (fromSource === "list") {
        navigate(`${basePath}/jobs`);
      } else {
        navigate(`${basePath}/jobs/${id}`);
      }
    } catch (error: any) {
      console.error("Failed to update job via API:", error);
      const errorMsg = error?.response?.data?.data || error?.response?.data?.message || "Failed to update job.";
      const parsedErrors = parseJoiError(errorMsg);
      if (Object.keys(parsedErrors).length > 0) {
        setApiErrors(parsedErrors);
        toast.error("Please correct the form errors below.");
      } else {
        toast.error(formatApiError(errorMsg));
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <StepLoadingState message="Loading job details..." />;
  }

  if (!job) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 min-w-0">
        <Link
          to={fromSource === "list" ? `${basePath}/jobs` : `${basePath}/jobs/${id}`}
          className="shrink-0 p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors group touch-manipulation mt-1 md:mt-2"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500 group-hover:text-[#FF512F]" />
        </Link>
        <div className="flex-1 min-w-0">
          <PageHeader
            tag="Edit Job Posting"
            title={
              <>
                EDIT <span className="bg-gradient-to-r from-[#FF512F] to-[#FF7A00] bg-clip-text text-transparent">JOB DETAILS</span>
              </>
            }
          />
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 shadow-sm">
        <JobForm initialData={job} onSubmit={handleSubmit} isLoading={isSaving} apiErrors={apiErrors} />
      </div>
    </div>
  );
}
