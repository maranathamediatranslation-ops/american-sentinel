// Dev-only design preview with placeholder data. Not registered in production builds.
import { ArticleView } from "~/components/ArticleView";
import { sampleArticle, sampleArticles } from "~/dev/fixtures";

export function meta() {
  return [{ title: "Preview: article" }, { name: "robots", content: "noindex" }];
}

export default function DevArticle() {
  return <ArticleView article={sampleArticle} related={sampleArticles.slice(1, 6)} />;
}
