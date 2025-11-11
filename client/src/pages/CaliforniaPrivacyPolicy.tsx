import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function CaliforniaPrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <div className="mb-8">
          <Link href="/">
            <Button variant="outline" size="sm" data-testid="button-back-home">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 md:p-12 border border-slate-200 dark:border-slate-800">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            California Privacy Policy — Voztra
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
            Last Updated: October 21, 2025
          </p>

          <div className="prose prose-slate dark:prose-invert max-w-none">
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
              This California Privacy Policy supplements the main Privacy Policy of Voztra ("we," "our," or "us") and applies only to individuals who reside in the State of California ("consumers"). This section is provided to meet the requirements of the California Consumer Privacy Act (CCPA) and the California Privacy Rights Act (CPRA), as amended.
            </p>

            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mt-8 mb-4">
              1. Information We Collect
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
              Voztra may collect the following categories of personal information:
            </p>
            <ul className="list-disc pl-6 text-slate-700 dark:text-slate-300 space-y-2 mb-4">
              <li>
                <strong>Identifiers:</strong> such as name, email address, IP address, or general location information.
              </li>
              <li>
                <strong>Internet or Usage Data:</strong> including browser type, device information, website interactions, and cookie or analytics data.
              </li>
              <li>
                <strong>User Content:</strong> such as messages or AI conversation history stored temporarily (up to 90 days) for anonymized data analysis and service improvement.
              </li>
            </ul>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
              We do not collect or store sensitive personal information (such as race, health data, or biometric identifiers), nor do we collect financial information directly. Payments are processed securely by independent third-party providers.
            </p>

            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mt-8 mb-4">
              2. Use of Personal Information
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
              We use personal information to:
            </p>
            <ul className="list-disc pl-6 text-slate-700 dark:text-slate-300 space-y-2 mb-6">
              <li>Operate and improve the Voztra platform and its features.</li>
              <li>Provide customer support and respond to inquiries.</li>
              <li>Conduct internal analytics and service optimization.</li>
              <li>Comply with applicable laws and enforce our Terms of Service.</li>
            </ul>

            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mt-8 mb-4">
              3. Sharing and Disclosure of Information
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
              We do not sell personal information.
            </p>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
              However, we may share limited data with our parent company for any purpose under the same privacy standards described in our main Privacy Policy. We may also use common analytics and advertising services (such as Google Analytics, Meta, and Reddit Ads), which may qualify as "sharing" under California law for cross-context behavioral advertising.
            </p>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
              Consumers may opt out of this kind of data sharing as described below.
            </p>

            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mt-8 mb-4">
              4. Your Privacy Rights (California Residents)
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
              If you are a California resident, you have the right to:
            </p>
            <ul className="list-disc pl-6 text-slate-700 dark:text-slate-300 space-y-2 mb-4">
              <li>
                <strong>Access:</strong> Request disclosure of the categories and specific pieces of personal data we have collected about you.
              </li>
              <li>
                <strong>Correction:</strong> Request correction of inaccurate or outdated information.
              </li>
              <li>
                <strong>Deletion:</strong> Request deletion of personal data we have collected about you, subject to legal and operational limitations.
              </li>
              <li>
                <strong>Opt-Out of Sharing:</strong> Request that we stop sharing your data for cross-context advertising (as defined under the CPRA).
              </li>
            </ul>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
              To exercise any of these rights, please contact us at:
            </p>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
              📧 <a href="mailto:support@getvoztra.com" className="text-primary hover:underline" data-testid="link-support-email">support@getvoztra.com</a>
            </p>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
              We may verify your identity before processing any request, as permitted by California law.
            </p>

            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mt-8 mb-4">
              5. Data Retention
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
              We retain personal data only for as long as necessary to fulfill the purposes outlined above. Conversation data related to AI features is generally retained for no more than 90 days, after which it may be anonymized or deleted.
            </p>

            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mt-8 mb-4">
              6. Non-Discrimination
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
              We will not discriminate against you for exercising your privacy rights under the CCPA or CPRA.
            </p>

            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mt-8 mb-4">
              7. Updates to This Policy
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
              We may update this California Privacy Policy periodically. Updates will be reflected by an updated "Last Updated" date at the top of this page.
            </p>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
            <Link href="/">
              <Button data-testid="button-back-bottom">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Return to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
