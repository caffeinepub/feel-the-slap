import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useActor } from "./useActor";
import type { Post, Comment, UserProfile, ReactionType } from "../backend";

// User Profile Queries
export function useGetCallerProfile() {
  const { actor, isFetching } = useActor();
  
  return useQuery<UserProfile | null>({
    queryKey: ["callerProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetUserProfile(userId: string | undefined) {
  const { actor, isFetching } = useActor();
  
  return useQuery<UserProfile | null>({
    queryKey: ["userProfile", userId],
    queryFn: async () => {
      if (!actor || !userId) return null;
      return actor.getUserProfile(userId);
    },
    enabled: !!actor && !isFetching && !!userId,
  });
}

export function useRegisterUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Not connected");
      return actor.registerUser(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["callerProfile"] });
    },
  });
}

export function useSaveCallerProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Not connected");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["callerProfile"] });
    },
  });
}

export function useCheckUsername() {
  const { actor } = useActor();
  
  return useMutation({
    mutationFn: async (username: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.isUsernameAvailable(username);
    },
  });
}

// Post Queries
export function useGetPosts(limit: number = 20, offset: number = 0) {
  const { actor, isFetching } = useActor();
  
  return useQuery<Post[]>({
    queryKey: ["posts", limit, offset],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPosts(BigInt(limit), BigInt(offset));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetPost(postId: string | undefined) {
  const { actor, isFetching } = useActor();
  
  return useQuery<Post | null>({
    queryKey: ["post", postId],
    queryFn: async () => {
      if (!actor || !postId) return null;
      return actor.getPost(postId);
    },
    enabled: !!actor && !isFetching && !!postId,
  });
}

export function useGetPostsByUser(userId: string | undefined, limit: number = 20, offset: number = 0) {
  const { actor, isFetching } = useActor();
  
  return useQuery<Post[]>({
    queryKey: ["userPosts", userId, limit, offset],
    queryFn: async () => {
      if (!actor || !userId) return [];
      return actor.getPostsByUser(userId, BigInt(limit), BigInt(offset));
    },
    enabled: !!actor && !isFetching && !!userId,
  });
}

export function useCreatePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (post: Omit<Post, "id" | "timestamp">) => {
      if (!actor) throw new Error("Not connected");
      const fullPost: Post = {
        ...post,
        id: crypto.randomUUID(),
        timestamp: BigInt(Date.now()) * BigInt(1_000_000),
      };
      return actor.createPost(fullPost);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

export function useDeletePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (postId: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.deletePost(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

// Comment Queries
export function useGetComments(postId: string | undefined) {
  const { actor, isFetching } = useActor();
  
  return useQuery<Comment[]>({
    queryKey: ["comments", postId],
    queryFn: async () => {
      if (!actor || !postId) return [];
      return actor.getCommentsByPost(postId);
    },
    enabled: !!actor && !isFetching && !!postId,
  });
}

export function useCreateComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (comment: Omit<Comment, "id" | "timestamp">) => {
      if (!actor) throw new Error("Not connected");
      const fullComment: Comment = {
        ...comment,
        id: crypto.randomUUID(),
        timestamp: BigInt(Date.now()) * BigInt(1_000_000),
      };
      return actor.createComment(fullComment);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["comments", variables.postId] });
    },
  });
}

export function useDeleteComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ commentId, postId }: { commentId: string; postId: string }) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteComment(commentId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["comments", variables.postId] });
    },
  });
}

// Reaction Mutations
export function useAddReaction() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      userId,
      postId,
      reaction,
    }: {
      userId: string;
      postId: string;
      reaction: ReactionType;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.addReaction(userId, postId, reaction);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["post", variables.postId] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

export function useRemoveReaction() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      userId,
      postId,
      reaction,
    }: {
      userId: string;
      postId: string;
      reaction: ReactionType;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.removeReaction(userId, postId, reaction);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["post", variables.postId] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

// Friendship Queries
export function useGetFriends(userId: string | undefined) {
  const { actor, isFetching } = useActor();
  
  return useQuery<string[]>({
    queryKey: ["friends", userId],
    queryFn: async () => {
      if (!actor || !userId) return [];
      return actor.getFriends(userId);
    },
    enabled: !!actor && !isFetching && !!userId,
  });
}

export function useGetPendingFriendRequests() {
  const { actor, isFetching } = useActor();
  
  return useQuery({
    queryKey: ["pendingFriendRequests"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPendingFriendRequests();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAreFriends(userId1: string | undefined, userId2: string | undefined) {
  const { actor, isFetching } = useActor();
  
  return useQuery<boolean>({
    queryKey: ["areFriends", userId1, userId2],
    queryFn: async () => {
      if (!actor || !userId1 || !userId2) return false;
      return actor.areFriends(userId1, userId2);
    },
    enabled: !!actor && !isFetching && !!userId1 && !!userId2,
  });
}

export function useSendFriendRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (toUserId: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.sendFriendRequest(toUserId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["areFriends"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
  });
}

export function useAcceptFriendRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (fromUserId: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.acceptFriendRequest(fromUserId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingFriendRequests"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["areFriends"] });
    },
  });
}

export function useRejectFriendRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (fromUserId: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.rejectFriendRequest(fromUserId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingFriendRequests"] });
    },
  });
}

export function useUnfriend() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.unfriend(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["areFriends"] });
    },
  });
}

// Moderation Queries
export function useIsSiteOwner() {
  const { actor, isFetching } = useActor();
  
  return useQuery<boolean>({
    queryKey: ["isSiteOwner"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isSiteOwner();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetFlaggedPosts() {
  const { actor, isFetching } = useActor();
  
  return useQuery<Post[]>({
    queryKey: ["flaggedPosts"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getFlaggedPosts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useFlagPost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (postId: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.flagPost(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["flaggedPosts"] });
    },
  });
}

export function useUnflagPost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (postId: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.unflagPost(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flaggedPosts"] });
    },
  });
}

export function useBanUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.banUser(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
  });
}

export function useUnbanUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.unbanUser(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
  });
}
