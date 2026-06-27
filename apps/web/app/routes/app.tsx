import { Link } from "react-router";
import { useEffect, useState } from "react";
import {
  bootstrapOrg,
  logout,
  useAuthToken,
  useIssues,
  useTeams,
  useAppStore,
} from "../../features/app-state";
import { createIssueLocal, updateIssueLocal } from "@great-manut/core";

export function meta() {
  return [{ title: "App · Great Manut" }];
}

export default function AppRoute() {
  const token = useAuthToken();
  const teams = useTeams();
  const store = useAppStore();
  const [orgSlug, setOrgSlug] = useState("demo");
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const issues = useIssues(selectedTeamId);

  useEffect(() => {
    if (!token) {
      window.location.href = "/login";
    }
  }, [token]);

  if (!token) {
    return null;
  }

  const selectedTeam = teams.find((team) => team.id === selectedTeamId) ?? teams[0];

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <aside className="card p-4 space-y-4">
        <div>
          <h2 className="font-semibold">Workspace</h2>
          <div className="mt-2 flex gap-2">
            <input
              className="flex-1 rounded-lg border border-[#222733] bg-[#0b0d12] px-3 py-2 text-sm"
              value={orgSlug}
              onChange={(event) => setOrgSlug(event.target.value)}
            />
            <button
              className="rounded-lg bg-[#222733] px-3 py-2 text-sm"
              onClick={async () => {
                setError(null);
                try {
                  await bootstrapOrg(orgSlug);
                  setBootstrapped(true);
                  setSelectedTeamId(null);
                } catch (bootstrapError) {
                  setError(bootstrapError instanceof Error ? bootstrapError.message : "Bootstrap failed");
                }
              }}
            >
              Load
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-sm muted mb-2">Teams</h3>
          <div className="space-y-1">
            {teams.length === 0 ? <p className="text-sm muted">No teams loaded yet.</p> : null}
            {teams.map((team) => (
              <button
                key={team.id}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                  selectedTeam?.id === team.id ? "bg-[#5e6ad2]/20 text-white" : "hover:bg-[#222733]"
                }`}
                onClick={() => setSelectedTeamId(team.id)}
              >
                {team.key} · {team.name}
              </button>
            ))}
          </div>
        </div>

        <button className="text-sm muted underline" onClick={() => logout()}>
          Sign out
        </button>
      </aside>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{selectedTeam ? `${selectedTeam.key} issues` : "Issues"}</h1>
            <p className="muted text-sm">Local-first list rendered from TinyBase.</p>
          </div>
          {selectedTeam ? (
            <button
              className="rounded-lg bg-[#5e6ad2] px-4 py-2 text-sm font-medium"
              onClick={() => {
                const states = Object.values(store.getTable("workflow_states"));
                const defaultState = states.find((state) => (state as { team_id: string }).team_id === selectedTeam.id) as
                  | { id: string }
                  | undefined;

                createIssueLocal(store, {
                  team_id: selectedTeam.id,
                  org_id: selectedTeam.org_id,
                  team_key: selectedTeam.key,
                  number: issues.length + 1,
                  title: `New issue ${issues.length + 1}`,
                  state_id: defaultState?.id ?? crypto.randomUUID(),
                  created_by: "local-user",
                });
              }}
            >
              New issue
            </button>
          ) : null}
        </div>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        {!bootstrapped ? <p className="muted text-sm">Load an org slug like `demo` after seeding preview data.</p> : null}

        <div className="space-y-2">
          {issues.map((issue) => (
            <article key={issue.id} className="card p-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-sm muted">{issue.identifier}</div>
                <div className="font-medium">{issue.title}</div>
              </div>
              <div className="flex gap-2">
                <button
                  className="rounded-lg bg-[#222733] px-3 py-1 text-sm"
                  onClick={() =>
                    updateIssueLocal(store, {
                      issue_id: issue.id,
                      updated_by: "local-user",
                      priority: issue.priority === "high" ? "none" : "high",
                    })
                  }
                >
                  Toggle priority
                </button>
                <Link className="rounded-lg border border-[#222733] px-3 py-1 text-sm" to={`/app/issues/${issue.identifier}`}>
                  Open
                </Link>
              </div>
            </article>
          ))}
          {selectedTeam && issues.length === 0 ? <p className="muted text-sm">No issues yet.</p> : null}
        </div>
      </section>
    </div>
  );
}
