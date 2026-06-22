import React from "react";
import LegalPageLayout from "./LegalPageLayout";

export default function DMCA() {
  return (
    <LegalPageLayout>
      <div className="relative min-h-screen overflow-hidden">
        <h1 className="text-4xl text-white "> DMCA Notice</h1>
        <p className="text-white mt-2"> Last updated: May 10, 2026</p>

        <ol>
          <li className="text-2xl text-white mt-4">Overview</li>
          <p className="text-white mt-2">
            StripPals.com respects the intellectual property rights of others
            and is committed to complying with the Digital Millennium Copyright
            Act (DMCA). If you believe that your copyrighted work has been
            infringed upon on our platform, please follow the instructions below
            to submit a DMCA notice.
          </p>

          <li className="text-2xl text-white mt-4">
            Reporting Copyright Infringement
          </li>
          <p className="text-white mt-2">
            To report a copyright infringement, please send a written notice to
            our designated DMCA agent at the following address:
          </p>
          <address className="text-white mt-2 not-italic">
            Name: [Company Name] <br />
            Address: [Company Address] <br />
            Phone: [Phone Number] <br />
            Email: support@strippals.com
          </address>
          <p className="text-white mt-2">
            Your notice must include the following information:
          </p>
          <ul className="list-disc list-inside text-white mt-2">
            <li>
              A physical or electronic signature of the copyright owner or
              authorized agent
            </li>
            <li>
              Identification of the copyrighted work claimed to have been
              infringed
            </li>
            <li>
              Identification of the material that is claimed to be infringing
              and where it is located on the site
            </li>
            <li>
              Your contact information, including address, telephone number, and
              email address
            </li>
            <li>
              A statement that you have a good faith belief that the use of the
              material in the manner complained of is not authorized by the
              copyright owner, its agent, or the law
            </li>
            <li>
              A statement that the information in the notification is accurate,
              and under penalty of perjury, that you are authorized to act on
              behalf of the copyright owner
            </li>
          </ul>

          <li className="text-2xl text-white mt-4">Content Removal</li>
          <p className="text-white mt-2">
            Upon receipt of a valid DMCA notice, StripPals.com will promptly
            remove or disable access to the allegedly infringing material. We
            will also notify the user who uploaded the content and provide them
            with an opportunity to respond.
          </p>

          <li className="text-2xl text-white mt-4">Counter-Notification</li>
          <p className="text-white mt-2">
            If you believe that your content was removed in error, you may
            submit a counter-notification to our DMCA agent. Your
            counter-notification must include the following information:
          </p>
          <ul className="list-disc list-inside text-white mt-2">
            <li>A physical or electronic signature of the user</li>
            <li>
              Identification of the material that was removed and its location
              before removal
            </li>
            <li>
              A statement under penalty of perjury that the user has a good
              faith belief that the material was removed as a result of mistake
              or misidentification
            </li>
            <li>
              The user's contact information, including address, telephone
              number, and email address
            </li>
          </ul>
          <p className="text-white mt-2">Counter-notices should be sent to:</p>
          <address className="text-white mt-2 not-italic underline">
            Email: support@strippals.com
          </address>

          <li className="text-2xl text-white mt-4">Restoration of Content</li>
          <p className="text-white mt-2">
            If a valid counter-notification is received, StripPals.com will
            promptly restore the removed content unless we receive notice from
            the original complainant that they have filed a lawsuit seeking a
            court order to restrain the user from engaging in infringing
            activity.
          </p>

          <li className="text-2xl text-white mt-4">Misrepresentation</li>
          <p className="text-white mt-2">
            If you believe that your content was removed in error, you may
            submit a counter-notification to our DMCA agent. Your
            counter-notification must include the following information:
          </p>

          <p className="text-white mt-2">
            StripPals.com takes misrepresentation of copyright infringement
            claims seriously. If you knowingly submit false information in a
            DMCA notice or counter-notification, you may be subject to legal
            liability for damages, including costs and attorneys' fees.
          </p>

          <li className="text-2xl text-white mt-4">Policy Updates</li>
          <p className="text-white mt-2">
            StripPals.com reserves the right to update this DMCA policy at any
            time. Any changes will be effective immediately upon posting on our
            website.
          </p>
          <p className="text-white mt-2">
            If you have any questions about this DMCA policy or need to report a
            copyright infringement, please contact our DMCA agent at the email
            address provided above.
          </p>
        </ol>
      </div>
    </LegalPageLayout>
  );
}
