import React from "react";
import LegalPageLayout from "./LegalPageLayout";

export default function ComplaintPolicy() {
  return (
    <LegalPageLayout>
      <div className="relative min-h-screen overflow-hidden">
        <h1 className="text-4xl text-white "> Complaint Policy</h1>
        <p className="text-white mt-2"> Last updated: May 10, 2026</p>

        <p className="text-white mt-3">
          At StripMe.com, we are committed to providing a safe and enjoyable
          experience for all our users. We take complaints seriously and have
          established a clear process for handling them. If you have a complaint
          about our services, please follow the steps outlined below:
        </p>

        <ol className="list-decimal list-inside text-white mt-3">
          <li>
            Contact our support team: You can reach out to our support team via
            email at support@stripme.com. Please provide as much detail as
            possible about your complaint, including any relevant screenshots or
            evidence.
          </li>
          <li>
            Provide additional information: If necessary, we may request
            additional information to help us investigate your complaint.
          </li>
        </ol>

        <p className="text-white mt-3">
          We will review your complaint promptly and take appropriate action
          based on our findings. This may include investigating the issue,
          contacting the parties involved, and implementing any necessary
          changes to our services or policies to prevent similar issues in the
          future.
        </p>

        <p className="text-white mt-3">
          We value your feedback and are committed to continuously improving our
          services. If you have any questions about our complaint policy or need
          assistance, please do not hesitate to contact our support team.
        </p>

        <h3 className="text-2xl text-white mt-4">
          Please contact us if you encounter content involving:
        </h3>
        <ul className="list-disc list-inside text-white mt-3">
          <li>Child sexual abuse material (CSAM)</li>
          <li>Non-consensual intimate imagery</li>
          <li>Harassment or bullying</li>
          <li>Hate speech or discrimination</li>
          <li>Illegal activities or content</li>
          <li>
            Any other content that violates our community guidelines or terms of
            service
          </li>
          <li>
            Unauthorized use or distribution of your images (including revenge
            porn, blackmail, or exploitation)
          </li>
        </ul>

        <h3 className="text-2xl text-white mt-4">How to report content:</h3>
        <p className="text-white mt-3">
          If you come across content that you believe violates our policies,
          please report it immediately by contacting our support team at
          support@stripme.com.
        </p>
        <ul className="list-disc list-inside text-white mt-3">
          <li>
            If the content involves non-consensual intimate imagery, please
            provide any relevant information about the individuals involved and
            the circumstances surrounding the content.
          </li>
          <li>
            Provide your contact information so we can follow up with you if
            necessary.
          </li>
          <li>Your full legal name</li>
          <li>Your email address</li>
          <li>A detailed description of the issue</li>
          <li>Any relevant screenshots or evidence</li>
          <li>
            Your relationship to the individual shown in the content (if
            submitting the report on someone else’s behalf)
          </li>
        </ul>

        <h3 className="text-2xl text-white mt-4">Review process</h3>
        <p className="text-white mt-3">
          Upon receiving a complaint, our team will review the content and
          investigate the issue. We may contact you for additional information
          or clarification if needed. We will take appropriate action based on
          our findings, which may include removing the content, suspending or
          banning the offending user, and reporting illegal content to law
          enforcement authorities when necessary.
        </p>
        <p className="text-white mt-3">
          We are committed to maintaining a safe and respectful community for
          all our users. If you have any questions about our complaint policy or
          need assistance, please do not hesitate to contact our support team.
        </p>

        <h3 className="text-2xl text-white mt-4">Counter-notice procedure</h3>
        <p className="text-white mt-3">
          If you believe that your content was removed in error or that your
          account was suspended unfairly, you may submit a counter-notice to our
          support team at support@stripme.com. Please include the following
          information in your counter-notice:
        </p>
        <ul className="list-disc list-inside text-white mt-3">
          <li>Your full legal name</li>
          <li>Your email address</li>
          <li>
            A detailed explanation of why you believe the content was removed in
            error or the suspension was unfair
          </li>
          <li>Any relevant evidence or documentation to support your claim</li>
          <li>
            A statement under penalty of perjury that the information provided
            is accurate and that you have the right to submit the content in
            question
          </li>
          <li>
            A statement in the following format: "I swear, under penalty of
            perjury, that the information provided is accurate and that I have
            the right to submit the content in question."
          </li>
        </ul>

        <p className="text-white mt-3">
          Upon receiving a counter-notice, we will review the information
          provided and may reinstate the content or account if we determine that
          the original removal or suspension was in error. We will notify you of
          our decision via email.
        </p>

        <h3 className="text-2xl text-white mt-4">After submission</h3>
        <p className="text-white mt-3">
          After you submit a complaint or counter-notice, please allow us some
          time to review and investigate the issue. We will do our best to
          resolve the matter as quickly as possible while ensuring a thorough
          review process. We appreciate your patience and understanding as we
          work to maintain a safe and respectful community for all our users.
        </p>
      </div>
    </LegalPageLayout>
  );
}
