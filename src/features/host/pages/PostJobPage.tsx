import React from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Job, JobReview, ScreeningQuestion, QueueWindow } from "@/types/job";
import PageHeader from "@/common/ui/PageHeader";
import { jobsApi } from "@/api/jobsApi";
import { GradientLoadingButton } from "@/common/ui/GradientLoadingButton";
import { StepLoadingState } from "@/common/ui/StepLoadingState";
import { toast } from "sonner";
import {
  JobForm,
  ScreeningQuestionsManager,
  QueueWindowScheduler,
  JobStepper,
  JobPublishReview,
  QualificationQuestionsStepIntro,
  JobInterviewersManager,
  STEPS
} from "../components";
import {
  getWizardResumeStep,
  isDraftJob,
  postJobWizardStorage,
} from "../utils/postJobWizardStorage";
import { getComplianceReviewState } from "../utils/compliance";
import {
  canPublishFromReview,
  getQueueWindowStepError,
  SCREENING_MESSAGES,
  showQueueWindowStepToast,
  showReviewBlockedToast,
  showValidationToast,
  validateJobCanPublish,
} from "../utils/jobPublishValidation";

const DEFAULT_JOB_DATA: Partial<Job> = {
  status: "Draft",
  screeningQuestions: [],
  queueWindows: [],
};

function getInitialWizardState(draftIdFromUrl: string | null) {
  if (draftIdFromUrl) {
    return {
      currentStep: 1,
      jobData: { ...DEFAULT_JOB_DATA, id: draftIdFromUrl },
    };
  }
  return { currentStep: 1, jobData: DEFAULT_JOB_DATA };
}

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

