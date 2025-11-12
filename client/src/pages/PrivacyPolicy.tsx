import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-6 py-12 pt-24 max-w-4xl">
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
            Privacy Policy for Voztra
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
            Last Updated: October 21, 2025
          </p>

          <div className="prose prose-slate dark:prose-invert max-w-none">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mt-8 mb-4">
              1. Introduction
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
              Welcome to Voztra ("we," "our," or "us"). We are committed to protecting your privacy and ensuring that your personal information is handled responsibly. This Privacy Policy describes how we collect, use, share, and protect your data when you access or use our website, applications, and related services (collectively, the "Services").
            </p>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
              By using Voztra, you agree to the terms of this Privacy Policy.
            </p>

            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mt-8 mb-4">
              2. Information We Collect
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
              We may collect the following types of information from you when you use our Services:
            </p>
            <ul className="list-disc pl-6 text-slate-700 dark:text-slate-300 space-y-2 mb-6">
              <li>
                <strong>Personal Information:</strong> such as your name, email address, organization, and any other details you provide during registration, inquiries, or communication.
              </li>
              <li>
                <strong>Usage Data:</strong> including your IP address, browser type, device information, and how you interact with our platform.
              </li>
              <li>
                <strong>User-Generated Content:</strong> such as data or content you provide through Voztra's tools, features, or communication channels.
              </li>
              <li>
                <strong>Cookies and Tracking Data:</strong> to enhance functionality, analyze usage, and personalize your experience.
              </li>
            </ul>

            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mt-8 mb-4">
              3. How We Use Your Information
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
              We use your information to:
            </p>
            <ul className="list-disc pl-6 text-slate-700 dark:text-slate-300 space-y-2 mb-6">
              <li>Operate, maintain, and improve the Voztra platform.</li>
              <li>Provide customer support and respond to your requests.</li>
              <li>Communicate service updates, feature announcements, or policy notices.</li>
              <li>Personalize your experience and enhance platform performance.</li>
              <li>Comply with applicable legal and regulatory obligations.</li>
            </ul>

            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mt-8 mb-4">
              4. Data Sharing and Disclosure
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
              We value your privacy and limit data sharing as follows:
            </p>
            <ul className="list-disc pl-6 text-slate-700 dark:text-slate-300 space-y-2 mb-6">
              <li>
                <strong>Parent Company:</strong> We may share your data with our parent company for any purpose. This sharing is governed by the same privacy and data protection standards outlined in this policy.
              </li>
              <li>
                <strong>Third Parties:</strong> We do not sell, rent, or share your personal data with any third parties for marketing, advertising, or unrelated purposes.
              </li>
              <li>
                <strong>Legal Compliance:</strong> We may disclose information when required by law, regulation, or legal process.
              </li>
            </ul>

            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mt-8 mb-4">
              5. Data Retention
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
              We retain your personal data only as long as necessary to provide our Services, meet legal requirements, resolve disputes, and enforce our agreements.
            </p>

            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mt-8 mb-4">
              6. Your Rights
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
              You have the right to:
            </p>
            <ul className="list-disc pl-6 text-slate-700 dark:text-slate-300 space-y-2 mb-4">
              <li>Access the personal data we hold about you.</li>
              <li>Request correction of any inaccurate or incomplete information.</li>
              <li>Request deletion of your personal data ("Right to be Forgotten").</li>
            </ul>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
              To exercise these rights, please contact us at{" "}
              <a href="mailto:support@getvoztra.com" className="text-primary hover:underline" data-testid="link-support-email">support@getvoztra.com</a>.
              We will respond promptly and remove your data unless retention is required by law.
            </p>

            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mt-8 mb-4">
              7. Data Security
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
              We use administrative, technical, and physical safeguards to protect your information from unauthorized access, alteration, or disclosure.
            </p>

            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mt-8 mb-4">
              8. Children's Privacy
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
              Voztra is not intended for use by individuals under the age of 16. We do not knowingly collect personal data from minors.
            </p>

            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mt-8 mb-4">
              9. Changes to This Policy
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
              We may update this Privacy Policy periodically. Any updates will be reflected by an updated "Last Updated" date on our website.
            </p>

            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mt-8 mb-4">
              10. Contact Us
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
              If you have questions, concerns, or data-related requests, please contact us at:
            </p>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
              📧 <a href="mailto:support@getvoztra.com" className="text-primary hover:underline" data-testid="link-support-email-footer">support@getvoztra.com</a>
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
