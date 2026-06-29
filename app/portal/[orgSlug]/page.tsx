"use client";

import { useMutation, useQuery } from "convex/react";
import { CheckCircle2, Loader2, Search } from "lucide-react";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { BrandMark } from "@/components/shared/brand-mark";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { formatDayWithYear } from "@/components/projects/dates";
import {
  parseRequestNumber,
  serviceRequestStatusClass,
  serviceRequestStatusLabel,
} from "@/components/service-desk/service-desk-meta";
import { CONTENT_PX } from "@/lib/responsive";

function getRateLimitKey(): string {
  if (typeof window === "undefined") {
    return "ssr";
  }
  const storageKey = "manut_portal_rl";
  let key = sessionStorage.getItem(storageKey);
  if (!key) {
    key = crypto.randomUUID();
    sessionStorage.setItem(storageKey, key);
  }
  return key;
}

function SubmitForm({
  orgSlug,
  requestTypes,
}: {
  orgSlug: string;
  requestTypes: {
    _id: Id<"requestTypes">;
    name: string;
    description?: string;
  }[];
}) {
  const portalSubmit = useMutation(api.serviceDesk.portalSubmit);
  const [requestTypeId, setRequestTypeId] = useState<Id<"requestTypes"> | "">(
    requestTypes[0]?._id ?? ""
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requesterEmail, setRequesterEmail] = useState("");
  const [requesterName, setRequesterName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ displayNumber: string } | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!requestTypeId || !title.trim() || !requesterEmail.trim()) {
      return;
    }
    setSubmitting(true);
    try {
      const result = await portalSubmit({
        orgSlug,
        requestTypeId,
        title,
        description,
        requesterEmail,
        requesterName: requesterName.trim() || undefined,
        rateLimitKey: getRateLimitKey(),
      });
      setSuccess({ displayNumber: result.displayNumber });
      setTitle("");
      setDescription("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <CheckCircle2 className="size-10 text-success" />
        <div>
          <p className="text-sm font-medium">Request submitted</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Your request number is{" "}
            <span className="font-mono font-medium text-foreground">
              {success.displayNumber}
            </span>
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setSuccess(null)}>
          Submit another
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label>Request type</Label>
        <select
          className="h-9 rounded-md border bg-background px-3 text-sm"
          value={requestTypeId}
          onChange={(event) => setRequestTypeId(event.target.value as Id<"requestTypes">)}
        >
          {requestTypes.map((type) => (
            <option key={type._id} value={type._id}>
              {type.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="portal-title">Subject</Label>
        <Input
          id="portal-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Brief summary"
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="portal-description">Description</Label>
        <Textarea
          id="portal-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Describe your request"
          rows={4}
          required
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="portal-email">Email</Label>
          <Input
            id="portal-email"
            type="email"
            value={requesterEmail}
            onChange={(event) => setRequesterEmail(event.target.value)}
            placeholder="you@company.com"
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="portal-name">Name (optional)</Label>
          <Input
            id="portal-name"
            value={requesterName}
            onChange={(event) => setRequesterName(event.target.value)}
            placeholder="Your name"
          />
        </div>
      </div>
      <Button type="submit" disabled={submitting || !requestTypeId}>
        {submitting ? <Loader2 className="size-4 animate-spin" /> : "Submit request"}
      </Button>
    </form>
  );
}

function TrackForm({ orgSlug }: { orgSlug: string }) {
  const [email, setEmail] = useState("");
  const [numberInput, setNumberInput] = useState("");
  const parsedNumber = useMemo(() => parseRequestNumber(numberInput), [numberInput]);
  const canTrack = email.trim().length > 0 && parsedNumber !== null;

  const tracked = useQuery(
    api.serviceDesk.portalTrack,
    canTrack
      ? { orgSlug, requesterEmail: email.trim(), number: parsedNumber! }
      : "skip"
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="track-email">Email</Label>
          <Input
            id="track-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@company.com"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="track-number">Request number</Label>
          <Input
            id="track-number"
            value={numberInput}
            onChange={(event) => setNumberInput(event.target.value)}
            placeholder="REQ-42"
          />
        </div>
      </div>

      {!canTrack ? (
        <p className="text-xs text-muted-foreground">
          Enter the email and request number from your confirmation.
        </p>
      ) : tracked === undefined ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Looking up request…
        </div>
      ) : tracked === null ? (
        <p className="text-sm text-muted-foreground">
          No request found for that email and number.
        </p>
      ) : (
        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-xs text-muted-foreground">
              {tracked.displayNumber}
            </span>
            <Badge
              variant="secondary"
              className={serviceRequestStatusClass(tracked.status)}
            >
              {serviceRequestStatusLabel(tracked.status)}
            </Badge>
          </div>
          <p className="mt-2 text-sm font-medium">{tracked.title}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Submitted {formatDayWithYear(tracked.createdAt)}
            {tracked.dueAt ? ` · Due ${formatDayWithYear(tracked.dueAt)}` : ""}
          </p>
        </div>
      )}
    </div>
  );
}

/** Public customer portal — submit and track service requests. */
export default function PortalPage() {
  const params = useParams<{ orgSlug: string }>();
  const org = useQuery(api.serviceDesk.portalGetOrg, { orgSlug: params.orgSlug });
  const requestTypes = useQuery(api.serviceDesk.portalListRequestTypes, {
    orgSlug: params.orgSlug,
  });

  if (org === undefined || requestTypes === undefined) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (org === null) {
    return (
      <div className={`flex min-h-dvh flex-col items-center justify-center gap-2 text-center ${CONTENT_PX}`}>
        <BrandMark href="/" />
        <p className="mt-6 text-sm text-muted-foreground">Workspace not found.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header
        className={`flex items-center justify-between border-b py-4 ${CONTENT_PX}`}
      >
        <BrandMark href="/" />
        <ThemeToggle />
      </header>
      <main className={`mx-auto flex w-full max-w-lg flex-1 flex-col py-10 ${CONTENT_PX}`}>
        <div className="mb-8 text-center">
          <h1 className="text-xl font-semibold">{org.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Submit a support request or track an existing one.
          </p>
        </div>

        <Tabs defaultValue="submit" className="flex flex-col gap-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="submit">Submit request</TabsTrigger>
            <TabsTrigger value="track">
              <Search className="size-3.5" />
              Track request
            </TabsTrigger>
          </TabsList>

          <TabsContent value="submit">
            {requestTypes.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No request types are available yet.
              </p>
            ) : (
              <SubmitForm orgSlug={params.orgSlug} requestTypes={requestTypes} />
            )}
          </TabsContent>

          <TabsContent value="track">
            <TrackForm orgSlug={params.orgSlug} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
