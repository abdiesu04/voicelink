// Global type definitions for third-party scripts

interface Window {
  fbq?: (
    action: 'track' | 'trackCustom',
    eventName: string,
    parameters?: Record<string, any>
  ) => void;
}
