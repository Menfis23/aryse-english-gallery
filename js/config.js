/* =========================================================
   config.js — settings you can change without touching code.
   ========================================================= */
const CONFIG = {
  // Placeholder name until the real name is decided.
  siteName: "English Activity Gallery",
  orgLine: "for ARYSE counselors",

  // "Add your own": link to the Google Form counselors fill in.
  // Leave empty until the form exists (see README).
  formUrl: "",

  // The Google Form's field IDs, so the site can fill the form in for
  // the counselor (Form menu > Get pre-filled link; see README).
  formFields: {
    type: "", title: "", age: "", level: "", minutes: "",
    materials: "", steps: "", phrases: "", author: ""
  },

  // The Google Sheet behind that form, published as CSV
  // (File > Share > Publish to web > CSV). Leave empty until ready.
  sheetCsvUrl: "",

  // true  = only show rows where the "Approved" column says "yes"
  // false = show every submission right away
  requireApproval: true
};
