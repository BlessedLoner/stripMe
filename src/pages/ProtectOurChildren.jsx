import React from "react";
import LegalPageLayout from "./LegalPageLayout";
import newbg from "../assets/newbg.jpg";

export default function ProtectOurChildren() {
  return (
    <LegalPageLayout>
      <div className="relative min-h-screen overflow-hidden">
        <h1 className="text-3xl font-bold text-white mb-6">
          Protect Our Children!
        </h1>
        <p className="text-white mb-3">
          As part of our continued commitment to preventing underage access to
          explicit content, we have prepared this document to help parents
          better understand how to protect their children from inappropriate or
          adult material online. One of the most effective steps in safeguarding
          your children is the use of parental control software on your devices.
          Some of the most widely recognized and trusted parental control
          solutions include CyberPatrol, Net Nanny, and Safety Surf.
        </p>

        <h1 className="text-3xl font-bold text-white mb-4">
          How does Parental control software work?
        </h1>
        <p className="text-white mb-3">
          Parental control software works by filtering and blocking access to
          inappropriate content based on predefined criteria. These tools can be
          configured to block specific websites, filter search results, and
          monitor online activity to ensure children are not exposed to harmful
          material. In addition to site-based blocking, many parental control
          tools filter content using keywords such as “vagina,” “penis,” or
          “sex.” These tools can also be customized to restrict access to a
          broader range of topics, including tobacco, drugs and drug culture,
          alcohol, violence, and racism. As many households use multiple
          computers and internet-enabled devices, it is important to install
          parental control software on all devices capable of accessing the
          internet. To ensure effectiveness, all devices and software should be
          secured with strong passwords.
        </p>

        <h1 className="text-3xl font-bold text-white mb-4">
          No guarantee to exposure of inappropriate content
        </h1>
        <p className="text-white mb-3">
          Protecting our children from inappropriate online content is a shared
          responsibility. By utilizing parental control software and maintaining
          open communication with our children, we can create a safer digital
          environment for them to explore and learn. Talking to your children
          about the possible dangers that exist on the Internet, and supervising
          their web surfing are still the best ways to protect them. Parental
          control software works by blocking access to specific websites and
          online content. In most cases, when you buy the software it already
          contains a large list of sites that are inappropriate for children.
          You can then update the software through the manufacturer's website
          or, in some cases, the software will update itself. Another way
          filtering software works is to block sites based on key words, such as
          'vagina, penis or sex.' However, filtering software doesn't have to
          just block access to adult-oriented material. You can configure the
          software to filter for topics such as tobacco, drugs and drug culture,
          alcohol, violence and racism. Most households have more than one
          computer or device to surf on the Internet. Please install the
          software on all devices on which it is possible to surf on the
          Internet. Secure all devices and software with a password.
        </p>

        <h1 className="text-3xl font-bold text-white mb-4">
          Talk with your children about the following:
        </h1>
        <div className="text-white mb-3">
          <ol style={{ listStyleType: "decimal" }}>
            <li>
              Online safety and the importance of not sharing personal
              information
            </li>
            <li>The risks of interacting with strangers online</li>
            <li>
              How to identify and report inappropriate content or behavior
            </li>
            <li>
              Teach them that they should never meet a new online friend without
              an adult present.
            </li>
            <li>Set clear rules and boundaries for internet use</li>
            <li>
              Never send pictures to strangers online and if they get a nude
              picture of someone to inform you immediately.
            </li>
          </ol>
        </div>

        <h1 className="text-3xl font-bold text-white mb-4">
          To purchase parental control software, please visit:
        </h1>
        <div className="text-white mb-3 underline">
          <ul>
            <li>
              <a
                href="https://www.kaspersky.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Kaspersky Parental Control
              </a>
            </li>
            <li>
              <a
                href="https://www.norton.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Norton Family
              </a>
            </li>
            <li>
              <a
                href="https://www.qustodio.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Qustodio
              </a>
            </li>
          </ul>
        </div>
      </div>
    </LegalPageLayout>
  );
}
