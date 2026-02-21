import Array "mo:core/Array";
import Text "mo:core/Text";
import Principal "mo:core/Principal";
import Map "mo:core/Map";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Order "mo:core/Order";
import ExternalBlob "blob-storage/Storage";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";

actor {
  public type UserProfile = {
    username : Text;
    email : Text;
    dateOfBirth : Time.Time;
    avatar : ?ExternalBlob.ExternalBlob;
    bio : Text;
    isProfilePublic : Bool;
    lastEmotion : Text;
    lastBodySensation : Text;
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

  let userProfiles = Map.empty<Text, UserProfile>();
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

  // Post Management Functions
  public shared ({ caller }) func createPost(post : Post) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can create posts");
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
    switch (userPosts.get(postId)) {
      case (null) { null };
      case (?post) {
        // Filter 18+ content based on caller's age
        if (post.is18Plus) {
          switch (getUserIdFromCaller(caller)) {
            case (null) {
              // Guest users cannot view 18+ content
              if (AccessControl.isAdmin(accessControlState, caller)) {
                ?post;
              } else {
                null;
              };
            };
            case (?callerUserId) {
              if (canView18PlusContent(callerUserId) or AccessControl.isAdmin(accessControlState, caller)) {
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
            Runtime.trap("Post does not exist");
          };
          case (?post) {
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

  // Query functions for retrieving posts with age-based filtering
  public query ({ caller }) func getPosts(limit : Nat, offset : Nat) : async [Post] {
    let callerUserId = getUserIdFromCaller(caller);
    let canViewAdult = switch (callerUserId) {
      case (null) { AccessControl.isAdmin(accessControlState, caller) };
      case (?userId) { canView18PlusContent(userId) or AccessControl.isAdmin(accessControlState, caller) };
    };

    let allPosts = userPosts.values().toArray();
    let filteredPosts = allPosts.filter(func(post) {
      if (post.is18Plus) { canViewAdult } else { true };
    });

    let start = if (offset < filteredPosts.size()) { offset } else { filteredPosts.size() };
    let end = if (start + limit < filteredPosts.size()) { start + limit } else { filteredPosts.size() };

    filteredPosts.sliceToArray(start, end);
  };

  public query ({ caller }) func getPostsByUser(userId : Text, limit : Nat, offset : Nat) : async [Post] {
    let callerUserId = getUserIdFromCaller(caller);
    let canViewAdult = switch (callerUserId) {
      case (null) { AccessControl.isAdmin(accessControlState, caller) };
      case (?id) { canView18PlusContent(id) or AccessControl.isAdmin(accessControlState, caller) };
    };

    let allPosts = userPosts.values().toArray();
    let filteredPosts = allPosts.filter(func(post) {
      if (post.userId == userId) {
        if (post.is18Plus) { canViewAdult } else { true };
      } else {
        false;
      };
    });

    let start = if (offset < filteredPosts.size()) { offset } else { filteredPosts.size() };
    let end = if (start + limit < filteredPosts.size()) { start + limit } else { filteredPosts.size() };

    filteredPosts.sliceToArray(start, end);
  };

  public query ({ caller }) func getCommentsByPost(postId : Text) : async [Comment] {
    // Anyone can view comments if they can view the post
    switch (userPosts.get(postId)) {
      case (null) { [] };
      case (?post) {
        let callerUserId = getUserIdFromCaller(caller);
        let canView = if (post.is18Plus) {
          switch (callerUserId) {
            case (null) { AccessControl.isAdmin(accessControlState, caller) };
            case (?userId) { canView18PlusContent(userId) or AccessControl.isAdmin(accessControlState, caller) };
          };
        } else {
          true;
        };

        if (canView) {
          let allComments = userComments.values().toArray();
          allComments.filter<Comment>(func(comment) {
            comment.postId == postId;
          });
        } else {
          [];
        };
      };
    };
  };
};
