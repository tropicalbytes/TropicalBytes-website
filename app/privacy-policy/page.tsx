import type { Metadata } from "next";
import LegalPageHeader from "@/components/LegalPageHeader";
import LegalSection from "@/components/LegalSection";
import { business } from "@/lib/config";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${business.name} collects, uses, and protects the information submitted through our website.`,
};

const EFFECTIVE_DATE = "August 25, 2026";

export default function PrivacyPolicyPage() {
  return (
    <>
      <LegalPageHeader
        eyebrow="Privacy Policy"
        title="Privacy Policy"
        effectiveDate={EFFECTIVE_DATE}
        intro={`${business.name} respects your privacy and is committed to handling the information you share with us responsibly. This page explains what we collect through our website, why, and how it's handled.`}
      />

      <section className="mx-auto max-w-content px-5 py-14 md:px-8">
        <div className="mx-auto max-w-3xl">
          <LegalSection number={1} title="Introduction">
            <p>
              This Privacy Policy applies to the {business.name} website and describes how we collect and
              use information submitted through our meal plan, individual meal, party/bulk order, and
              contact forms. By using this website and submitting a request, you agree to the practices
              described here.
            </p>
          </LegalSection>

          <LegalSection number={2} title="Information We Collect">
            <p>Depending on which form you use, we may collect:</p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Full name</li>
              <li>Phone number</li>
              <li>Email address</li>
              <li>Delivery address, area, city, and pincode, or a delivery/event location</li>
              <li>Meal preference (lunch, dinner, or both) and food preference (veg or non-veg)</li>
              <li>Selected meals and add-ons</li>
              <li>Plan or duration details for meal subscriptions</li>
              <li>Requested start dates, preferred delivery dates, or event dates</li>
              <li>Quantity information, including approximate quantity for party/bulk requests</li>
              <li>Any notes, messages, or details you include with an enquiry</li>
            </ul>
            <p>We only collect what you choose to submit through these forms. There is no account creation or login on this website.</p>
          </LegalSection>

          <LegalSection number={3} title="How We Use Your Information">
            <p>We use the information you submit to:</p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Respond to your enquiry</li>
              <li>Review and process meal plan/subscription requests</li>
              <li>Review and process individual meal requests</li>
              <li>Review and process party or bulk order requests</li>
              <li>Contact you to confirm details, pricing, and availability</li>
              <li>Coordinate delivery or service</li>
              <li>Provide general customer support</li>
              <li>Keep internal records to help us run the business</li>
            </ul>
            <p>We do not use the information you submit for advertising or sell it to third parties.</p>
          </LegalSection>

          <LegalSection number={4} title="How Information Is Processed and Stored">
            <p>
              When you submit a form, your details are sent securely to our order-processing system, which
              records your request and notifies our team by email so we can follow up with you. This
              processing is handled using trusted Google services (including Google Sheets and related
              Google Workspace tools) that we use to run the day-to-day operations of a small business.
            </p>
            <p>
              We don&apos;t maintain a separate customer database or accept online payments through this
              website: every request is a request for our team to review and confirm with you directly.
            </p>
          </LegalSection>

          <LegalSection number={5} title="Information Sharing">
            <p>We do not sell your information. We may share information only where reasonably necessary to:</p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Provide the meal plan, meal, or bulk order service you requested</li>
              <li>Operate our website and day-to-day business</li>
              <li>Work with the trusted service providers described in this policy</li>
              <li>Comply with applicable laws or legal obligations</li>
            </ul>
          </LegalSection>

          <LegalSection number={6} title="Data Retention">
            <p>
              We retain the information you submit only for as long as reasonably necessary to handle your
              request, provide the service you asked about, maintain reasonable business records, and meet
              any legal or operational requirements. If you&apos;d like your information removed sooner,
              see the &ldquo;Your Choices&rdquo; section below.
            </p>
          </LegalSection>

          <LegalSection number={7} title="Data Security">
            <p>
              We take reasonable measures to protect the information submitted through our website.
              However, no online system, method of transmission, or method of storage can guarantee
              complete or absolute security, and we cannot promise that your information will never be
              accessed, disclosed, or altered in ways inconsistent with this policy.
            </p>
          </LegalSection>

          <LegalSection number={8} title="Your Choices">
            <p>You can contact us at any time to:</p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Ask what information we hold about you</li>
              <li>Request a correction to inaccurate information</li>
              <li>Request that we delete your information, where reasonably possible and subject to legitimate business or legal requirements</li>
            </ul>
            <p>Reach out using the contact details at the bottom of this page.</p>
          </LegalSection>

          <LegalSection number={9} title="Third-Party Services">
            <p>Our website relies on a small number of trusted third-party services to function:</p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Google Sheets and related Google Workspace tools, used to record and process submitted requests and send email notifications to our team</li>
              <li>Google Fonts, used to load the typography on this website</li>
              <li>Google Maps, embedded on our Contact page to show our location</li>
              <li>Our website hosting provider, used to serve this website</li>
            </ul>
            <p>
              We do not use advertising trackers, analytics pixels, or payment processors on this website.
              Where a service above is provided by Google, its own privacy practices also apply. You can
              review Google&apos;s privacy policy for details.
            </p>
          </LegalSection>

          <LegalSection number={10} title="Cookies">
            <p>
              We currently do not intentionally use cookies or similar technologies for advertising or
              behavioural tracking through this website. The Google Maps embed on our Contact page may
              involve Google&apos;s own data practices when it loads, independent of this website.
            </p>
          </LegalSection>

          <LegalSection number={11} title="Changes to This Privacy Policy">
            <p>
              We may update this Privacy Policy from time to time. Any changes will be posted on this page
              with an updated effective date.
            </p>
          </LegalSection>

          <LegalSection number={12} title="Contact Us">
            <p>If you have any questions about this Privacy Policy or how your information is handled, reach out to us:</p>
            <ul className="list-none space-y-1.5">
              <li><span className="font-medium text-forest">Phone:</span> {business.phoneDisplay}</li>
              <li><span className="font-medium text-forest">Email:</span> {business.email}</li>
              <li><span className="font-medium text-forest">Address:</span> {business.address}</li>
            </ul>
          </LegalSection>
        </div>
      </section>
    </>
  );
}
