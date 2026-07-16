import React from "react";
import { Job } from "@/types/job";
import { Globe, Briefcase, Coins, FileText, Hash } from "lucide-react";
import RadioGroup from "@/common/components/ui/RadioGroup";
import { GradientLoadingButton } from "@/common/ui/GradientLoadingButton";

interface JobFormProps {
  initialData?: Partial<Job>;
  onSubmit: (data: Partial<Job>) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  apiErrors?: Record<string, string>;
}

export default function JobForm({ initialData, onSubmit, onCancel, isLoading, apiErrors }: JobFormProps) {
  const [formData, setFormData] = React.useState<Partial<Job>>({
    title: initialData?.title || "",
    description: initialData?.description || "",
    location: initialData?.location || "",
    type: initialData?.type || "Full-time",
    department: initialData?.department || "",
    requirements: initialData?.requirements || "",
    salaryMin: initialData?.salaryMin || 0,
    salaryMax: initialData?.salaryMax || 0,
    status: initialData?.status || "Draft",
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : Math.max(0, Number(value))) : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const min = Number(formData.salaryMin || 0);
    const max = Number(formData.salaryMax || 0);

    if (max <= min) {
      setErrors({ salary: "Maximum salary must be greater than minimum salary" });
      return;
    }

    const trimmedDepartment = (formData.department ?? "").trim();
    const fieldErrors: Record<string, string> = {};
    if (!trimmedDepartment) fieldErrors.department = "Department is required.";
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setErrors({});

    const finalRequirements = (formData.requirements || "").trim() === "" ? undefined : formData.requirements;

    onSubmit({
      ...formData,
      department: trimmedDepartment,
      requirements: finalRequirements as unknown as string,
    });
  };

  const employmentTypeOptions = [
    { value: "Full-time", label: "Full-time" },
    { value: "Part-time", label: "Part-time" },
    { value: "Contract", label: "Contract" },
    { value: "Freelance", label: "Freelance" },
    { value: "Internship", label: "Internship" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col lg:grid lg:grid-cols-2 gap-3 md:gap-4">
        {/* Title */}
        <div className="space-y-1.5 lg:col-span-2">
          <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest flex items-center gap-1.5 px-1">
            <Briefcase className="w-3.5 h-3.5 text-[#FF512F]" />
            Job Title
            <span className="text-red-500 font-semibold" aria-hidden="true">
              *
            </span>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g. Senior Backend Engineer"
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF512F]/20 focus:border-[#FF512F] transition-all outline-none font-medium text-sm"
            required
          />
          <div className="min-h-[16px]">
            {apiErrors?.title && (
              <p className="text-[10px] font-bold text-red-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                {apiErrors?.title}
              </p>
            )}
          </div>
        </div>

        {/* Location */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest flex items-center gap-1.5 px-1">
            <Globe className="w-3.5 h-3.5 text-[#FF512F]" />
            Location
            <span className="text-red-500 font-semibold" aria-hidden="true">
              *
            </span>
          </label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="Remote, NYC / Hybrid..."
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF512F]/20 focus:border-[#FF512F] transition-all outline-none font-medium text-sm"
            required
          />
          <div className="min-h-[16px]">
            {apiErrors?.location && (
              <p className="text-[10px] font-bold text-red-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                {apiErrors?.location}
              </p>
            )}
          </div>
        </div>

        {/* Department */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest flex items-center gap-1.5 px-1">
            <Hash className="w-3.5 h-3.5 text-[#FF512F]" />
            Department
            <span className="text-red-500 font-semibold" aria-hidden="true">
              *
            </span>
          </label>
          <input
            type="text"
            name="department"
            value={formData.department}
            onChange={handleChange}
            placeholder="e.g. Engineering, Sales..."
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF512F]/20 focus:border-[#FF512F] transition-all outline-none font-medium text-sm"
            required
          />
          <div className="min-h-[16px]">
            {(errors.department || apiErrors?.department) && (
              <p className="text-[10px] font-bold text-red-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                {errors.department || apiErrors?.department}
              </p>
            )}
          </div>
        </div>

        {/* Employment Type — full width, compact grid */}
        <div className="space-y-1.5 lg:col-span-2">
          <RadioGroup
            label="Employment Type"
            name="employment-type"
            icon={Briefcase}
            orientation="grid"
            value={formData.type || ''}
            options={employmentTypeOptions}
            onChange={(val) => setFormData(prev => ({ ...prev, type: val }))}
          />
          <div className="min-h-[16px]">
            {apiErrors?.type && (
              <p className="text-[10px] font-bold text-red-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                {apiErrors?.type}
              </p>
            )}
          </div>
        </div>

        {/* Salary Range */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest flex items-center gap-1.5 px-1">
            <Coins className="w-3.5 h-3.5 text-[#FF512F]" />
            Salary Range
          </label>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
              <input
                type="number"
                name="salaryMin"
                value={formData.salaryMin || ''}
                onChange={handleChange}
                min={0}
                placeholder="From"
                className="w-full pl-7 pr-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF512F]/20 focus:border-[#FF512F] transition-all outline-none font-bold text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            <span className="hidden sm:block text-gray-400 font-bold">-</span>
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
              <input
                type="number"
                name="salaryMax"
                value={formData.salaryMax || ''}
                onChange={handleChange}
                min={0}
                placeholder="To"
                className="w-full pl-7 pr-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF512F]/20 focus:border-[#FF512F] transition-all outline-none font-bold text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>
          <div className="min-h-[16px]">
            {(errors.salary || apiErrors?.salary) && (
              <p className="text-[10px] font-bold text-red-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                {errors.salary || apiErrors?.salary}
              </p>
            )}
          </div>
        </div>

        {/* Job Description */}
        <div className="space-y-1.5 lg:col-span-2">
          <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest flex items-center gap-1.5 px-1">
            <FileText className="w-3.5 h-3.5 text-[#FF512F]" />
            Job Description
            <span className="text-red-500 font-semibold" aria-hidden="true">
              *
            </span>
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe the role, responsibilities, and what success looks like..."
            rows={5}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF512F]/20 focus:border-[#FF512F] transition-all outline-none resize-none font-medium text-sm"
            required
          />
          <div className="min-h-[16px]">
            {apiErrors?.description && (
              <p className="text-[10px] font-bold text-red-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                {apiErrors?.description}
              </p>
            )}
          </div>
        </div>

        {/* Requirements */}
        <div className="space-y-1.5 lg:col-span-2">
          <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest flex items-center gap-1.5 px-1">
            <FileText className="w-3.5 h-3.5 text-[#FF512F]" />
            Requirements
            <span className="text-gray-400 text-[9px] font-medium normal-case tracking-normal">(optional)</span>
          </label>
          <textarea
            name="requirements"
            value={formData.requirements}
            onChange={handleChange}
            placeholder="List the key requirements and qualifications..."
            rows={5}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF512F]/20 focus:border-[#FF512F] transition-all outline-none resize-none font-medium text-sm"
          />
          <div className="min-h-[16px]">
            {(errors.requirements || apiErrors?.requirements) && (
              <p className="text-[10px] font-bold text-red-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                {errors.requirements || apiErrors?.requirements}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 pt-6 border-t border-gray-50 w-full max-w-md mx-auto">
        <button
          type="button"
          onClick={onCancel || (() => window.history.back())}
          className="flex-1 px-4 py-2 bg-white border border-gray-200 text-[10px] md:text-sm font-bold uppercase tracking-widest text-gray-600 hover:text-gray-900 hover:border-gray-400 hover:bg-gray-50 rounded-lg shadow-sm transition-all cursor-pointer"
        >
          CANCEL
        </button>
        <GradientLoadingButton
          type="submit"
          label={initialData?.id ? "UPDATE JOB" : "NEXT STEP"}
          isLoading={isLoading}
        />
      </div>
    </form>
  );
}