export default function PostJobPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const draftIdFromUrl = searchParams.get("draft");
  const isResumingDraftFromList = Boolean(draftIdFromUrl);
  const basePath = user?.role === 'interviewer' ? '/interviewer' : '/admin';
  const initialWizard = React.useMemo(
    () => getInitialWizardState(draftIdFromUrl),
    [draftIdFromUrl]
  );
  const [currentStep, setCurrentStep] = React.useState(initialWizard.currentStep);
  const [isLoading, setIsLoading] = React.useState(false);
  const [loadingMessage, setLoadingMessage] = React.useState<string | null>(null);
  const [apiErrors, setApiErrors] = React.useState<Record<string, string>>({});
  const [jobData, setJobData] = React.useState<Partial<Job>>(initialWizard.jobData);
  const [isHydratingDraft, setIsHydratingDraft] = React.useState(isResumingDraftFromList);
  const [jobReview, setJobReview] = React.useState<JobReview | null>(null);
  const [isLoadingReview, setIsLoadingReview] = React.useState(false);
  const [isReviewingQuestions, setIsReviewingQuestions] = React.useState(false);
  const [wizardSessionKey, setWizardSessionKey] = React.useState(0);

  React.useEffect(() => {
    if (user?.role === 'interviewer') {
      navigate('/interviewer/jobs', { replace: true });
      return;
    }
    if (!draftIdFromUrl) {
      postJobWizardStorage.clear();
    }
  }, [draftIdFromUrl, user?.role, navigate]);

  React.useEffect(() => {
    const wantsNewJob = (location.state as { newJob?: boolean } | null)?.newJob === true;
    if (!wantsNewJob || draftIdFromUrl) return;

    postJobWizardStorage.clear();
    setCurrentStep(1);
    setJobData({ ...DEFAULT_JOB_DATA });
    setJobReview(null);
    setApiErrors({});
    setIsHydratingDraft(false);
    setWizardSessionKey((key) => key + 1);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.key, location.pathname, location.state, draftIdFromUrl, navigate]);

  React.useEffect(() => {
    if (!draftIdFromUrl) {
      setIsHydratingDraft(false);
      return;
    }

    let cancelled = false;
    setIsHydratingDraft(true);

    (async () => {
      try {
        const { data } = await jobsApi.getJob(draftIdFromUrl);
        if (cancelled) return;

        if (!isDraftJob(data.status)) {
          navigate(`${basePath}/jobs/${draftIdFromUrl}`, { replace: true });
          return;
        }

        const resumeStep = getWizardResumeStep(data);
        const hydratedJob = {
          ...DEFAULT_JOB_DATA,
          ...data,
          screeningQuestions: data.screeningQuestions ?? [],
          queueWindows: data.queueWindows ?? [],
        };

        setJobData(hydratedJob);
        setCurrentStep(resumeStep);
      } catch (error) {
        console.error("Failed to load draft job:", error);
        toast.error("Failed to load draft. It may have been removed.");
        navigate(`${basePath}/jobs`, { replace: true });
      } finally {
        if (!cancelled) setIsHydratingDraft(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [draftIdFromUrl, basePath, navigate]);

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleJobDetailsSubmit = async (data: Partial<Job>) => {
    setIsLoading(true);
    setApiErrors({});
    try {
      if (jobData.id) {
        // Update existing draft
        const response = await jobsApi.updateJob(jobData.id, data);
        setJobData(prev => ({ ...prev, ...response.data }));
        toast.success("Job details updated successfully!");
      } else {
        // Create new draft
        const response = await jobsApi.createJob({ ...data, status: 'Draft' });
        setJobData(prev => ({ ...prev, ...response.data }));
        toast.success("Job draft created successfully!");
      }
      postJobWizardStorage.clear();
      nextStep();
    } catch (error: any) {
      console.error("Failed to save draft in API:", error);
      const errorMsg = error?.response?.data?.data || error?.response?.data?.message || "Failed to save draft.";
      const parsedErrors = parseJoiError(errorMsg);
      if (Object.keys(parsedErrors).length > 0) {
        setApiErrors(parsedErrors);
        toast.error("Please correct the form errors below.");
      } else {
        toast.error(formatApiError(errorMsg));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuestionsUpdate = React.useCallback((questions: ScreeningQuestion[]) => {
    setJobData(prev => ({ ...prev, screeningQuestions: questions }));
  }, []);

  const handleQuestionsSubmit = async () => {
    if (!validateJobCanPublish({ screeningQuestions: jobData.screeningQuestions }).hasQuestions) {
      showValidationToast("Qualification questions required", SCREENING_MESSAGES.required);
      return;
    }

    setIsLoading(true);
    setLoadingMessage("Saving qualification questions...");
    try {
      if (jobData.id) {
        const response = await jobsApi.saveScreeningQuestions(
          jobData.id,
          jobData.screeningQuestions || []
        );
        setJobData((prev) => ({
          ...prev,
          ...response.data,
        }));
        toast.success("Qualification questions saved successfully!");
      }
      nextStep();
    } catch (error: any) {
      console.error("Failed to save questions on API:", error);
      const errorMsg = error?.response?.data?.data || error?.response?.data?.message || "Failed to save questions. Please try again.";
      toast.error(formatApiError(errorMsg));
    } finally {
      setIsLoading(false);
      setLoadingMessage(null);
    }
  };

  const handleWindowsUpdate = React.useCallback((windows: QueueWindow[]) => {
    setJobData(prev => ({ ...prev, queueWindows: windows }));
  }, []);

  const windowsStepError = getQueueWindowStepError(jobData.queueWindows || []);
  const canContinueFromWindows = !windowsStepError;

  const handleWindowsSubmit = async () => {
    const windows = jobData.queueWindows || [];
    const stepError = getQueueWindowStepError(windows);
    if (stepError) {
      showQueueWindowStepToast(windows);
      return;
    }

    setIsLoading(true);
    try {
      if (jobData.id) {
        const response = await jobsApi.saveQueueWindows(jobData.id, windows);
        setJobData(prev => ({ ...prev, ...response.data }));

        if (getQueueWindowStepError(response.data.queueWindows || [])) {
          showQueueWindowStepToast(response.data.queueWindows || []);
          return;
        }

        toast.success("Queue windows saved successfully!");
      }
      nextStep();
    } catch (error: any) {
      console.error("Failed to save queue windows on API:", error);
      const errorMsg = error?.response?.data?.data || error?.response?.data?.message || "Failed to save queue windows. Please try again.";
      toast.error(formatApiError(errorMsg));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchJobReview = React.useCallback(async (jobId: string) => {
    setIsLoadingReview(true);
    try {
      const compliance = await jobsApi.runComplianceReview(jobId);
      setJobData((prev) => ({
        ...prev,
        screeningQuestions: compliance.data.screeningQuestions,
      }));
      const { data } = await jobsApi.getJobReview(jobId);
      setJobReview(data);
    } catch (error) {
      console.error("Failed to load job review:", error);
      setJobReview(null);
      toast.error("Failed to load publish review.");
    } finally {
      setIsLoadingReview(false);
    }
  }, []);

  React.useEffect(() => {
    if (currentStep !== 5 || !jobData.id) return;
    fetchJobReview(jobData.id);
  }, [currentStep, jobData.id, fetchJobReview]);

  const handleFinalSubmit = async () => {
    if (!jobData.id) {
      toast.error("Save the job draft before publishing.");
      return;
    }

    const complianceState = getComplianceReviewState(jobData.screeningQuestions || []);
    if (!complianceState.allowsPublish) {
      showValidationToast("Cannot publish yet", complianceState.requirementDetail);
      return;
    }

    setIsLoading(true);
    setLoadingMessage("Publishing your job...");
    try {
      let review = jobReview;
      if (!review) {
        setLoadingMessage("Checking publish requirements...");
        const { data } = await jobsApi.getJobReview(jobData.id);
        review = data;
        setJobReview(data);
      }

      if (!review || !canPublishFromReview(review)) {
        if (review) showReviewBlockedToast(review);
        else toast.error("Could not verify publish requirements. Try again.");
        return;
      }

      setLoadingMessage("Publishing your job...");
      const publishedJobId = jobData.id;
      await jobsApi.publishJob(publishedJobId);
      postJobWizardStorage.clear();
      navigate(`${basePath}/jobs/${publishedJobId}`, { replace: true });
      toast.success("Job published successfully!");
    } catch (error: any) {
      console.error("Failed to publish job:", error);
      const errorMsg =
        error?.response?.data?.data ||
        error?.response?.data?.message ||
        "Failed to publish job. Please try again.";
      toast.error(formatApiError(errorMsg));
    } finally {
      setIsLoading(false);
      setLoadingMessage(null);
    }
  };

  return (
    <div className="space-y-8 w-full pb-20 pt-4 md:pt-0 animate-page-fade-in">
      <div className="flex flex-col gap-3">
        <PageHeader
          tag={`Step ${currentStep} of ${STEPS.length}`}
          title={
            <span className="bg-gradient-to-r from-[#FF512F] to-[#FF7A00] bg-clip-text text-transparent">
              {isResumingDraftFromList ? "CONTINUE DRAFT" : "POST NEW JOB"}
            </span>
          }
        />
        <p className="text-gray-500 text-xs font-medium -mt-2">
          Follow the steps below to set up your interactive waiting room.
        </p>
      </div>

      <JobStepper currentStep={currentStep} />

      <div className="bg-white border border-gray-100 rounded-[1.5rem] md:rounded-[2.5rem] p-5 md:p-12 shadow-2xl shadow-gray-200/40">
        {isHydratingDraft ? (
          <StepLoadingState message="Restoring your draft..." />
        ) : (
          <>
            {currentStep === 1 && (
              <JobForm
                key={`job-form-${wizardSessionKey}`}
                initialData={jobData}
                onSubmit={handleJobDetailsSubmit}
                isLoading={isLoading}
                apiErrors={apiErrors}
                onCancel={() => {
                  postJobWizardStorage.clear();
                  navigate(`${basePath}/jobs`);
                }}
              />
            )}

            {currentStep === 2 &&
              (isLoading && loadingMessage ? (
                <StepLoadingState message={loadingMessage} />
              ) : (
                <div className="w-full space-y-6 md:space-y-8">
                  <QualificationQuestionsStepIntro />
                  <ScreeningQuestionsManager
                    key={`questions-${wizardSessionKey}`}
                    jobId={jobData.id || "new"}
                    initialQuestions={jobData.screeningQuestions}
                    onQuestionsChange={handleQuestionsUpdate}
                    runComplianceInWizard={!!jobData.id}
                    disabled={isLoading}
                    onReviewingChange={setIsReviewingQuestions}
                  />
                  <div className="flex items-center justify-between gap-3 pt-8 border-t border-gray-50 w-full max-w-md mx-auto">
                    <button
                      onClick={prevStep}
                      disabled={isLoading || isReviewingQuestions}
                      className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-[10px] md:text-sm font-bold uppercase tracking-widest text-gray-600 hover:text-gray-900 hover:border-gray-400 hover:bg-gray-50 rounded-xl shadow-sm cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      BACK
                    </button>
                    <GradientLoadingButton disabled={isReviewingQuestions} label="NEXT STEP" isLoading={isLoading} onClick={handleQuestionsSubmit} />
                  </div>
                </div>
              ))}

            {currentStep === 3 && (
              <div className="space-y-8">
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-gray-900 uppercase tracking-widest">Queue Windows</h3>
                  <p className="text-gray-500 text-sm">Schedule when your waiting room will be open for candidates.</p>
                </div>
                <QueueWindowScheduler
                  key={`windows-${wizardSessionKey}`}
                  jobId={jobData.id || "new"}
                  initialWindows={jobData.queueWindows}
                  onWindowsChange={handleWindowsUpdate}
                />
                <div className="flex items-center justify-between gap-3 pt-8 border-t border-gray-50 w-full max-w-md mx-auto">
                  <button onClick={prevStep} disabled={isLoading} className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-[10px] md:text-sm font-bold uppercase tracking-widest text-gray-600 hover:text-gray-900 hover:border-gray-400 hover:bg-gray-50 rounded-xl shadow-sm cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed">BACK</button>
                  <GradientLoadingButton
                    label="NEXT STEP"
                    isLoading={isLoading}
                    disabled={!canContinueFromWindows}
                    title={windowsStepError ?? undefined}
                    onClick={handleWindowsSubmit}
                  />
                </div>
                {windowsStepError && (
                  <p className="text-center text-[11px] font-medium text-amber-700 max-w-md mx-auto px-2">
                    {windowsStepError}
                  </p>
                )}
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-8">
                <JobInterviewersManager
                  key={`interviewers-${wizardSessionKey}`}
                  jobId={jobData.id || "new"}
                />
                <div className="flex items-center justify-between gap-3 pt-8 border-t border-gray-50 w-full max-w-md mx-auto">
                  <button onClick={prevStep} disabled={isLoading} className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-[10px] md:text-sm font-bold uppercase tracking-widest text-gray-600 hover:text-gray-900 hover:border-gray-400 hover:bg-gray-50 rounded-xl shadow-sm cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed">BACK</button>
                  <GradientLoadingButton
                    label="NEXT STEP"
                    isLoading={isLoading}
                    onClick={nextStep}
                  />
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <JobPublishReview
                review={jobReview}
                screeningQuestions={jobData.screeningQuestions}
                jobData={jobData}
                isLoadingReview={isLoadingReview}
                isPublishing={isLoading}
                publishingMessage={loadingMessage}
                onBack={prevStep}
                onPublish={handleFinalSubmit}
                onRetry={jobData.id ? () => fetchJobReview(jobData.id!) : undefined}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
