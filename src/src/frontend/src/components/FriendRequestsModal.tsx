import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserPlus, Check, X, Loader2 } from "lucide-react";
import { useGetPendingFriendRequests, useAcceptFriendRequest, useRejectFriendRequest, useGetUserProfile } from "../hooks/useQueries";
import { toast } from "sonner";

export function FriendRequestsModal() {
  const [open, setOpen] = useState(false);
  const { data: requests = [] } = useGetPendingFriendRequests();
  const acceptRequest = useAcceptFriendRequest();
  const rejectRequest = useRejectFriendRequest();

  const handleAccept = async (fromUserId: string) => {
    try {
      await acceptRequest.mutateAsync(fromUserId);
      toast.success("Friend request accepted! 🎉");
    } catch (error) {
      toast.error("Failed to accept request");
      console.error(error);
    }
  };

  const handleReject = async (fromUserId: string) => {
    try {
      await rejectRequest.mutateAsync(fromUserId);
      toast.success("Request rejected");
    } catch (error) {
      toast.error("Failed to reject request");
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="relative hover-shake font-comic">
          <UserPlus className="w-4 h-4" />
          {requests.length > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-destructive text-destructive-foreground font-pixel text-xs">
              {requests.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md border-4 border-primary bg-card texture-grunge">
        <DialogHeader>
          <DialogTitle className="font-pixel text-primary">FRIEND REQUESTS</DialogTitle>
          <DialogDescription className="font-comic">
            {requests.length === 0 ? "No pending requests" : `${requests.length} pending request${requests.length > 1 ? "s" : ""}`}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[400px] pr-4">
          <div className="space-y-3">
            {requests.length === 0 ? (
              <Card className="border-2 border-muted">
                <CardContent className="py-8">
                  <p className="text-center font-comic text-muted-foreground">
                    No friend requests at the moment
                  </p>
                </CardContent>
              </Card>
            ) : (
              requests.map((request) => (
                <FriendRequestCard
                  key={request.userId1}
                  userId={request.userId1}
                  onAccept={() => handleAccept(request.userId1)}
                  onReject={() => handleReject(request.userId1)}
                  isPending={acceptRequest.isPending || rejectRequest.isPending}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

interface FriendRequestCardProps {
  userId: string;
  onAccept: () => void;
  onReject: () => void;
  isPending: boolean;
}

function FriendRequestCard({ userId, onAccept, onReject, isPending }: FriendRequestCardProps) {
  const { data: profile } = useGetUserProfile(userId);

  if (!profile) {
    return (
      <Card className="border-2 border-muted">
        <CardContent className="py-2 flex items-center justify-center">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-primary hover:shadow-neon transition-shadow">
      <CardContent className="py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 border-2 border-secondary">
            <AvatarFallback className="bg-primary text-primary-foreground font-pixel text-xs">
              {profile.username[0]?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-comic font-bold text-sm">{profile.username}</p>
            <p className="text-xs text-muted-foreground font-comic">wants to be friends</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="default"
            onClick={onAccept}
            disabled={isPending}
            className="hover-shake font-comic"
          >
            <Check className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onReject}
            disabled={isPending}
            className="hover-shake font-comic"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
