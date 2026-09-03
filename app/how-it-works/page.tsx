import { redirect } from "next/navigation";

// The standalone How It Works page has been retired — the 4-step process
// now lives as a section on the homepage. This route redirects so old
// links/bookmarks keep working.
export default function HowItWorksRedirectPage() {
  redirect("/#how-it-works");
}
