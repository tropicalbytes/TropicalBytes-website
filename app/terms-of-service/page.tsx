import type { Metadata } from "next";
import LegalPageHeader from "@/components/LegalPageHeader";
import LegalSection from "@/components/LegalSection";
import { business } from "@/lib/config";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `The terms that apply to meal plan, individual meal, and party/bulk requests submitted through the ${business.name} website.`,
};

const EFFECTIVE_DATE = "August 25, 2026";

export default function TermsOfServicePage() {
  return (
    <>
      <LegalPageHeader
        eyebrow="Terms of Service"
        title="Terms of Service"
        effectiveDate={EFFECTIVE_DATE}
        intro={`These terms explain how requests submitted through the ${business.name} website work, and what you can expect from us along the way.`}
      />

      <section className="mx-auto max-w-content px-5 py-14 md:px-8">
        <div className="mx-auto max-w-3xl">
          <LegalSection number={1} title="Acceptance of Terms">
            <p>
              By accessing this website or submitting a request through any of our forms, you agree to
              these Terms of Service. If you don&apos;t agree with any part of these terms, please don&apos;t
              use the website to submit a request.
            </p>
          </LegalSection>

          <LegalSection number={2} title="Nature of Requests and Enquiries">
            <p>
              Submitting a meal plan/subscription request, an individual meal request, a party/bulk order
              request, or a general enquiry through our website sends that request to our team for review.
              It does <strong>not</strong> automatically guarantee availability or constitute a confirmed
              order. As shown after every submission, our team reviews your request and contacts you to
              confirm the details before anything is finalized. No online payment is collected at the point
              of submission.
            </p>
          </LegalSection>

          <LegalSection number={3} title="Pricing">
            <p>
              Our Individual Meal and Subscription Meal Plans pages display our current fixed plan prices,
              dessert prices, and party/bulk per-kg pricing, along with an estimated total shown while you
              fill out the subscription form. These figures reflect our listed rates, but the final confirmed
              total for your specific request may depend on your selected meals, quantity, plan tier,
              delivery location, availability, and any specific requirements you share with us. We&apos;ll
              confirm final pricing with you directly before your order is finalized.
            </p>
          </LegalSection>

          <LegalSection number={4} title="Availability">
            <p>
              Meals, plans, desserts, and party/bulk items are subject to availability. Your
              requested start date, delivery date, or event date may need to be confirmed, and our team may
              contact you about alternatives if your preferred date or item isn&apos;t available.
            </p>
          </LegalSection>

          <LegalSection number={5} title="Meal Preferences and Dietary Requirements">
            <p>
              Please provide accurate information about your meal and food preferences when submitting a
              request. While we prepare veg and non-veg options separately, we cannot guarantee an
              allergen-free environment or preparation process. If you or a guest has a serious food allergy
              or specific dietary requirement, please contact us directly before confirming your order so we
              can discuss whether we&apos;re able to accommodate it.
            </p>
          </LegalSection>

          <LegalSection number={6} title="Delivery and Service Areas">
            <p>
              We currently serve {business.serviceAreas.join(", ")}. Delivery or service availability
              depends on your location falling within our current service area, and will be confirmed by
              our team when we follow up on your request. We&apos;ll let you know directly if any additional
              conditions apply to your delivery.
            </p>
          </LegalSection>

          <LegalSection number={7} title="Changes and Cancellations">
            <p>
              If you need to change or cancel a request, please let us know as early as possible using the
              contact details below. Whether a change or cancellation can be accommodated may depend on the
              current status of your request. Our team will work with you on the best available option.
            </p>
          </LegalSection>

          <LegalSection number={8} title="Payments">
            <p>
              This website does not process online payments: there is no payment gateway, card storage, or
              checkout on this site. Where payment applies to your order, arrangements will be communicated
              and handled separately during the confirmation process with our team.
            </p>
          </LegalSection>

          <LegalSection number={9} title="Acceptable Use">
            <p>When using this website, you agree not to:</p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Submit false or misleading information</li>
              <li>Attempt to interfere with or disrupt the website</li>
              <li>Abuse, overload, or spam our forms or services</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Use the website for any unlawful purpose</li>
            </ul>
          </LegalSection>

          <LegalSection number={10} title="Website Information">
            <p>
              We make reasonable efforts to keep the menu items, pricing, availability, and service details
              on this website accurate and up to date. However, these details may be updated or changed
              whenever necessary, and any change will be reflected in what our team confirms with you.
            </p>
          </LegalSection>

          <LegalSection number={11} title="Limitation of Liability">
            <p>
              We aim to provide a reliable, well-run meal service, but as with any small business, we
              can&apos;t guarantee that our website or services will always be uninterrupted or error-free.
              To the extent permitted by applicable law, {business.name} is not liable for indirect or
              incidental issues arising from use of this website, beyond resolving problems directly related
              to an order or request placed with us.
            </p>
          </LegalSection>

          <LegalSection number={12} title="Changes to These Terms">
            <p>
              We may update these Terms of Service from time to time. The latest version will always be
              posted on this page.
            </p>
          </LegalSection>

          <LegalSection number={13} title="Contact">
            <p>Questions about these terms? Reach out to us:</p>
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
