import { Link } from "react-router";
import { useMemo, useSyncExternalStore } from "react";
import { getIssueByIdentifier, updateIssueLocal } from "@great-manut/core";
import { useAppStore } from "../../features/app-state";

export function meta({ params }: { params: { identifier: string } }) {
  return [{ title: `${params.identifier} · Great Manut` }];
}

export default function IssueDetailRoute({ params }: { params: { identifier: string } }) {
  const store = useAppStore();
  const issue = useSyncExternalStore(
    (callback) => {
      const listenerId = store.addTableListener("issues", callback);
      return () => store.delListener(listenerId);
    },
    () => getIssueByIdentifier(store, params.identifier),
    () => undefined
  );

  const title = useMemo(() => issue?.title ?? "Issue not found", [issue?.title]);

  if (!issue) {
    return (
      <div className="space-y-3">
        <Link to="/app" className="text-sm muted">
          ← Back
        </Link>
        <p>Issue `{params.identifier}` is not in the local store yet.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-4">
      <Link to="/app" className="text-sm muted">
        ← Back to issues
      </Link>
      <div className="card p-6 space-y-4">
        <div className="text-sm muted">{issue.identifier}</div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <textarea
          className="w-full min-h-32 rounded-lg border border-[#222733] bg-[#0b0d12] px-3 py-2"
          value={issue.description}
          onChange={(event) =>
            updateIssueLocal(store, {
              issue_id: issue.id,
              updated_by: "local-user",
              description: event.target.value,
            })
          }
        />
        <div className="text-sm muted">Priority: {issue.priority}</div>
      </div>
    </div>
  );
}
