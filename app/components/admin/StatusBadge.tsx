import { Badge } from "~/components/ui/badge";
import type { ContentStatus } from "~/lib/admin";

const variant: Record<ContentStatus, "default" | "secondary" | "outline"> = {
  published: "default",
  scheduled: "secondary",
  draft: "outline",
  hidden: "outline",
  archived: "outline",
};

export const statusLabel: Record<ContentStatus, string> = {
  published: "Published",
  scheduled: "Scheduled",
  draft: "Draft",
  hidden: "Hidden",
  archived: "Archived",
};

export function StatusBadge({ status }: { status: ContentStatus }) {
  return <Badge variant={variant[status]}>{statusLabel[status]}</Badge>;
}
