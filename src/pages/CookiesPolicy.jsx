import React from "react";
import LegalPageLayout from "./LegalPageLayout";

export default function CookiesPolicy() {
  return (
    <LegalPageLayout>
      <div className="relative min-h-screen overflow-hidden">
        <h1 className="text-4xl text-white "> Cookie Policy</h1>
        <p className="text-white mt-2"> Last updated: May 10, 2026</p>

        <p className="text-white mt-3">
          The people we encounter shape our experiences and perspectives.
          StripPals.com is an independent online social platform serving a broad
          and diverse adult audience. Our community includes single men and
          women, couples, married individuals, and older singles, among others.
          The platform is fully compatible with desktop computers, tablets, and
          smartphones, and is designed to be completely discreet.
        </p>

        <h2 className="text-2xl text-white mt-4"> What is StripPals.com?</h2>

        <p className="text-white mt-2">
          StripPals.com is an adult-oriented online entertainment platform
          created for consensual adult enjoyment. Many of our members are adult
          users seeking to explore fantasies and engage in imaginative,
          pleasure-focused interactions. For additional information about our
          adult fantasy services, please visit our website.
        </p>

        <p className="text-white mt-2">
          StripPals.com (the “Website”) uses cookies and similar technologies to
          store information on your device. This Cookie Policy explains how and
          why cookies are used and may be updated from time to time without
          prior notice. Any changes will be published on the Website. We
          encourage you to review this policy periodically to stay informed.
        </p>

        <p className="text-white mt-2">
          By using the Website, you consent to the use of cookies in accordance
          with this Cookie Policy. If you do not wish to accept cookies, you may
          disable them through your browser settings or discontinue use of the
          Website.
        </p>

        <ol>
          <li className="text-2xl text-white mt-4"> What are cookies?</li>
          <p className="text-white mt-2">
            Cookies are small text files that a website places on your browser
            or device when you visit. They allow the website to recognize your
            device, remember your preferences, and store certain information
            such as pages visited, form entries, selections made, and the date
            and time of your visit.
          </p>

          <li className="text-2xl text-white mt-4">Types of cookies</li>
          <p className="text-white mt-2">
            There are two primary categories of cookies:
          </p>

          <h3 className="text-white mt-3">Session cookies</h3>

          <p className="text-white mt-2">
            Session cookies are temporary and are deleted when you close your
            browser. They enable the Website to function properly during a
            single browsing session by remembering actions as you move from page
            to page. For example, they may retain information about items placed
            in a shopping cart.
          </p>

          <h3 className="text-white mt-3"> Persistent cookies</h3>

          <p className="text-white mt-2">
            Persistent cookies remain on your device after your browser is
            closed and are stored until they expire or are manually deleted.
            These cookies allow the Website to recognize you when you return,
            remember your preferences, and personalize your experience.
          </p>

          <p className="text-white mt-2">
            In addition to session and persistent cookies, cookies may also be
            set by the Website to collect information that helps us improve
            performance and user experience.
          </p>

          <li className="text-2xl text-white mt-4"> Our use of cookies</li>
        </ol>
      </div>
    </LegalPageLayout>
  );
}
