
import { useCallback, useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import axios from "axios";
import { TailSpin } from "react-loader-spinner";
import {
  Add,
  Send,
  Like1,
  MessageText1,
  Share,
  Cup,
  Message,
  Bookmark,
  ArrowLeft,
} from "iconsax-reactjs";
import { useNavigate, useLocation, useParams} from "react-router-dom";
import { Link } from "react-router-dom";
const API = "https://route-posts.routemisr.com";

type User = {
  _id?: string;
  id?: string;
  name?: string;
  username?: string;
  photo?: string;
  cover?: string;
  email?: string;
  gender?: string;
  createdAt?: string;
  followersCount?: number;
  followingCount?: number;
  bookmarksCount?: number;
  isFollowing?: number;  
};

type ProfileResponse = {
  user: User;
  isFollowing?: boolean;
  [key: string]: unknown;
};

type CommentItem = {
  _id?: string;
  id?: string;
  content?: string;
  body?: string;
  createdAt?: string;
  commentCreator?: User;
  user?: User;
  likes?: unknown[];
};

type TopComment = CommentItem & {
  commentCreator?: User;
};

type PostItem = {
  _id?: string;
  id?: string;
  body?: string;
  image?: string;
  video?: string;
  createdAt?: string;
  user?: User | string;
  likes?: Array<string | { _id?: string }>;
  likesCount?: number;
  commentsCount?: number;
  sharesCount?: number;
  isBookmarked?: boolean;
  bookmarked?: boolean;
  topComment?: TopComment | null;
};



type CommentResponse = {
  comments?: CommentItem[];
  data?: {
    comments?: CommentItem[];
  };
};

type CommentMap = Record<string, CommentItem[]>;
type BooleanMap = Record<string, boolean>;
type InputMap = Record<string, string>;

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ||
      error.message ||
      "Something went wrong."
    );
  }

  return error instanceof Error ? error.message : "Something went wrong.";
}

function getPostId(post: PostItem): string {
  return post._id || post.id || "";
}

function getPostUserId(post: PostItem): string {
  if (typeof post.user === "string") {
    return post.user;
  }

  return post.user?._id || post.user?.id || "";
}

