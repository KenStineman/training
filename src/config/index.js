// Application configuration
// Values come from environment variables or sensible defaults

export const config = {
  // App
  appName: import.meta.env.VITE_APP_NAME || 'Double Helix Training',
  appBaseUrl: import.meta.env.VITE_APP_BASE_URL || '/training',
  
  // Company
  companyName: import.meta.env.VITE_COMPANY_NAME || 'Double Helix LLC',
  companyUrl: import.meta.env.VITE_COMPANY_URL || 'https://double-helix.com',
  supportEmail: import.meta.env.VITE_SUPPORT_EMAIL || 'support@double-helix.com',
  
  // Default logo (can be overridden per course)
  defaultLogoUrl: import.meta.env.VITE_DEFAULT_LOGO_URL || '/training/images/logo.png',
  
  // API
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/training/api',
  
  // Feature flags
  features: {
    emailCertificates: true,
    surveyRequired: true,
  },
};

export default config;
