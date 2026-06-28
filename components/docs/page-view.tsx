"use client";

import { useMutation, useQuery } from "convex/react";
import { Loader2, Pencil, Save, X } from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/shared/user-avatar";
import { RenderDocBody } from "@/components/docs/render-doc-body";
import { PageComments } from "@/components/docs/page-comments";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const AUTOSAVE_MS = 30000;

export function PageView({ pageId }: { pageId: Id<"docPages"> }) {
  const params = useParams<{ orgSlug: string }>();
  const data = useQuery(api.docs.pagesGet, { pageId });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const lastSavedRef = useRef("");
  const updateBody = useMutation(api.docs.pagesUpdateBody);

  const save = useCallback(async () => {
    if (!dirty || saving) {
      return;
    }
    setSaving(true);
    try {
      await updateBody({ pageId, body: draft });
      lastSavedRef.current = draft;
      setDirty(false);
      toast.success("Page saved");
    } catch {
      toast.error("Failed to save page");
    } finally {
      setSaving(false);
    }
  }, [dirty, saving, updateBody, pageId, draft]);

  useEffect(() => {
    if (!editing || !dirty) {
      return;
    }
    const timer = setTimeout(() => {
      save();
    }, AUTOSAVE_MS);
    return () => clearTimeout(timer);
  }, [editing, dirty, draft, save]);

  if (data === undefined) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const startEdit = () => {
    setDraft(data.body);
    lastSavedRef.current = data.body;
    setDirty(false);
    setEditing(true);
  };

  const cancelEdit = () => {
    if (dirty) {
      setConfirmCancel(true);
      return;
    }
    setEditing(false);
  };

  return (
    <>
      <div className="flex flex-1 flex-col">
        <div className="border-b px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-lg font-semibold">{data.page.title}</h1>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <UserAvatar
                  name={data.editorName}
                  imageUrl={data.editorImageUrl}
                  className="size-5"
                />
                <span>
                  Updated by {data.editorName} ·{" "}
                  {new Date(data.page.updatedAt).toLocaleString()}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {editing ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={cancelEdit}
                    disabled={saving}
                  >
                    <X className="size-4" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={save} disabled={!dirty || saving}>
                    {saving ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Save className="size-4" />
                    )}
                    Save
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="outline" onClick={startEdit}>
                  <Pencil className="size-4" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto px-6 py-4">
          {editing ? (
            <Textarea
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                setDirty(e.target.value !== lastSavedRef.current);
              }}
              className="min-h-[320px] resize-y font-mono text-sm"
              placeholder="Write markdown…"
            />
          ) : (
            <RenderDocBody body={data.body} orgSlug={params.orgSlug} />
          )}
        </div>

        <div className="border-t px-6 py-4">
          <PageComments pageId={pageId} orgSlug={params.orgSlug} />
        </div>
      </div>

      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved edits. Discard them and return to the read view?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setEditing(false);
                setDraft(lastSavedRef.current);
                setDirty(false);
              }}
            >
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
