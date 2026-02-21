import Array "mo:core/Array";
import Text "mo:core/Text";
import Principal "mo:core/Principal";
import Map "mo:core/Map";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Order "mo:core/Order";
import Iter "mo:core/Iter";

import ExternalBlob "blob-storage/Storage";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";


actor {
  type FriendshipStatus = {
    #pending;
    #accepted;
    #rejected;
  };

  type ProfileVisibility = {
    #publicVisibility;
    #privateAccess; // Renamed from #private
  };

  public type PostVisibility = {
    #publicVisibility;
    #friendsOnly;
    #privateAccess; // Renamed from #private
  };

  public type UserProfile = {
    username : Text;
    email : Text;
    dateOfBirth : Time.Time;
    avatar : ?ExternalBlob.ExternalBlob;
    banner : ?ExternalBlob.ExternalBlob;
    bio : Text;
    isProfilePublic : Bool;
    lastEmotion : Text;
    lastBodySensation : Text;
    stickerIds : [Text];
    isBanned : Bool;
  };

  public type Post = {
    id : Text;
    userId : Text;
    content : Text;
    imageUrl : ?ExternalBlob.ExternalBlob;
    isAnonymous : Bool;
    emotion : Text;
    bodySensation : Text;
    is18Plus : Bool;
    timestamp : Time.Time;
    isFlagged : Bool;
    visibility : PostVisibility;
    flaggedBy : ?Text;
  };

  public type ReactionType = {
    #heart;
    #slap;
    #cry;
    #fire;
    #vibe;
  };

  public type Comment = {
    id : Text;
    postId : Text;
    userId : Text;
    content : Text;
    parentCommentId : ?Text;
    timestamp : Time.Time;
  };

  module Reaction {
    public func compare(r1 : ReactionType, r2 : ReactionType) : Order.Order {
      switch (r1, r2) {
        case (#heart, #heart) { #equal };
        case (#heart, _) { #less };
        case (#slap, #heart) { #greater };
        case (#slap, #slap) { #equal };
        case (#slap, _) { #less };
        case (#cry, #cry) { #equal };
        case (#cry, #fire) { #less };
        case (#cry, #vibe) { #less };
        case (#fire, #heart) { #greater };
        case (#fire, #slap) { #greater };
        case (#fire, #cry) { #greater };
        case (#fire, #fire) { #equal };
        case (#fire, #vibe) { #less };
        case (#vibe, #vibe) { #equal };
        case (#vibe, _) { #greater };
      };
    };
  };

  type Friendship = {
    userId1 : Text;
    userId2 : Text;
    status : FriendshipStatus;
  };

  let userProfiles = Map.empty<Text, UserProfile>();
  let friendships = Map.empty<Text, Friendship>();
  let usernameToPrincipal = Map.empty<Text, Principal>();
  let principalToUsername = Map.empty<Principal, Text>();
  let userPosts = Map.empty<Text, Post>();
  let userComments = Map.empty<Text, Comment>();
  let reactions = Map.empty<Text, (Text, Text, ReactionType)>();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  // Helper function to calculate age from date of birth
  private func calculateAge(dateOfBirth : Time.Time) : Nat {
    let now = Time.now();
    let ageInNanos = now - dateOfBirth;
    let nanosPerYear : Int = 365 * 24 * 60 * 60 * 1_000_000_000;
    let age = ageInNanos / nanosPerYear;
    if (age < 0) { 0 } else { Int.abs(age) };
  };

  // Helper function to check if user can view 18+ content
  private func canView18PlusContent(userId : Text) : Bool {
    switch (userProfiles.get(userId)) {
      case (null) { false };
      case (?profile) {
        let age = calculateAge(profile.dateOfBirth);
        age >= 18;
      };
    };
  };

  // Helper function to get userId from caller principal
  private func getUserIdFromCaller(caller : Principal) : ?Text {
    principalToUsername.get(caller);
  };

  // Helper function to check if caller is site owner
  private func isSiteOwnerHelper(caller : Principal) : Bool {
    switch (getUserIdFromCaller(caller)) {
      case (null) { false };
      case (?userId) {
        switch (userProfiles.get(userId)) {
          case (null) { false };
          case (?profile) { profile.email == "leasiayanna@gmail.com" };
        };
      };
    };
  };

  // Helper function to check if user is banned
  private func isUserBanned(userId : Text) : Bool {
    switch (userProfiles.get(userId)) {
      case (null) { false };
      case (?profile) { profile.isBanned };
    };
  };

  // Helper function to check if caller is banned
  private func isCallerBanned(caller : Principal) : Bool {
    switch (getUserIdFromCaller(caller)) {
      case (null) { false };
      case (?userId) { isUserBanned(userId) };
    };
  };

  // Site owner check function
  public query ({ caller }) func isSiteOwner() : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can check is site owner");
    };
    isSiteOwnerHelper(caller);
  };

  // Helper function to check if two users are friends
  private func areFriendsHelper(userId1 : Text, userId2 : Text) : Bool {
    let friendshipKey1 = userId1 # "-" # userId2;
    let friendshipKey2 = userId2 # "-" # userId1;

    let friendship1 = friendships.get(friendshipKey1);
    let friendship2 = friendships.get(friendshipKey2);

    switch (friendship1, friendship2) {
      case (?f1, ?f2) {
        f1.status == #accepted or f2.status == #accepted;
      };
      case (?f1, null) { f1.status == #accepted };
      case (null, ?f2) { f2.status == #accepted };
      case (null, null) { false };
    };
  };

  // Required profile management functions for frontend
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    switch (getUserIdFromCaller(caller)) {
      case (null) { null };
      case (?userId) { userProfiles.get(userId) };
    };
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };

    // Check if username is already taken by another user
    switch (usernameToPrincipal.get(profile.username)) {
      case (?existingPrincipal) {
        if (existingPrincipal != caller) {
          Runtime.trap("Username already exists. Please try a different one");
        };
      };
      case (null) {};
    };

    // Update mappings
    switch (getUserIdFromCaller(caller)) {
      case (?oldUserId) {
        if (oldUserId != profile.username) {
          usernameToPrincipal.remove(oldUserId);
        };
      };
      case (null) {};
    };

    usernameToPrincipal.add(profile.username, caller);
    principalToUsername.add(caller, profile.username);
    userProfiles.add(profile.username, profile);
  };

  public query ({ caller }) func getUserProfile(userId : Text) : async ?UserProfile {
    switch (userProfiles.get(userId)) {
      case (null) { null };
      case (?profile) {
        // Check if profile is public or if caller is the owner or admin
        if (profile.isProfilePublic) {
          ?profile;
        } else {
          switch (getUserIdFromCaller(caller)) {
            case (?callerUserId) {
              if (callerUserId == userId or AccessControl.isAdmin(accessControlState, caller)) {
                ?profile;
              } else {
                null;
              };
            };
            case (null) {
              if (AccessControl.isAdmin(accessControlState, caller)) {
                ?profile;
              } else {
                null;
              };
            };
          };
        };
      };
    };
  };

  // User Management Functions
  public shared ({ caller }) func registerUser(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can register");
    };

    if (userProfiles.containsKey(profile.username)) {
      Runtime.trap("Username already exists. Please try a different one");
    };

    usernameToPrincipal.add(profile.username, caller);
    principalToUsername.add(caller, profile.username);
    userProfiles.add(profile.username, profile);
  };

  public shared ({ caller }) func updateUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can update profiles");
    };

    switch (getUserIdFromCaller(caller)) {
      case (null) {
        Runtime.trap("Unauthorized: User profile not found");
      };
      case (?callerUserId) {
        if (callerUserId != profile.username) {
          Runtime.trap("Unauthorized: Can only update your own profile");
        };
        userProfiles.add(profile.username, profile);
      };
    };
  };

  public query ({ caller }) func isUsernameAvailable(userId : Text) : async Bool {
    // Anyone can check username availability
    not userProfiles.containsKey(userId);
  };

  // Site owner privilege functions
  public shared ({ caller }) func banUser(userId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };

    if (not isSiteOwnerHelper(caller)) {
      Runtime.trap("Unauthorized: Only site owner can ban users");
    };

    switch (userProfiles.get(userId)) {
      case (null) {
        Runtime.trap("User not found");
      };
      case (?profile) {
        let updatedProfile = {
          profile with isBanned = true;
        };
        userProfiles.add(userId, updatedProfile);
      };
    };
  };

  public shared ({ caller }) func unbanUser(userId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };

    if (not isSiteOwnerHelper(caller)) {
      Runtime.trap("Unauthorized: Only site owner can unban users");
    };

    switch (userProfiles.get(userId)) {
      case (null) {
        Runtime.trap("User not found");
      };
      case (?profile) {
        let updatedProfile = {
          profile with isBanned = false;
        };
        userProfiles.add(userId, updatedProfile);
      };
    };
  };

  public query ({ caller }) func getFlaggedPosts() : async [Post] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };

    if (not isSiteOwnerHelper(caller)) {
      Runtime.trap("Unauthorized: Only site owner can view flagged posts");
    };

    let allPosts = userPosts.values().toArray();
    allPosts.filter(func(post) { post.isFlagged });
  };

  public shared ({ caller }) func flagPost(postId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can flag posts");
    };

    // Check if caller is banned
    if (isCallerBanned(caller)) {
      Runtime.trap("Unauthorized: Banned users cannot flag posts");
    };

    switch (getUserIdFromCaller(caller)) {
      case (null) {
        Runtime.trap("Unauthorized: User profile not found");
      };
      case (?callerUserId) {
        switch (userPosts.get(postId)) {
          case (null) {
            Runtime.trap("Post not found");
          };
          case (?post) {
            let updatedPost = {
              post with
              isFlagged = true;
              flaggedBy = ?callerUserId;
            };
            userPosts.add(postId, updatedPost);
          };
        };
      };
    };
  };

  public shared ({ caller }) func unflagPost(postId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };

    if (not isSiteOwnerHelper(caller)) {
      Runtime.trap("Unauthorized: Only site owner can unflag posts");
    };

    switch (userPosts.get(postId)) {
      case (null) {
        Runtime.trap("Post not found");
      };
      case (?post) {
        let updatedPost = {
          post with
          isFlagged = false;
          flaggedBy = null;
        };
        userPosts.add(postId, updatedPost);
      };
    };
  };

  // Post Management Functions
  public shared ({ caller }) func createPost(post : Post) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can create posts");
    };

    // Check if caller is banned
    if (isCallerBanned(caller)) {
      Runtime.trap("Unauthorized: Banned users cannot create posts");
    };

    switch (getUserIdFromCaller(caller)) {
      case (null) {
        Runtime.trap("Unauthorized: User profile not found");
      };
      case (?callerUserId) {
        // Verify the post userId matches the caller's userId
        if (post.userId != callerUserId) {
          Runtime.trap("Unauthorized: Can only create posts for your own account");
        };
        userPosts.add(post.id, post);
      };
    };
  };

  public query ({ caller }) func getPost(postId : Text) : async ?Post {
    let callerUserId = getUserIdFromCaller(caller);
    let isSiteOwner = isSiteOwnerHelper(caller);

    switch (userPosts.get(postId)) {
      case (null) { null };
      case (?post) {
        // Check visibility rules
        let canViewPost = switch (post.visibility) {
          case (#publicVisibility) { true };
          case (#friendsOnly) {
            switch (callerUserId) {
              case (null) { false };
              case (?userId) {
                userId == post.userId or areFriendsHelper(post.userId, userId);
              };
            };
          };
          case (#privateAccess) {
            switch (callerUserId) {
              case (null) { isSiteOwner };
              case (?userId) {
                userId == post.userId or isSiteOwner;
              };
            };
          };
        };

        if (not canViewPost) {
          return null;
        };

        // Filter 18+ content based on caller's age
        if (post.is18Plus) {
          switch (callerUserId) {
            case (null) {
              // Guest users cannot view 18+ content unless admin
              if (AccessControl.isAdmin(accessControlState, caller)) {
                ?post;
              } else {
                null;
              };
            };
            case (?userId) {
              if (canView18PlusContent(userId) or AccessControl.isAdmin(accessControlState, caller) or isSiteOwner) {
                ?post;
              } else {
                null;
              };
            };
          };
        } else {
          ?post;
        };
      };
    };
  };

  public shared ({ caller }) func updatePost(post : Post) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can update posts");
    };

    // Check if caller is banned
    if (isCallerBanned(caller)) {
      Runtime.trap("Unauthorized: Banned users cannot update posts");
    };

    switch (userPosts.get(post.id)) {
      case (null) {
        Runtime.trap("Post does not exist");
      };
      case (?existingPost) {
        switch (getUserIdFromCaller(caller)) {
          case (null) {
            Runtime.trap("Unauthorized: User profile not found");
          };
          case (?callerUserId) {
            // Only post owner or admin can update
            if (existingPost.userId != callerUserId and not AccessControl.isAdmin(accessControlState, caller)) {
              Runtime.trap("Unauthorized: Can only update your own posts");
            };
            userPosts.add(post.id, post);
          };
        };
      };
    };
  };

  public shared ({ caller }) func deletePost(postId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can delete posts");
    };

    // Check if caller is banned
    if (isCallerBanned(caller)) {
      Runtime.trap("Unauthorized: Banned users cannot delete posts");
    };

    switch (userPosts.get(postId)) {
      case (null) {
        Runtime.trap("Post does not exist");
      };
      case (?post) {
        switch (getUserIdFromCaller(caller)) {
          case (null) {
            Runtime.trap("Unauthorized: User profile not found");
          };
          case (?callerUserId) {
            // Only post owner or admin can delete
            if (post.userId != callerUserId and not AccessControl.isAdmin(accessControlState, caller)) {
              Runtime.trap("Unauthorized: Can only delete your own posts");
            };
            userPosts.remove(postId);
          };
        };
      };
    };
  };

  // Reaction Management Functions
  public shared ({ caller }) func addReaction(userId : Text, postId : Text, reaction : ReactionType) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can add reactions");
    };

    // Check if caller is banned
    if (isCallerBanned(caller)) {
      Runtime.trap("Unauthorized: Banned users cannot add reactions");
    };

    switch (getUserIdFromCaller(caller)) {
      case (null) {
        Runtime.trap("Unauthorized: User profile not found");
      };
      case (?callerUserId) {
        // Verify the userId matches the caller's userId
        if (userId != callerUserId) {
          Runtime.trap("Unauthorized: Can only add reactions for your own account");
        };

        // Verify post exists and caller can view it
        switch (userPosts.get(postId)) {
          case (null) {
            Runtime.trap("Post not found");
          };
          case (?post) {
            // Check visibility
            let canViewPost = switch (post.visibility) {
              case (#publicVisibility) { true };
              case (#friendsOnly) {
                callerUserId == post.userId or areFriendsHelper(post.userId, callerUserId);
              };
              case (#privateAccess) {
                callerUserId == post.userId or isSiteOwnerHelper(caller);
              };
            };

            if (not canViewPost) {
              Runtime.trap("Unauthorized: Cannot react to this post");
            };

            // Check if caller can view 18+ content
            if (post.is18Plus and not canView18PlusContent(callerUserId)) {
              Runtime.trap("Unauthorized: Cannot react to 18+ content");
            };
            reactions.add(userId # postId, (userId, postId, reaction));
          };
        };
      };
    };
  };

  public shared ({ caller }) func removeReaction(userId : Text, postId : Text, reaction : ReactionType) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can remove reactions");
    };

    // Check if caller is banned
    if (isCallerBanned(caller)) {
      Runtime.trap("Unauthorized: Banned users cannot remove reactions");
    };

    switch (getUserIdFromCaller(caller)) {
      case (null) {
        Runtime.trap("Unauthorized: User profile not found");
      };
      case (?callerUserId) {
        // Verify the userId matches the caller's userId
        if (userId != callerUserId) {
          Runtime.trap("Unauthorized: Can only remove your own reactions");
        };
        reactions.remove(userId # postId);
      };
    };
  };

  // Comment Management Functions
  public shared ({ caller }) func createComment(comment : Comment) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can create comments");
    };

    // Check if caller is banned
    if (isCallerBanned(caller)) {
      Runtime.trap("Unauthorized: Banned users cannot create comments");
    };

    switch (getUserIdFromCaller(caller)) {
      case (null) {
        Runtime.trap("Unauthorized: User profile not found");
      };
      case (?callerUserId) {
        // Verify the comment userId matches the caller's userId
        if (comment.userId != callerUserId) {
          Runtime.trap("Unauthorized: Can only create comments for your own account");
        };

        // Verify post exists and caller can view it
        switch (userPosts.get(comment.postId)) {
          case (null) {
            Runtime.trap("Post does not exist");
          };
          case (?post) {
            // Check visibility
            let canViewPost = switch (post.visibility) {
              case (#publicVisibility) { true };
              case (#friendsOnly) {
                callerUserId == post.userId or areFriendsHelper(post.userId, callerUserId);
              };
              case (#privateAccess) {
                callerUserId == post.userId or isSiteOwnerHelper(caller);
              };
            };

            if (not canViewPost) {
              Runtime.trap("Unauthorized: Cannot comment on this post");
            };

            // Check if caller can view 18+ content
            if (post.is18Plus and not canView18PlusContent(callerUserId)) {
              Runtime.trap("Unauthorized: Cannot comment on 18+ content");
            };
            userComments.add(comment.id, comment);
          };
        };
      };
    };
  };

  public shared ({ caller }) func deleteComment(commentId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can delete comments");
    };

    // Check if caller is banned
    if (isCallerBanned(caller)) {
      Runtime.trap("Unauthorized: Banned users cannot delete comments");
    };

    switch (userComments.get(commentId)) {
      case (null) {
        Runtime.trap("Comment does not exist");
      };
      case (?comment) {
        switch (getUserIdFromCaller(caller)) {
          case (null) {
            Runtime.trap("Unauthorized: User profile not found");
          };
          case (?callerUserId) {
            // Only comment owner or admin can delete
            if (comment.userId != callerUserId and not AccessControl.isAdmin(accessControlState, caller)) {
              Runtime.trap("Unauthorized: Can only delete your own comments");
            };
            userComments.remove(commentId);
          };
        };
      };
    };
  };

  // Query functions for retrieving posts with age-based filtering and access filtering
  public query ({ caller }) func getPosts(limit : Nat, offset : Nat) : async [Post] {
    let callerUserId = getUserIdFromCaller(caller);
    let isSiteOwner = isSiteOwnerHelper(caller);

    let allPosts = userPosts.values().toArray();
    let filteredPosts = allPosts.filter(func(post) {
      let canSeePost = switch (post.visibility) {
        case (#publicVisibility) { true };
        case (#friendsOnly) {
          switch (callerUserId) {
            case (null) { false };
            case (?userId) {
              userId == post.userId or areFriendsHelper(post.userId, userId);
            };
          };
        };
        case (#privateAccess) {
          switch (callerUserId) {
            case (null) { isSiteOwner };
            case (?userId) {
              userId == post.userId or isSiteOwner;
            };
          };
        };
      };

      if (post.is18Plus) {
        switch (callerUserId) {
          case (null) { false };
          case (?userId) { canSeePost and canView18PlusContent(userId) };
        };
      } else {
        canSeePost;
      };
    });

    let start = if (offset < filteredPosts.size()) { offset } else { filteredPosts.size() };
    let end = if (start + limit < filteredPosts.size()) { start + limit } else { filteredPosts.size() };

    let slice = filteredPosts.sliceToArray(start, end);
    slice;
  };

  public query ({ caller }) func getPostsByUser(userId : Text, limit : Nat, offset : Nat) : async [Post] {
    let callerUserId = getUserIdFromCaller(caller);
    let isSiteOwner = isSiteOwnerHelper(caller);

    let allPosts = userPosts.values().toArray();

    let filteredPosts = allPosts.filter(func(post) {
      if (post.userId != userId) {
        return false;
      };

      let canSeePost = switch (post.visibility) {
        case (#publicVisibility) { true };
        case (#friendsOnly) {
          switch (callerUserId) {
            case (null) { false };
            case (?id) {
              id == post.userId or areFriendsHelper(post.userId, id);
            };
          };
        };
        case (#privateAccess) {
          switch (callerUserId) {
            case (null) { isSiteOwner };
            case (?id) {
              id == post.userId or isSiteOwner;
            };
          };
        };
      };

      if (post.is18Plus) {
        switch (callerUserId) {
          case (null) { false };
          case (?id) { canSeePost and canView18PlusContent(id) };
        };
      } else {
        canSeePost;
      };
    });

    let start = if (offset < filteredPosts.size()) { offset } else { filteredPosts.size() };
    let end = if (start + limit < filteredPosts.size()) { start + limit } else { filteredPosts.size() };

    filteredPosts.sliceToArray(start, end);
  };

  // Friendship management
  public shared ({ caller }) func sendFriendRequest(toUserId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send friend requests");
    };

    // Check if caller is banned
    if (isCallerBanned(caller)) {
      Runtime.trap("Unauthorized: Banned users cannot send friend requests");
    };

    let fromUserId = switch (principalToUsername.get(caller)) {
      case (null) {
        Runtime.trap("Unauthorized: User profile not found");
        "";
      };
      case (?id) { id };
    };

    let friendshipKey = fromUserId # "-" # toUserId;

    // Check if friendship already exists
    if (friendships.containsKey(friendshipKey)) {
      switch (friendships.get(friendshipKey)) {
        case (?friendship) {
          switch (friendship.status) {
            case (#pending) {
              Runtime.trap("Friend request already pending");
            };
            case (#accepted) {
              Runtime.trap("Users are already friends");
            };
            case (#rejected) {
              let newFriendship : Friendship = {
                userId1 = fromUserId;
                userId2 = toUserId;
                status = #pending;
              };
              friendships.add(friendshipKey, newFriendship);
            };
          };
        };
        case (null) {};
      };
    } else {
      // Create new friend request
      let newFriendship : Friendship = {
        userId1 = fromUserId;
        userId2 = toUserId;
        status = #pending;
      };
      friendships.add(friendshipKey, newFriendship);

      friendships.add(
        toUserId # "-" # fromUserId,
        {
          userId1 = toUserId;
          userId2 = fromUserId;
          status = #pending;
        },
      );
    };
  };

  public shared ({ caller }) func acceptFriendRequest(fromUserId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can accept friend requests");
    };

    // Check if caller is banned
    if (isCallerBanned(caller)) {
      Runtime.trap("Unauthorized: Banned users cannot accept friend requests");
    };

    let toUserId = switch (principalToUsername.get(caller)) {
      case (null) {
        Runtime.trap("Unauthorized: User profile not found");
        "";
      };
      case (?id) { id };
    };

    let friendshipKey = fromUserId # "-" # toUserId;

    switch (friendships.get(friendshipKey)) {
      case (null) {
        Runtime.trap("Friend request not found");
      };
      case (?friendship) {
        if (friendship.status != #pending) {
          Runtime.trap("Cannot accept non-pending friend request");
        };

        // Update both directions
        friendships.add(
          fromUserId # "-" # toUserId,
          {
            userId1 = fromUserId;
            userId2 = toUserId;
            status = #accepted;
          },
        );
        friendships.add(
          toUserId # "-" # fromUserId,
          {
            userId1 = toUserId;
            userId2 = fromUserId;
            status = #accepted;
          },
        );
      };
    };
  };

  public shared ({ caller }) func rejectFriendRequest(fromUserId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can reject friend requests");
    };

    // Check if caller is banned
    if (isCallerBanned(caller)) {
      Runtime.trap("Unauthorized: Banned users cannot reject friend requests");
    };

    let toUserId = switch (principalToUsername.get(caller)) {
      case (null) {
        Runtime.trap("Unauthorized: User profile not found");
        "";
      };
      case (?id) { id };
    };

    let friendshipKey = fromUserId # "-" # toUserId;

    switch (friendships.get(friendshipKey)) {
      case (null) {
        Runtime.trap("Friend request not found");
      };
      case (?friendship) {
        if (friendship.status != #pending) {
          Runtime.trap("Cannot reject non-pending friend request");
        };

        // Update both directions
        friendships.add(
          fromUserId # "-" # toUserId,
          {
            userId1 = fromUserId;
            userId2 = toUserId;
            status = #rejected;
          },
        );
        friendships.add(
          toUserId # "-" # fromUserId,
          {
            userId1 = toUserId;
            userId2 = fromUserId;
            status = #rejected;
          },
        );
      };
    };
  };

  public shared ({ caller }) func unfriend(userId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can remove friends");
    };

    // Check if caller is banned
    if (isCallerBanned(caller)) {
      Runtime.trap("Unauthorized: Banned users cannot unfriend");
    };

    let fromUserId = switch (principalToUsername.get(caller)) {
      case (null) {
        Runtime.trap("Unauthorized: User profile not found");
        "";
      };
      case (?id) { id };
    };

    friendships.remove(fromUserId # "-" # userId);
    friendships.remove(userId # "-" # fromUserId);
  };

  public query ({ caller }) func getFriends(userId : Text) : async [Text] {
    let friendsIter = friendships.values().filter(
      func(friendship) {
        (friendship.userId1 == userId or friendship.userId2 == userId) and friendship.status == #accepted
      }
    );
    let friends = friendsIter.toArray();
    if (friends.size() == 0) {
      [];
    } else {
      friends.map(
        func(friendship) {
          if (friendship.userId1 == userId) { friendship.userId2 } else {
            friendship.userId1;
          };
        }
      );
    };
  };

  public query ({ caller }) func areFriends(userId1 : Text, userId2 : Text) : async Bool {
    areFriendsHelper(userId1, userId2);
  };

  public query ({ caller }) func areUsersFriends(userId1 : Text, userId2 : Text) : async Bool {
    areFriendsHelper(userId1, userId2);
  };

  public query ({ caller }) func getPendingFriendRequests() : async [Friendship] {
    let userId = switch (principalToUsername.get(caller)) {
      case (null) {
        Runtime.trap("Unauthorized: User profile not found");
        "";
      };
      case (?id) { id };
    };

    let requestsIter = friendships.values().filter(
      func(friendship) {
        friendship.userId2 == userId and friendship.status == #pending;
      }
    );
    requestsIter.toArray();
  };

  public query ({ caller }) func getFriendsByUserId(userId : Text) : async [Text] {
    let friendsIter = friendships.values().filter(
      func(friendship) {
        (friendship.userId1 == userId or friendship.userId2 == userId) and friendship.status == #accepted;
      }
    );
    let friends = friendsIter.toArray();
    if (friends.size() == 0) {
      [];
    } else {
      friends.map(
        func(friendship) {
          if (friendship.userId1 == userId) { friendship.userId2 } else {
            friendship.userId1;
          };
        }
      );
    };
  };

  // Comment related queries.
  public query ({ caller }) func getCommentsByPost(postId : Text) : async [Comment] {
    let post = userPosts.get(postId);

    switch (post) {
      case (null) { [] };
      case (?p) {
        let allComments = userComments.values().toArray();
        let filteredComments = allComments.filter(
          func(comment) {
            comment.postId == postId;
          }
        );
        filteredComments;
      };
    };
  };
};

