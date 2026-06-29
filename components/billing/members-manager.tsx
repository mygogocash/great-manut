"use client";

import { useMutation, useQuery } from "convex/react";
import { Loader2, Mail, Trash2, UserPlus } from "lucide-react";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
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
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserAvatar } from "@/components/shared/user-avatar";
import { planForOrg } from "@/lib/plans";

type MemberRole = "admin" | "member";

const ROLES: { value: MemberRole; label: string }[] = [
  { value: "member", label: "Member" },
  { value: "admin", label: "Admin" },
];

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function MembersManager() {
  const org = useQuery(api.organizations.current);
  const membership = useQuery(api.organizations.myMembership);
  const members = useQuery(api.organizations.listMembers);
  const invitations = useQuery(api.organizations.listInvitations);
  const currentUser = useQuery(api.users.current);

  if (
    org === undefined ||
    membership === undefined ||
    members === undefined ||
    invitations === undefined
  ) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (org === null) {
    return (
      <p className="py-20 text-center text-sm text-muted-foreground">
        Workspace not found.
      </p>
    );
  }

  const plan = planForOrg(org.plan);
  const isAdmin = membership.role === "admin";
  const memberCount = members.length;
  const pendingCount = invitations.length;

  return (
    <>
      <div>
        <h1 className="text-base font-semibold">Members</h1>
        <p className="text-xs text-muted-foreground">
          {memberCount} {memberCount === 1 ? "member" : "members"}
          {pendingCount > 0 && ` · ${pendingCount} pending`}
          {` · unlimited seats on ${plan.name}`}
        </p>
      </div>

      {isAdmin && <InviteMemberForm />}

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium">People</h2>
        <MembersTable
          isAdmin={isAdmin}
          members={members}
          currentUserId={currentUser?._id}
        />
      </section>

      {invitations.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium">Pending invitations</h2>
          <PendingInvitations isAdmin={isAdmin} invitations={invitations} />
        </section>
      )}
    </>
  );
}

function InviteMemberForm() {
  const inviteMember = useMutation(api.organizations.inviteMember);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MemberRole>("member");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const emailAddress = email.trim();
    if (!emailAddress || submitting) {
      return;
    }
    setSubmitting(true);
    try {
      const result = await inviteMember({ email: emailAddress, role });
      toast.success(
        result === "added"
          ? `${emailAddress} was added to the workspace`
          : `Invitation sent to ${emailAddress}`
      );
      setEmail("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to send invitation"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="flex items-center gap-2"
    >
      <div className="relative flex-1">
        <Mail className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="email"
          required
          placeholder="colleague@company.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="h-8 pl-8 text-sm"
        />
      </div>
      <Select
        value={role}
        onValueChange={(value) => {
          if (value === "admin" || value === "member") {
            setRole(value);
          }
        }}
      >
        <SelectTrigger size="sm" className="w-28 gap-1.5">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ROLES.map((entry) => (
            <SelectItem key={entry.value} value={entry.value}>
              {entry.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button type="submit" size="sm" disabled={!email.trim() || submitting}>
        <UserPlus className="size-3.5" />
        Invite
      </Button>
    </form>
  );
}

function MembersTable({
  isAdmin,
  members,
  currentUserId,
}: {
  isAdmin: boolean;
  members: Array<{
    memberId: Id<"members">;
    userId: Id<"users">;
    role: MemberRole;
    name: string;
    email: string;
    imageUrl?: string;
    joinedAt: number;
  }>;
  currentUserId?: string;
}) {
  const updateMemberRole = useMutation(api.organizations.updateMemberRole);
  const removeMember = useMutation(api.organizations.removeMember);

  const handleRoleChange = async (memberId: Id<"members">, role: MemberRole) => {
    try {
      await updateMemberRole({ memberId, role });
      toast.success("Role updated");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update role"
      );
    }
  };

  const handleRemove = async (memberId: Id<"members">, name: string) => {
    try {
      await removeMember({ memberId });
      toast.success(`Removed ${name}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to remove member"
      );
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="px-3 text-xs">User</TableHead>
            <TableHead className="text-xs">Joined</TableHead>
            <TableHead className="w-32 text-xs">Role</TableHead>
            {isAdmin && <TableHead className="w-10" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => {
            const isSelf = member.userId === currentUserId;
            return (
              <TableRow key={member.memberId} className="hover:bg-muted/20">
                <TableCell className="px-3 py-2">
                  <div className="flex items-center gap-2.5">
                    <UserAvatar
                      name={member.name}
                      imageUrl={member.imageUrl}
                      className="size-6"
                    />
                    <div className="flex min-w-0 flex-col">
                      <span className="flex items-center gap-1.5 truncate text-xs font-medium">
                        {member.name}
                        {isSelf && (
                          <Badge
                            variant="secondary"
                            className="h-4 rounded-full px-1.5 text-[10px]"
                          >
                            You
                          </Badge>
                        )}
                      </span>
                      <span className="truncate text-[11px] text-muted-foreground">
                        {member.email}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-2 text-xs text-muted-foreground">
                  {formatDate(member.joinedAt)}
                </TableCell>
                <TableCell className="py-2">
                  {isAdmin && !isSelf ? (
                    <Select
                      value={member.role}
                      onValueChange={(value) => {
                        if (value === "admin" || value === "member") {
                          void handleRoleChange(member.memberId, value);
                        }
                      }}
                    >
                      <SelectTrigger size="sm" className="h-7 w-28 gap-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((entry) => (
                          <SelectItem key={entry.value} value={entry.value}>
                            {entry.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {member.role === "admin" ? "Admin" : "Member"}
                    </span>
                  )}
                </TableCell>
                {isAdmin && (
                  <TableCell className="py-2 pr-3 text-right">
                    {!isSelf && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Remove ${member.name}`}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Remove {member.name}?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              They will immediately lose access to this
                              workspace and its issues. You can invite them
                              again later.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                void handleRemove(member.memberId, member.name)
                              }
                            >
                              Remove member
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function PendingInvitations({
  isAdmin,
  invitations,
}: {
  isAdmin: boolean;
  invitations: Array<{
    invitationId: Id<"invitations">;
    email: string;
    role: MemberRole;
    invitedAt: number;
    expiresAt: number;
  }>;
}) {
  const revokeInvitation = useMutation(api.organizations.revokeInvitation);

  const handleRevoke = async (
    invitationId: Id<"invitations">,
    email: string
  ) => {
    try {
      await revokeInvitation({ invitationId });
      toast.success(`Invitation to ${email} revoked`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to revoke invitation"
      );
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableBody>
          {invitations.map((invitation) => (
            <TableRow key={invitation.invitationId} className="hover:bg-muted/20">
              <TableCell className="px-3 py-2">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-6 items-center justify-center rounded-full bg-muted">
                    <Mail className="size-3 text-muted-foreground" />
                  </span>
                  <span className="text-xs font-medium">{invitation.email}</span>
                </div>
              </TableCell>
              <TableCell className="py-2 text-xs text-muted-foreground">
                Invited {formatDate(invitation.invitedAt)}
              </TableCell>
              <TableCell className="py-2 text-xs text-muted-foreground">
                {invitation.role === "admin" ? "Admin" : "Member"}
              </TableCell>
              {isAdmin && (
                <TableCell className="w-20 py-2 pr-3 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() =>
                      void handleRevoke(
                        invitation.invitationId,
                        invitation.email
                      )
                    }
                  >
                    Revoke
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
