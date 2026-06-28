"use client";

import { useMutation, useQuery } from "convex/react";
import { Loader2, Send, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/user-avatar";
import {
  MentionTextarea,
  resolveMentions,
} from "@/components/issue-detail/mention-textarea";
import { RenderDocBody } from "@/components/docs/render-doc-body";

export function PageComments({
  pageId,
  orgSlug,
}: {
  pageId: Id<"docPages">;
  orgSlug: string;
}) {
  const comments = useQuery(api.docComments.listByPage, { pageId });
  const createComment = useMutation(api.docComments.create);
  const removeComment = useMutation(api.docComments.remove);
  const [body, setBody] = useState("");
  const mentionsRef = useRef(new Map<Id<"users">, string>());
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmed = body.trim();
    if (!trimmed) {
      return;
    }
    setSubmitting(true);
    try {
      await createComment({
        pageId,
        body: trimmed,
        mentions: resolveMentions(trimmed, mentionsRef.current),
      });
      setBody("");
      mentionsRef.current = new Map();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-medium">Comments</h3>

      {comments === undefined ? (
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      ) : comments.length === 0 ? (
        <p className="text-xs text-muted-foreground">No comments yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {comments.map((comment) => (
            <li key={comment._id} className="flex gap-2">
              <UserAvatar
                name={comment.authorName}
                imageUrl={comment.authorImageUrl}
                className="size-6 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {comment.authorName}
                  </span>
                  <span>
                    {new Date(comment.createdAt).toLocaleString()}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-5 ml-auto"
                    onClick={() => removeComment({ commentId: comment._id })}
                    aria-label="Delete comment"
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
                <RenderDocBody
                  body={comment.body}
                  orgSlug={orgSlug}
                  className="mt-1 text-sm"
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <div className="flex-1 rounded-md border p-2">
          <MentionTextarea
            value={body}
            onChange={setBody}
            onMention={(user) => {
              mentionsRef.current.set(user.userId, user.name);
            }}
            onSubmit={handleSubmit}
            placeholder="Add a comment… (@ to mention)"
            disabled={submitting}
          />
        </div>
        <Button
          size="icon"
          className="shrink-0"
          onClick={handleSubmit}
          disabled={!body.trim() || submitting}
          aria-label="Send comment"
        >
          {submitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
