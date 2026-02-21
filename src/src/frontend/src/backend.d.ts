import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface Friendship {
    status: FriendshipStatus;
    userId1: string;
    userId2: string;
}
export type Time = bigint;
export interface Post {
    id: string;
    content: string;
    is18Plus: boolean;
    emotion: string;
    userId: string;
    isAnonymous: boolean;
    bodySensation: string;
    imageUrl?: ExternalBlob;
    timestamp: Time;
    flaggedBy?: string;
    visibility: PostVisibility;
    isFlagged: boolean;
}
export interface Comment {
    id: string;
    content: string;
    parentCommentId?: string;
    userId: string;
    timestamp: Time;
    postId: string;
}
export interface UserProfile {
    bio: string;
    username: string;
    dateOfBirth: Time;
    banner?: ExternalBlob;
    email: string;
    lastBodySensation: string;
    isBanned: boolean;
    stickerIds: Array<string>;
    isProfilePublic: boolean;
    lastEmotion: string;
    avatar?: ExternalBlob;
}
export enum FriendshipStatus {
    pending = "pending",
    rejected = "rejected",
    accepted = "accepted"
}
export enum PostVisibility {
    friendsOnly = "friendsOnly",
    publicVisibility = "publicVisibility",
    privateAccess = "privateAccess"
}
export enum ReactionType {
    cry = "cry",
    heart = "heart",
    fire = "fire",
    slap = "slap",
    vibe = "vibe"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    acceptFriendRequest(fromUserId: string): Promise<void>;
    addReaction(userId: string, postId: string, reaction: ReactionType): Promise<void>;
    areFriends(userId1: string, userId2: string): Promise<boolean>;
    areUsersFriends(userId1: string, userId2: string): Promise<boolean>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    banUser(userId: string): Promise<void>;
    createComment(comment: Comment): Promise<void>;
    createPost(post: Post): Promise<void>;
    deleteComment(commentId: string): Promise<void>;
    deletePost(postId: string): Promise<void>;
    flagPost(postId: string): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCommentsByPost(postId: string): Promise<Array<Comment>>;
    getFlaggedPosts(): Promise<Array<Post>>;
    getFriends(userId: string): Promise<Array<string>>;
    getFriendsByUserId(userId: string): Promise<Array<string>>;
    getPendingFriendRequests(): Promise<Array<Friendship>>;
    getPost(postId: string): Promise<Post | null>;
    getPosts(limit: bigint, offset: bigint): Promise<Array<Post>>;
    getPostsByUser(userId: string, limit: bigint, offset: bigint): Promise<Array<Post>>;
    getUserProfile(userId: string): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    isSiteOwner(): Promise<boolean>;
    isUsernameAvailable(userId: string): Promise<boolean>;
    registerUser(profile: UserProfile): Promise<void>;
    rejectFriendRequest(fromUserId: string): Promise<void>;
    removeReaction(userId: string, postId: string, reaction: ReactionType): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    sendFriendRequest(toUserId: string): Promise<void>;
    unbanUser(userId: string): Promise<void>;
    unflagPost(postId: string): Promise<void>;
    unfriend(userId: string): Promise<void>;
    updatePost(post: Post): Promise<void>;
    updateUserProfile(profile: UserProfile): Promise<void>;
}
