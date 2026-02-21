import ExternalBlob "blob-storage/Storage";
import Time "mo:core/Time";

module {
  type OldUserProfile = {
    username : Text;
    email : Text;
    dateOfBirth : Time.Time;
    avatar : ?ExternalBlob.ExternalBlob;
    bio : Text;
    isProfilePublic : Bool;
    lastEmotion : Text;
    lastBodySensation : Text;
  };

  type NewUserProfile = {
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

  type OldPost = {
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

  type PostVisibility = {
    #publicVisibility;
    #friendsOnly;
    #privateAccess;
  };

  type NewPost = {
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

  // Helper functions
  public func upgradeUserProfile(old : OldUserProfile) : NewUserProfile {
    { old with banner = null; stickerIds = []; isBanned = false };
  };

  public func upgradePost(old : OldPost) : NewPost {
    {
      old with
      isFlagged = false;
      visibility = #publicVisibility;
      flaggedBy = null;
    };
  };
};

