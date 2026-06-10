import React from "react";
import LegalPageLayout from "./LegalPageLayout";

export default function Contact() {
  return (
    <LegalPageLayout>
      <div className="relative min-h-220 overflow-hidden">
        <h1 className="text-4xl text-white "> Contact Us</h1>
        <p className="text-white mt-2"> Last updated: May 10, 2026</p>

        <p className="text-white mt-3">
          If you have any questions, concerns, or feedback about our services,
          please don't hesitate to contact us. We value your input and are here
          to assist you in any way we can. You can reach us through the
          following channels:
        </p>
        <ul className="list-disc list-inside text-white mt-3">
          <li>
            Email: You can send us an email at{" "}
            <a
              href="mailto:support@stripme.com"
              className="text-blue-500 underline"
            >
              support@stripme.com
            </a>
          </li>
        </ul>
        <p className="text-white mt-3">
          We strive to respond to all inquiries as quickly as possible. Our
          support team is available to assist you with any questions or concerns
          you may have about our services, billing, or any other issues you may
          encounter.
        </p>
        <p className="text-white mt-3">
          Your feedback is important to us, and we are always looking for ways
          to improve our services. If you have any suggestions or ideas on how
          we can enhance your experience, please feel free to share them with
          us.
        </p>
      </div>
    </LegalPageLayout>
  );
}
