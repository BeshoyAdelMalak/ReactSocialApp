
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

interface Post {
  _id: string;
  body?: string;
  image?: string;
  user?: {
    name?: string;
    photo?: string;
  };
  createdAt?: string;
}

export default function PostDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      setError("Post ID is missing.");
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    async function fetchPost() {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");

        const response = await fetch(
          `https://route-posts.routemisr.com/posts/${id}`,
          {
            headers: {
              ...(token
                ? { Authorization: `Bearer ${token}` }
                : {}),
            },
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to load post (${response.status})`);
        }

        const result = await response.json();

        // Adjust this if your API returns a different response structure.
        setPost(result.data?.post ?? result.data ?? result.post ?? result);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;

        setError(
          err instanceof Error ? err.message : "Something went wrong."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchPost();

    return () => controller.abort();
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-black p-8 text-center text-gray-400">
        Loading post...
      </main>
    );
  }

  if (error || !post) {
    return (
      <main className="min-h-screen bg-black p-8 text-center text-gray-400">
        <p>{error || "Post not found."}</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 rounded-lg bg-gray-800 px-4 py-2 hover:bg-gray-700"
        >
          Go back
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-gray-300">
      <div className="mx-auto max-w-2xl">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 text-sm text-gray-400 hover:text-white"
        >
          ← Back
        </button>

        <article className="rounded-2xl border border-gray-800 bg-gray-950 p-5">
          {post.user?.name && (
            <h2 className="mb-4 font-semibold text-gray-100">
              {post.user.name}
            </h2>
          )}

          {post.body && (
            <p className="whitespace-pre-wrap leading-7 text-gray-300">
              {post.body}
            </p>
          )}

          {post.image && (
            <img
              src={post.image}
              alt="Post"
              className="mt-4 max-h-[600px] w-full rounded-xl object-contain"
            />
          )}

          {post.createdAt && (
            <p className="mt-4 text-sm text-gray-500">
              {new Date(post.createdAt).toLocaleString()}
            </p>
          )}
        </article>
      </div>
    </main>
  );
}