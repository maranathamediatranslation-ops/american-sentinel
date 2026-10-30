// Dev-only design preview with placeholder data. Not registered in production builds.
import { HomeView } from "~/components/HomeView";
import { sampleArticles, sampleBooks, samplePresentations } from "~/dev/fixtures";

export function meta() {
  return [{ title: "Preview: home" }, { name: "robots", content: "noindex" }];
}

export default function DevHome() {
  return (
    <HomeView articles={sampleArticles} books={sampleBooks} presentations={samplePresentations} />
  );
}
