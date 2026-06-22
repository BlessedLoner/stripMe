import React from "react";
import { Link } from "react-router-dom";
import LegalPageLayout from "./LegalPageLayout";

export default function Pricing() {
  return (
    <LegalPageLayout>
      <div className="relative min-h-screen overflow-hidden">
        <h1 className="text-4xl text-white "> Pricing</h1>
        <p className="text-white mt-2"> Last updated: May 10, 2026</p>

        <ol>
          <li className="text-2xl text-white mt-4">Overview</li>
          <p className="text-white mt-2">
            StripPals.com offers a variety of subscription plans to suit
            different preferences and needs. Our pricing is designed to provide
            value while ensuring a high-quality experience for our users. Below
            is an overview of our current subscription options:
          </p>

          <li className="text-2xl text-white mt-4">Subscription Plans</li>
          <p className="text-white mt-2">
            We offer the following subscription plans:
          </p>
          <ul className="list-disc list-inside text-white mt-2">
            <li>
              Certain features of or our affiliated websites require a paid
              subscription or the purchase of credits.
            </li>
            <li>
              We believe in the power of freedom and choice. Therefore all
              payments are one-off and non-recurring.
            </li>
            <li>All the rates are VAT included.</li>
            <li>
              We reserve the right to change our subscription plans and pricing
              at any time. Any changes will be communicated to our users in
              advance.
            </li>
            <li>
              For the most up-to-date information on our subscription plans and
              pricing, please visit our website:{" "}
              <Link to="/credits" className="text-blue-500 underline">
                Credit Store
              </Link>{" "}
              or contact our support team at support@strippals.com
            </li>
            <li>
              {" "}
              The statutory cooling-off period cannot be claimed for this
              Entertainment Service.
            </li>
          </ul>

          <table className="text-white mt-4">
            <thead>
              <tr>
                <th className="border border-white p-2">Credits</th>
                <th className="border border-white p-2">Price</th>
                <th className="border border-white p-2">Price per Credit</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-white p-2">10</td>
                <td className="border border-white p-2">$15</td>
                <td className="border border-white p-2">$1.5</td>
              </tr>
              <tr>
                <td className="border border-white p-2">25</td>
                <td className="border border-white p-2">$35</td>
                <td className="border border-white p-2">$1.4</td>
              </tr>
              <tr>
                <td className="border border-white p-2">50</td>
                <td className="border border-white p-2">$65</td>
                <td className="border border-white p-2">$1.3</td>
              </tr>
              <tr>
                <td className="border border-white p-2">100</td>
                <td className="border border-white p-2">$120</td>
                <td className="border border-white p-2">$1.2</td>
              </tr>
              <tr>
                <td className="border border-white p-2">200</td>
                <td className="border border-white p-2">$220</td>
                <td className="border border-white p-2">$1.1</td>
              </tr>
            </tbody>
          </table>
          <li className="text-2xl text-white mt-4">Payment Methods</li>
          <p className="text-white mt-2">
            We accept a variety of payment methods to make it easy for our users
            to manage their subscriptions. These include:
          </p>
          <ul className="list-disc list-inside text-white mt-2">
            <li>Credit and debit cards (Visa, MasterCard, American Express)</li>
            <li>PayPal</li>
            <li>Cryptocurrency (Bitcoin, Ethereum, etc.)</li>
            <li>
              Other payment methods may be available depending on your location.
            </li>
          </ul>
        </ol>
      </div>
    </LegalPageLayout>
  );
}
