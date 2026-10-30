import { data } from "react-router";

// Catch-all inside the site layout, so unknown URLs get a 404 status and the
// layout's "Page not found" page with the masthead and footer.
export function loader() {
  throw data(null, { status: 404 });
}

export default function NotFound() {
  return null;
}
