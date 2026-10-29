/** The developer's report endpoint (chompbook.online/api/report, ADR-025/033); empty in builds without it. */
export const REPORT_URL: string = import.meta.env.VITE_REPORT_URL ?? "";
