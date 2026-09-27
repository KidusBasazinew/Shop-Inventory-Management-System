export function getErrorMessage(
  error,
  fallback = "Something went wrong. Please try again.",
) {
  const responseData = error?.response?.data;
  const candidate =
    responseData?.message ?? responseData?.error ?? error?.message;

  if (typeof candidate === "string" && candidate.trim()) return candidate;
  if (candidate && typeof candidate === "object") {
    if (typeof candidate.message === "string" && candidate.message.trim()) {
      return candidate.message;
    }
    if (typeof candidate.error === "string" && candidate.error.trim()) {
      return candidate.error;
    }
  }

  return fallback;
}
