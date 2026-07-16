export interface TimezoneOption {
  value: string;
  label: string;
}

export const TIMEZONE_OPTIONS: TimezoneOption[] = [
  // United States
  { value: "America/New_York", label: "Eastern Time (ET) - New York, Miami, Atlanta" },
  { value: "America/Chicago", label: "Central Time (CT) - Chicago, Dallas, Houston" },
  { value: "America/Denver", label: "Mountain Time (MT) - Denver, Salt Lake City" },
  { value: "America/Phoenix", label: "Mountain Time - Arizona (MT) - Phoenix" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT) - Los Angeles, Seattle, Las Vegas" },
  { value: "America/Anchorage", label: "Alaska Time (AKT) - Anchorage" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HT) - Honolulu" },

  // Canada
  { value: "America/Halifax", label: "Atlantic Time (AT) - Halifax, Nova Scotia" },
  { value: "America/St_Johns", label: "Newfoundland Time (NT) - St. John's" },

  // International
  { value: "Europe/London", label: "London (GMT/BST) - United Kingdom" },
  { value: "Europe/Paris", label: "Central Europe (CET) - Paris, Berlin, Rome" },
  { value: "Asia/Kolkata", label: "India (IST) - Mumbai, Delhi" },
  { value: "Asia/Singapore", label: "Philippines / Singapore (PHT/SGT) - Manila, Singapore" },
  { value: "Australia/Sydney", label: "Australia Eastern (AEST) - Sydney, Melbourne" },
];
