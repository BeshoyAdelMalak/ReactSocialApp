
import { useEffect, useState } from "react";
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
} from "iconsax-reactjs";

const API = "https://route-posts.routemisr.com";

export default function Posts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create post states
  const [body, setBody] = useState("");
  const [media, setMedia] = useState(null);
  const [creating, setCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Like states
  const [likedPosts, setLikedPosts] = useState({});
const [liking, setLiking] = useState({});

  // Share states
  const [sharing, setSharing] = useState({});
  
  const [sharedPosts, setSharedPosts] = useState(() => {
  try {
    return JSON.parse(localStorage.getItem("sharedPosts") || "{}");
  } catch {
    return {};
  }
});

  // Comments states
  const [commentsByPost, setCommentsByPost] = useState({});
  const [commentsOpen, setCommentsOpen] = useState({});
  const [commentsLoading, setCommentsLoading] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [sendingComment, setSendingComment] = useState({});

  const token = localStorage.getItem("token");

  // =========================
  // GET POSTS
  // =========================
  const getPosts = async () => {
  try {
    setLoading(true);

    const response = await axios.get(`${API}/posts`, {
      headers: { token },
    });

    const fetchedPosts = response.data.data.posts || [];
    setPosts(fetchedPosts);

    // Get the current user ID from your saved user data
    const userId = JSON.parse(
      localStorage.getItem("user") || "null"
    )?._id;

    const initialLikedPosts = {};

    fetchedPosts.forEach((post) => {
      const postId = post._id || post.id;

      initialLikedPosts[postId] = Array.isArray(post.likes)
        ? post.likes.some((like) => {
            const likedUserId =
              typeof like === "string" ? like : like?._id;

            return likedUserId === userId;
          })
        : false;
    });

    setLikedPosts(initialLikedPosts);
  } catch (error) {
    console.error(
      "Error fetching posts:",
      error.response?.data || error.message
    );
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    getPosts();
  }, []);

  // =========================
  // CREATE POST
  // =========================
  const createPost = async () => {
    setErrorMessage("");
    if (!body.trim() && !media) return;

    const formData = new FormData();

    if (body.trim()) {
      formData.append("body", body);
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
    } catch (error) {
  console.error(
    "Error creating post:",
    error.response?.data || error.message
  );

  setErrorMessage(
    error.response?.data?.message ||
    error.message ||
    "Failed to create post. Please try again."
  );
} finally {
      setCreating(false);
    }
  };

  // =========================
  // LIKE POST
  // =========================
  const handleLike = async (postId) => {
  if (liking[postId]) return;

  const wasLiked = !!likedPosts[postId];

  // Update the UI immediately
  setLikedPosts((prev) => ({
    ...prev,
    [postId]: !wasLiked,
  }));

  setPosts((prevPosts) =>
    prevPosts.map((post) =>
      (post._id || post.id) === postId
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

  try {
    setLiking((prev) => ({
      ...prev,
      [postId]: true,
    }));

    await axios.put(
      `${API}/posts/${postId}/like`,
      {},
      {
        headers: { token },
      }
    );
  } catch (error) {
    // Roll back if the API request fails
    setLikedPosts((prev) => ({
      ...prev,
      [postId]: wasLiked,
    }));

    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        (post._id || post.id) === postId
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

    console.error(
      "Error toggling like:",
      error.response?.data || error.message
    );
  } finally {
    setLiking((prev) => ({
      ...prev,
      [postId]: false,
    }));
  }
};

  // =========================
  // SHARE POST
  // =========================
  const handleShare = async (postId) => {
  if (sharing[postId] || sharedPosts[postId]) return;

  setSharing((prev) => ({
    ...prev,
    [postId]: true,
  }));

  try {
    await axios.post(
      `${API}/posts/${postId}/share`,
      {},
      {
        headers: {
          token: localStorage.getItem("token"),
        },
      }
    );

    const updatedSharedPosts = {
      ...sharedPosts,
      [postId]: true,
    };

    setSharedPosts(updatedSharedPosts);

    localStorage.setItem(
      "sharedPosts",
      JSON.stringify(updatedSharedPosts)
    );

    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        (post._id || post.id) === postId
          ? {
              ...post,
              sharesCount: (post.sharesCount ?? 0) + 1,
            }
          : post
      )
    );
  } catch (error) {
    console.error(
      "Share failed:",
      error.response?.data || error.message
    );
  } finally {
    setSharing((prev) => ({
      ...prev,
      [postId]: false,
    }));
  }
};

  // =========================
  // GET COMMENTS
  // =========================
  const getComments = async (postId) => {
    try {
      setCommentsLoading((prev) => ({
        ...prev,
        [postId]: true,
      }));

      const response = await axios.get(
        `${API}/posts/${postId}/comments?page=1&limit=10`,
        {
          headers: { token },
        }
      );

      console.log("Comments response:", response.data);

      const data = response.data.data;

      const comments = Array.isArray(data)
        ? data
        : data?.comments || data?.data?.comments || [];

      setCommentsByPost((prev) => ({
        ...prev,
        [postId]: comments,
      }));
    } catch (error) {
      console.error(
        "Error fetching comments:",
        error.response?.data || error.message
      );
    } finally {
      setCommentsLoading((prev) => ({
        ...prev,
        [postId]: false,
      }));
    }
  };

  // =========================
  // OPEN / CLOSE COMMENTS
  // =========================
  const toggleComments = async (postId) => {
    const isOpen = commentsOpen[postId];

    setCommentsOpen((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));

    if (!isOpen && commentsByPost[postId] === undefined) {
      await getComments(postId);
    }
  };

  // =========================
  // CREATE COMMENT
  // =========================
  const createComment = async (postId) => {
    const content = commentInputs[postId]?.trim();

    if (!content || sendingComment[postId]) return;

    try {
      setSendingComment((prev) => ({
        ...prev,
        [postId]: true,
      }));

      await axios.post(
        `${API}/posts/${postId}/comments`,
        { content },
        {
          headers: { token },
        }
      );

      setCommentInputs((prev) => ({
        ...prev,
        [postId]: "",
      }));

      await getComments(postId);
      await getPosts();
    } catch (error) {
      console.error(
        "Error creating comment:",
        error.response?.data || error.message
      );
    } finally {
      setSendingComment((prev) => ({
        ...prev,
        [postId]: false,
      }));
    }
  };

  // =========================
  // LOADING SCREEN
  // =========================
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <TailSpin
          visible={true}
          height="80"
          width="80"
          color="#2ccce4"
          ariaLabel="tail-spin-loading"
        />
      </div>
    );
  }

  // =========================
  // MAIN UI
  // =========================
  return (
    <div className="min-h-screen bg-black p-6">
      <div className="mx-auto max-w-4xl space-y-4">

        {/* CREATE POST */}
        <div className="mx-auto mb-6 mt-6 max-w-2xl rounded-2xl border border-gray-200 bg-cyan-600 p-6 shadow-lg">
          <h3 className="mb-5 text-center text-xl font-bold text-black">
            Create Post
          </h3>

          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
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
                onChange={(e) =>
                  setMedia(e.target.files?.[0] || null)
                }
              />
            </label>

            <button
              type="button"
              disabled={creating || (!body.trim() && !media)}
              onClick={createPost}
              className="flex cursor-pointer items-center gap-2 rounded-xl bg-cyan-800 px-8 py-3 font-semibold text-white shadow-sm transition hover:bg-cyan-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send size="28" color="#2ccce4" />
              {creating ? "Posting..." : "Post"}
            </button>
          </div>
          <div className="text-center mt-5"><h3>{errorMessage && (
  <div className="mb-4 rounded-lg bg-red-100 p-3 text-center text-red-700">
    {errorMessage}
  </div>
)}</h3></div>

        </div>

        {/* POSTS LIST */}
        {posts.length === 0 ? (
          <h1 className="text-center text-2xl font-bold text-white">
            No Posts
          </h1>
        ) : (
          posts.map((post) => {
            const postId = post._id || post.id;

            return (
              <div
                key={postId}
                className="rounded-xl bg-white p-5 shadow-md transition hover:shadow-lg"
              >
                {/* USER INFO */}
                <div className="mb-4 flex items-center gap-3">
                  <img
                    src={post.user?.photo || "/default-avatar.png"}
                    alt={post.user?.name || "User"}
                    className="h-12 w-12 rounded-full object-cover"
                  />

                  <div>
                    <h2 className="font-bold text-gray-900">
                      {post.user?.name || "Unknown User"}
                    </h2>

                    <p className="text-sm text-gray-500">
                      @{post.user?.username || "user"}
                    </p>
                  </div>
                </div>

                {/* POST BODY */}
                <p className="whitespace-pre-wrap break-words text-gray-700">
                  {post.body}
                </p>

                {/* POST IMAGE */}
                {post.image && (
                  <div className="mt-3">
                    <img
                      src={post.image}
                      alt="Post"
                      className="max-h-[500px] w-full rounded-lg object-contain"
                    />
                  </div>
                )}

                {/* POST ACTIONS */}
                <div className="mt-4 flex flex-wrap justify-center gap-5 border-t pt-3 text-sm text-gray-500">

                  {/* LIKE */}
                 <button
  type="button"
  disabled={!!liking[postId]}
  onClick={() => handleLike(postId)}
  className="flex cursor-pointer items-center gap-1 transition hover:text-cyan-600 disabled:opacity-50"
>
  <Like1
    size="24"
    color={likedPosts[postId] ? "#0891b2" : "#2ccce4"}
    variant={likedPosts[postId] ? "Bold" : "Outline"}
  />

  {post.likesCount ?? 0} Likes
</button>

                  {/* COMMENTS */}
                  <button
                    type="button"
                    onClick={() => toggleComments(postId)}
                    className="flex cursor-pointer items-center gap-1 transition hover:text-cyan-600"
                  >
                    <MessageText1 size="24" color="#2ccce4" />
                    {post.commentsCount ?? 0} Comments
                  </button>

                  {/* SHARE */}
                  <button
  type="button"
  disabled={!!sharing[postId] || !!sharedPosts[postId]}
  onClick={() => handleShare(postId)}
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

                </div>

                {/* POST DATE */}
                <p className="mt-3 text-xs text-gray-400">
                  {post.createdAt
                    ? new Date(post.createdAt).toLocaleString()
                    : ""}
                </p>

                {/* COMMENTS SECTION */}
                {commentsOpen[postId] && (
                  <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <h3 className="mb-4 font-bold text-gray-800">
                      Comments
                    </h3>

                    {/* COMMENT INPUT */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        createComment(postId);
                      }}
                      className="mb-5 flex items-center gap-2"
                    >
                      <input
                        type="text"
                        value={commentInputs[postId] || ""}
                        onChange={(e) =>
                          setCommentInputs((prev) => ({
                            ...prev,
                            [postId]: e.target.value,
                          }))
                        }
                        placeholder="Write a comment..."
                        className="min-w-0 flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                      />

                      <button
                        type="submit"
                        disabled={
                          !!sendingComment[postId] ||
                          !(commentInputs[postId] || "").trim()
                        }
                        className="flex items-center gap-2 rounded-xl bg-cyan-700 px-4 py-3 text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Send size="20" color="#ffffff" />
                        {sendingComment[postId]
                          ? "Sending..."
                          : "Send"}
                      </button>
                    </form>

                    {/* COMMENTS LOADING */}
                    {commentsLoading[postId] ? (
                      <div className="flex justify-center py-5">
                        <TailSpin
                          visible={true}
                          height="35"
                          width="35"
                          color="#2ccce4"
                          ariaLabel="loading-comments"
                        />
                      </div>
                    ) : (
                      <>
                        {/* COMMENTS LIST */}
                        {(commentsByPost[postId] || []).length === 0 ? (
                          <p className="py-4 text-center text-sm text-gray-500">
                            No comments yet. Be the first to comment!
                          </p>
                        ) : (
                          <div className="space-y-4">
                            {(commentsByPost[postId] || []).map(
                              (comment) => (
                                <div
                                  key={comment._id || comment.id}
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
                                        ? new Date(
                                            comment.createdAt
                                          ).toLocaleString()
                                        : ""}
                                    </p>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* TOP COMMENT */}
                <TopCommentCard topComment={post.topComment} />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// =========================
// TOP COMMENT CARD
// =========================
function TopCommentCard({ topComment }) {
  if (!topComment) return null;

  const {
    commentCreator,
    content,
    createdAt,
    likes = [],
  } = topComment;

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
              {createdAt
                ? new Date(createdAt).toLocaleDateString()
                : ""}
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