export default function Posts() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [body, setBody] = useState("");
  const [media, setMedia] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [likedPosts, setLikedPosts] = useState<BooleanMap>({});
  const [liking, setLiking] = useState<BooleanMap>({});

  const [sharing, setSharing] = useState<BooleanMap>({});
  const [sharedPosts, setSharedPosts] = useState<BooleanMap>(() => {
    try {
      return JSON.parse(localStorage.getItem("sharedPosts") || "{}");
    } catch {
      return {};
    }
  });

  const [commentsByPost, setCommentsByPost] = useState<CommentMap>({});
  const [commentsOpen, setCommentsOpen] = useState<BooleanMap>({});
  const [commentsLoading, setCommentsLoading] = useState<BooleanMap>({});
  const [commentInputs, setCommentInputs] = useState<InputMap>({});
  const [sendingComment, setSendingComment] = useState<BooleanMap>({});

  const getPosts = useCallback(async () => {
    try {
      setLoading(true);

      if (!token) {
        setPosts([]);
        return;
      }

      const response = await axios.get(`${API}/posts`, {
        headers: { token },
      });
       
      const fetchedPosts: PostItem[] =
        response.data?.data?.posts ??
        response.data?.posts ??
        [];

      setPosts(fetchedPosts);
       console.log(fetchedPosts)
      let currentUserId = "";

      try {
        currentUserId =
          JSON.parse(localStorage.getItem("user") || "null")?._id || "";
      } catch {
        currentUserId = "";
      }

      const initialLikedPosts: BooleanMap = {};

      fetchedPosts.forEach((post) => {
        const postId = getPostId(post);

        initialLikedPosts[postId] = Array.isArray(post.likes)
          ? post.likes.some((like) => {
              const likedUserId =
                typeof like === "string" ? like : like?._id;

              return Boolean(currentUserId) && likedUserId === currentUserId;
            })
          : false;
      });

      setLikedPosts(initialLikedPosts);
    } catch (error: unknown) {
      console.error("Error fetching posts:", getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void getPosts();
  }, [getPosts]);

  const getUserProfile = async (post: PostItem) => {
    try {
      if (!token) {
        console.error("Token not found");
        return;
      }

      const userId = getPostUserId(post);

      if (!userId) {
        console.error("User ID could not be found", post);
        return;
      }

      const response = await axios.get(
        `${API}/users/${userId}/profile`,
        {
          headers: { token },
        }
      );
console.log("Profile API response:", response.data);

const data = response.data?.data ?? response.data;

if (!data?.user) {
  console.error("The API response does not contain a user:", data);
  return;
}

const profileId = data.user._id || data.user.id || userId;

navigate(`/profile/${profileId}`, {
  state: { profileData: data },});
    } catch (error: unknown) {
      console.error("Error fetching user profile:", getErrorMessage(error));
    }
  };

  const createPost = async () => {
    setErrorMessage("");

    if (!body.trim() && !media) {
      return;
    }

    if (!token) {
      setErrorMessage("Please log in to create a post.");
      return;
    }

    const formData = new FormData();

    if (body.trim()) {
      formData.append("body", body.trim());
    }

    if (media) {
      formData.append("image", media);
    }

    try {
      setCreating(true);

      await axios.post(`${API}/posts`, formData, {
        headers: { token },
      });

      setBody("");
      setMedia(null);

      await getPosts();
    } catch (error: unknown) {
      console.error("Error creating post:", getErrorMessage(error));
      setErrorMessage(getErrorMessage(error));
    } finally {
      setCreating(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!token || liking[postId]) {
      return;
    }

    const wasLiked = Boolean(likedPosts[postId]);

    setLikedPosts((prev) => ({
      ...prev,
      [postId]: !wasLiked,
    }));

    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        getPostId(post) === postId
          ? {
              ...post,
              likesCount: Math.max(
                0,
                (post.likesCount ?? 0) + (wasLiked ? -1 : 1)
              ),
            }
          : post
      )
    );

    setLiking((prev) => ({
      ...prev,
      [postId]: true,
    }));

    try {
      await axios.put(
        `${API}/posts/${postId}/like`,
        {},
        { headers: { token } }
      );
    } catch (error: unknown) {
      setLikedPosts((prev) => ({
        ...prev,
        [postId]: wasLiked,
      }));

      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          getPostId(post) === postId
            ? {
                ...post,
                likesCount: Math.max(
                  0,
                  (post.likesCount ?? 0) + (wasLiked ? 1 : -1)
                ),
              }
            : post
        )
      );

      console.error("Error toggling like:", getErrorMessage(error));
    } finally {
      setLiking((prev) => ({
        ...prev,
        [postId]: false,
      }));
    }
  };

  const handleShare = async (postId: string) => {
    if (!token || sharing[postId] || sharedPosts[postId]) {
      return;
    }

    setSharing((prev) => ({
      ...prev,
      [postId]: true,
    }));

    try {
      await axios.post(
        `${API}/posts/${postId}/share`,
        {},
        { headers: { token } }
      );

      setSharedPosts((prev) => {
        const updated = { ...prev, [postId]: true };

        localStorage.setItem("sharedPosts", JSON.stringify(updated));

        return updated;
      });

      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          getPostId(post) === postId
            ? {
                ...post,
                sharesCount: (post.sharesCount ?? 0) + 1,
              }
            : post
        )
      );
    } catch (error: unknown) {
      console.error("Share failed:", getErrorMessage(error));
    } finally {
      setSharing((prev) => ({
        ...prev,
        [postId]: false,
      }));
    }
  };

  const getComments = async (postId: string) => {
    if (!token) {
      return;
    }

    try {
      setCommentsLoading((prev) => ({
        ...prev,
        [postId]: true,
      }));

      const response = await axios.get<CommentResponse | CommentItem[]>(
        `${API}/posts/${postId}/comments?page=1&limit=10`,
        { headers: { token } }
      );

      const responseData = response.data;

      let comments: CommentItem[] = [];

      if (Array.isArray(responseData)) {
        comments = responseData;
      } else {
        const data = responseData as CommentResponse;

        comments =
          data?.comments ??
          data?.data?.comments ??
          [];
      }

      setCommentsByPost((prev) => ({
        ...prev,
        [postId]: comments,
      }));
    } catch (error: unknown) {
      console.error("Error fetching comments:", getErrorMessage(error));
    } finally {
      setCommentsLoading((prev) => ({
        ...prev,
        [postId]: false,
      }));
    }
  };

  const toggleComments = async (postId: string) => {
    const isOpen = Boolean(commentsOpen[postId]);

    setCommentsOpen((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));

    if (!isOpen && commentsByPost[postId] === undefined) {
      await getComments(postId);
    }
  };

  const createComment = async (postId: string) => {
    const content = commentInputs[postId]?.trim();

    if (!content || sendingComment[postId] || !token) {
      return;
    }

    setSendingComment((prev) => ({
      ...prev,
      [postId]: true,
    }));

    try {
      await axios.post(
        `${API}/posts/${postId}/comments`,
        { content },
        { headers: { token } }
      );

      setCommentInputs((prev) => ({
        ...prev,
        [postId]: "",
      }));

      await getComments(postId);
      await getPosts();
    } catch (error: unknown) {
      console.error("Error creating comment:", getErrorMessage(error));
    } finally {
      setSendingComment((prev) => ({
        ...prev,
        [postId]: false,
      }));
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <TailSpin
          visible
          height="80"
          width="80"
          color="#2ccce4"
          ariaLabel="tail-spin-loading"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="mx-auto mb-6 mt-6 max-w-2xl rounded-2xl border border-gray-200 bg-cyan-600 p-6 shadow-lg">
          <h3 className="mb-5 text-center text-xl font-bold text-black">
            Create Post
          </h3>

          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="What's on your mind?..."
            className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 p-4 text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
            rows={3}
          />

          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-200 bg-cyan-800 px-4 py-3 text-sm font-medium text-white transition hover:bg-cyan-700">
              <Add size="32" color="#2ccce4" />

              <span>{media ? media.name : "Add Files"}</span>

              <input
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setMedia(event.target.files?.[0] || null)
                }
              />
            </label>

            <button
              type="button"
              disabled={creating || (!body.trim() && !media)}
              onClick={() => void createPost()}
              className="flex cursor-pointer items-center gap-2 rounded-xl bg-cyan-800 px-8 py-3 font-semibold text-white shadow-sm transition hover:bg-cyan-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send size="28" color="#2ccce4" />
              {creating ? "Posting..." : "Post"}
            </button>
          </div>

          {errorMessage && (
            <div className="mt-5 rounded-lg bg-red-100 p-3 text-center text-red-700">
              {errorMessage}
            </div>
          )}
        </div>

        {posts.length === 0 ? (
          <h1 className="text-center text-2xl font-bold text-white">
            No Posts
          </h1>
        ) : (
          posts.map((post) => {
            const postId = getPostId(post);

            if (!postId) {
              return null;
            }

            const postUser =
              typeof post.user === "object" && post.user
                ? post.user
                : null;

            return (
              <div
                key={postId}
                className="rounded-xl bg-white p-5 shadow-md transition hover:shadow-lg"
              >
                <button
                  type="button"
                  onClick={() => void getUserProfile(post)}
                  className="mb-4 flex w-full cursor-pointer items-center gap-3 text-left"
                >
                  <img
                    src={postUser?.photo || "/default-avatar.png"}
                    alt={postUser?.name || "User"}
                    className="h-12 w-12 rounded-full object-cover"
                  />

                  <div>
                    <h2 className="font-bold text-gray-900">
                      {postUser?.name || "Unknown User"}
                    </h2>

                    <p className="text-sm text-gray-500">
                      @{postUser?.username || "user"}
                    </p>
                  </div>
                </button>

                <p className="whitespace-pre-wrap break-words text-gray-700">
                  {post.body}
                </p>

                {post.image && (
                  <div className="mt-3">
                    <img
                      src={post.image}
                      alt="Post"
                      className="max-h-[500px] w-full rounded-lg object-contain"
                    />
                  </div>
                )}

                {post.video && (
                  <div className="mt-3">
                    <video
                      src={post.video}
                      controls
                      className="max-h-[500px] w-full rounded-lg"
                    />
                  </div>
                )}

                <div className="mt-4 flex flex-wrap justify-center gap-5 border-t pt-3 text-sm text-gray-500">
                  <button
                    type="button"
                    disabled={Boolean(liking[postId])}
                    onClick={() => void handleLike(postId)}
                    className="flex cursor-pointer items-center gap-1 transition hover:text-cyan-600 disabled:opacity-50"
                  >
                    <Like1
                      size="24"
                      color={likedPosts[postId] ? "#0891b2" : "#2ccce4"}
                      variant={likedPosts[postId] ? "Bold" : "Outline"}
                    />
                    {post.likesCount ?? 0} Likes
                  </button>

                  <button
                    type="button"
                    onClick={() => void toggleComments(postId)}
                    className="flex cursor-pointer items-center gap-1 transition hover:text-cyan-600"
                  >
                    <MessageText1 size="24" color="#2ccce4" />
                    {post.commentsCount ?? 0} Comments
                  </button>

                  <button
                    type="button"
                    disabled={
                      Boolean(sharing[postId]) ||
                      Boolean(sharedPosts[postId])
                    }
                    onClick={() => void handleShare(postId)}
                    className="flex cursor-pointer items-center gap-1 transition hover:text-cyan-600 disabled:opacity-70"
                  >
                    <Share
                      size="24"
                      color={sharedPosts[postId] ? "#f47373" : "#2ccce4"}
                      variant={sharedPosts[postId] ? "Bold" : "Outline"}
                    />

                    {sharing[postId]
                      ? "Sharing..."
                      : `${post.sharesCount ?? 0} Shares`}
                  </button>

                  <PostBookmark
                    key={postId}
                    postId={postId}
                    token={token}
                    initialBookmarked={Boolean(
                      post.isBookmarked ?? post.bookmarked
                    )}
                  />
                </div>

                <p className="mt-3 text-xs text-gray-400">
                  {post.createdAt
                    ? new Date(post.createdAt).toLocaleString()
                    : ""}
                </p>

                {commentsOpen[postId] && (
                  <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <h3 className="mb-4 font-bold text-gray-800">
                      Comments
                    </h3>

                    <form
                      onSubmit={(event: FormEvent<HTMLFormElement>) => {
                        event.preventDefault();
                        void createComment(postId);
                      }}
                      className="mb-5 flex items-center gap-2"
                    >
                      <input
                        type="text"
                        value={commentInputs[postId] || ""}
                        onChange={(event) =>
                          setCommentInputs((prev) => ({
                            ...prev,
                            [postId]: event.target.value,
                          }))
                        }
                        placeholder="Write a comment..."
                        className="min-w-0 flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                      />

                      <button
                        type="submit"
                        disabled={
                          Boolean(sendingComment[postId]) ||
                          !(commentInputs[postId] || "").trim()
                        }
                        className="flex items-center gap-2 rounded-xl bg-cyan-700 px-4 py-3 text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Send size="20" color="#ffffff" />
                        {sendingComment[postId] ? "Sending..." : "Send"}
                      </button>
                    </form>

                    {commentsLoading[postId] ? (
                      <div className="flex justify-center py-5">
                        <TailSpin
                          visible
                          height="35"
                          width="35"
                          color="#2ccce4"
                          ariaLabel="loading-comments"
                        />
                      </div>
                    ) : (commentsByPost[postId] || []).length === 0 ? (
                      <p className="py-4 text-center text-sm text-gray-500">
                        No comments yet. Be the first to comment!
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {(commentsByPost[postId] || []).map((comment, index) => (
                          <div
                            key={comment._id || comment.id || `${postId}-${index}`}
                            className="flex items-start gap-3 rounded-lg bg-white p-3"
                          >
                            <img
                              src={
                                comment.commentCreator?.photo ||
                                comment.user?.photo ||
                                "/default-avatar.png"
                              }
                              alt={
                                comment.commentCreator?.name ||
                                comment.user?.name ||
                                "User"
                              }
                              className="h-10 w-10 rounded-full object-cover"
                            />

                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-gray-900">
                                {comment.commentCreator?.name ||
                                  comment.user?.name ||
                                  "Unknown User"}
                              </p>

                              <p className="mt-1 whitespace-pre-wrap break-words text-sm text-gray-700">
                                {comment.content || comment.body}
                              </p>

                              <p className="mt-2 text-xs text-gray-400">
                                {comment.createdAt
                                  ? new Date(comment.createdAt).toLocaleString()
                                  : ""}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <TopCommentCard topComment={post.topComment} />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function PostBookmark({
  postId,
  token,
  initialBookmarked = false,
}: {
  postId: string;
  token: string | null;
  initialBookmarked?: boolean;
}) {
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  useEffect(() => {
    setIsBookmarked(initialBookmarked);
  }, [initialBookmarked]);

  const handleBookmark = async () => {
    if (bookmarkLoading || !token) {
      return;
    }

    setBookmarkLoading(true);

    try {
      const response = await axios.put(
        `${API}/posts/${postId}/bookmark`,
        {},
        {
          headers: {
            token,
            "Content-Type": "application/json",
          },
        }
      );

      const responseData = response.data;
      const updatedStatus =
        responseData?.isBookmarked ??
        responseData?.data?.isBookmarked;

      setIsBookmarked(
        typeof updatedStatus === "boolean"
          ? updatedStatus
          : (prev) => !prev
      );
    } catch (error: unknown) {
      console.error("Bookmark error:", getErrorMessage(error));
    } finally {
      setBookmarkLoading(false);
    }
  };

  return (
    <button
      type="button"
      className="flex cursor-pointer items-center gap-1 text-cyan-400 hover:text-cyan-600 disabled:opacity-50"
      onClick={() => void handleBookmark()}
      disabled={bookmarkLoading || !token}
      aria-label={isBookmarked ? "Remove bookmark" : "Bookmark post"}
    >
      <Bookmark
        size="24"
        color="#2ccce4"
        variant={isBookmarked ? "Bold" : "Outline"}
      />
      {bookmarkLoading
        ? "Saving..."
        : isBookmarked
          ? "Remove Bookmark"
          : "Bookmark"}
    </button>
  );
}

function TopCommentCard({
  topComment,
}: {
  topComment: TopComment | null | undefined;
}) {
  if (!topComment) {
    return null;
  }

  const { commentCreator, content, createdAt, likes = [] } = topComment;

  return (
    <div className="mt-3 rounded-xl border border-gray-200 bg-gray-100 p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Cup size="28" color="#2ccce4" variant="Outline" />
        <span className="text-sm font-semibold text-gray-700">
          Top Comment
        </span>
      </div>

      <div className="flex items-start gap-3">
        <img
          src={commentCreator?.photo || "/default-avatar.png"}
          alt={commentCreator?.name || "User"}
          className="h-10 w-10 rounded-full object-cover"
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-gray-900">
              {commentCreator?.name || "Unknown User"}
            </span>

            <span className="text-sm text-gray-500">
              @{commentCreator?.username || "user"}
            </span>
          </div>

          <p className="mt-1 whitespace-pre-wrap break-words text-sm text-gray-700">
            {content}
          </p>

          <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
            <span>
              {createdAt ? new Date(createdAt).toLocaleDateString() : ""}
            </span>

            <span className="flex items-center gap-1">
              <Like1 size="20" color="#2ccce4" variant="Outline" />
              {Array.isArray(likes) ? likes.length : 0}
            </span>

            <span className="flex items-center gap-1">
              <Message size="20" color="#2ccce4" variant="Bold" />
              Comment
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}


export function ProfilePage() {
  const location = useLocation();
  const { _id } = useParams<{ _id: string }>();
  const token = localStorage.getItem("token");

  const [profileData, setProfileData] = useState<ProfileResponse | null>(
    () => location.state?.profileData ?? null
  );

  const [profileLoading, setProfileLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [followLoading, setFollowLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(
    Boolean(location.state?.profileData?.isFollowing)
  );
  const [userPosts, setUserPosts] = useState<PostItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      if (!_id || !token) {
        
        setProfileLoading(false);
        setPostsLoading(false);
        return;
      }

      setProfileLoading(true);
      setProfileError("");

      try {
        const response = await axios.get(
          `${API}/users/${_id}/profile`,
          {
            headers: { token },
          }
        );

        const data: ProfileResponse =
          response.data?.data ?? response.data;

        if (!data?.user) {
          throw new Error("Profile data was not returned by the server.");
        }

        if (cancelled) return;

        setProfileData(data);

        const followingStatus =
          data.isFollowing ?? data.user.isFollowing;

        if (typeof followingStatus === "boolean") {
          setIsFollowing(followingStatus);
        }
      } catch (error: unknown) {
        if (!cancelled) {
          setProfileError(getErrorMessage(error));
        }
      } finally {
        if (!cancelled) {
          setProfileLoading(false);
        }
      }
    };

    
     
    

const loadUserPosts = async () => {
  if (!token || !user?._id) {
    setUserPosts([]);
    setPostsLoading(false);
    return;
  }

  setPostsLoading(true);

  try {
    const response = await axios.get(
      `https://route-posts.routemisr.com/users/${user._id}/posts`,
      {
        headers: { token },
      }
    );

    const responseData = response.data?.data ?? response.data;

    const fetchedPosts: PostItem[] = Array.isArray(responseData)
      ? responseData
      : responseData?.posts ??
        responseData?.data?.posts ??
        [];
   

    if (cancelled) return;

const profileUserId = String(user._id);

console.log("Profile ID:", profileUserId);
       const filteredPosts = fetchedPosts.filter((post) => {
  const authorId =
    typeof post.user === "string"
      ? post.user
      : post.user?._id ?? post.user?.id;

  return String(authorId ?? "") === profileUserId;
});

console.log("Filtered posts:", filteredPosts);

setUserPosts(filteredPosts);
    
  } catch (error: unknown) {
    if (!cancelled) {
      console.error(
        "Failed to load posts:",
        axios.isAxiosError(error)
          ? error.response?.data ?? error.message
          : error
      );

      setUserPosts([]);
    }
  } finally {
    if (!cancelled) {
      setPostsLoading(false);
    }
  }
};

    void loadProfile();
    void loadUserPosts();

    return () => {
      cancelled = true;
    };
  }, [_id, token]);

  const toggleFollowUser = async () => {
    const userId = profileData?.user?._id || profileData?.user?.id;

    if (!userId || !token || followLoading) return;

    const previousStatus = isFollowing;

    setIsFollowing(!previousStatus);
    setFollowLoading(true);
    setProfileError("");

    try {
      const response = await axios.put(
        `${API}/users/${userId}/follow`,
        {},
        {
          headers: {
            token,
            "Content-Type": "application/json",
          },
        }
      );

      const responseData = response.data?.data ?? response.data;

      const updatedStatus =
        responseData?.isFollowing ??
        responseData?.user?.isFollowing;

      if (typeof updatedStatus === "boolean") {
        setIsFollowing(updatedStatus);
      }
    } catch (error: unknown) {
      setIsFollowing(previousStatus);
      setProfileError(getErrorMessage(error));
    } finally {
      setFollowLoading(false);
    }
  };

  if (profileLoading && !profileData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <TailSpin
          visible
          height="60"
          width="60"
          color="#2ccce4"
          ariaLabel="loading-profile"
        />
      </div>
    );
  }

  if (!profileData?.user) {
    return (
      <div className="min-h-screen bg-black p-6 text-center text-white">
        {profileError || "No profile data available."}
      </div>
    );
  }

  const { user } = profileData;

  return (
    <div className="min-h-screen bg-black px-4 py-8 pt-5">
      <div className="mx-auto mt-6 max-w-3xl space-y-6">
        <Link to="/home/posts" className="flex items-center text-cyan-500 gap-1"><ArrowLeft size="32" color="#2ccce4" variant="Outline"/> Back</Link>
        <div className="overflow-hidden rounded-lg bg-white shadow-md">
          <div className="relative h-40 overflow-hidden bg-gray-200">
            {user.cover ? (
              <img
                src={user.cover}
                alt="Cover"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-r from-blue-400 to-indigo-500" />
            )}
          </div>

          <div className="relative px-6 pb-6">
            <div className="-mt-16 mb-4 flex items-end justify-between gap-4">
              <img
                src={user.photo || "/default-avatar.png"}
                alt={user.name || "User"}
                className="h-28 w-28 rounded-full border-4 border-white bg-white object-cover shadow-md"
              />

              <button
                type="button"
                onClick={() => void toggleFollowUser()}
                disabled={followLoading || !token}
                className="rounded-full bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {followLoading
                  ? "Please wait..."
                  : isFollowing
                    ? "Unfollow"
                    : "Follow"}
              </button>
            </div>

            {profileError && (
              <p className="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-700">
                {profileError}
              </p>
            )}

            <h1 className="text-2xl font-bold text-gray-800">
              {user.name || "Unknown User"}
            </h1>

            <p className="text-gray-500">@{user.username || "user"}</p>

            <div className="mt-4 flex flex-wrap gap-6 text-sm text-gray-600">
              <div>
                <strong className="text-gray-900">
                  {user.followersCount ?? 0}
                </strong>{" "}
                Followers
              </div>

              <div>
                <strong className="text-gray-900">
                  {user.followingCount ?? 0}
                </strong>{" "}
                Following
              </div>

              <div>
                <strong className="text-gray-900">
                  {user.bookmarksCount ?? 0}
                </strong>{" "}
                Bookmarks
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 border-t pt-4 text-sm text-gray-700 sm:grid-cols-2">
              <div>
                <span className="font-semibold">Email:</span>{" "}
                {user.email || "Not provided"}
              </div>

              <div>
                <span className="font-semibold">Gender:</span>{" "}
                {user.gender || "Not provided"}
              </div>

              <div>
                <span className="font-semibold">Joined:</span>{" "}
                {user.createdAt
                  ? new Date(user.createdAt).toLocaleDateString()
                  : "Unknown"}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white">
            Posts by {user.name || "this user"}
          </h2>

          
{postsLoading ? (
  <div className="flex justify-center py-8">
    <TailSpin
      visible
      height="40"
      width="40"
      color="#2ccce4"
      ariaLabel="loading-user-posts"
    />
  </div>
) : userPosts.length === 0 ? (
  <div className="rounded-xl bg-white p-6 text-center text-gray-500">
    This user has no posts to display.
  </div>
) : (
  userPosts.map((post) => (
    <article
      key={post._id || post.id}
      className="rounded-xl bg-white p-5 shadow-md"
    >
      <div className="mb-3 flex items-center gap-3">
        <img
          src={user.photo || "/default-avatar.png"}
          alt={user.name || "User"}
          className="h-10 w-10 rounded-full object-cover"
        />

        <div>
          <h3 className="font-bold text-gray-900">
            {user.name || "Unknown User"}
          </h3>
          <p className="text-sm text-gray-500">
            @{user.username || "user"}
          </p>
        </div>
      </div>

      {post.body && (
        <p className="whitespace-pre-wrap break-words text-gray-700">
          {post.body}
        </p>
      )}

      {post.image && (
        <img
          src={post.image}
          alt="Post"
          className="mt-3 max-h-[500px] w-full rounded-lg object-contain"
        />
      )}

      {post.video && (
        <video
          src={post.video}
          controls
          className="mt-3 max-h-[500px] w-full rounded-lg"
        />
      )}

      {!post.body && !post.image && !post.video && (
        <p className="text-sm text-gray-500">No content available.</p>
      )}

      <div className="mt-4 flex flex-wrap gap-5 border-t pt-3 text-sm text-gray-500">
        <span className="flex items-center gap-1">
          <Like1 size="20" color="#0891b2" />
          {post.likesCount ?? 0} Likes
        </span>

        <span className="flex items-center gap-1">
          <MessageText1 size="20" color="#0891b2" />
          {post.commentsCount ?? 0} Comments
        </span>

        <span className="flex items-center gap-1">
          <Share size="20" color="#0891b2" />
          {post.sharesCount ?? 0} Shares
        </span>
      </div>

      {post.createdAt && (
        <p className="mt-3 text-xs text-gray-400">
          {new Date(post.createdAt).toLocaleString()}
        </p>
      )}

      <TopCommentCard topComment={post.topComment} />
    </article>
  ))
)}
        </div>
      </div>
    </div>
  );
}