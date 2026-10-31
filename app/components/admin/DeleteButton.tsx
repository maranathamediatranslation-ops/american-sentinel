import { Trash2 } from "lucide-react";
import { Form } from "react-router";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";

type Props = { what: string; title: string; imagePath: string | null };

// Posts intent=delete (and the image to remove) to the current route after
// confirmation. The dialog renders in a portal, so this form isn't nested in
// the edit form.
export function DeleteButton({ what, title, imagePath }: Props) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="outline" className="text-destructive">
          <Trash2 aria-hidden="true" />
          Delete {what}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete “{title}”?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes the {what} and its image from the site. It can’t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep {what}</AlertDialogCancel>
          <Form method="post">
            <input type="hidden" name="intent" value="delete" />
            <input type="hidden" name="currentImage" value={imagePath ?? ""} />
            <AlertDialogAction type="submit" className="bg-destructive text-white hover:bg-destructive/90">
              Delete {what}
            </AlertDialogAction>
          </Form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
