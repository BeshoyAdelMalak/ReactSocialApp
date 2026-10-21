import axios from "axios";
import { useEffect, useState } from "react";
import { TailSpin } from "react-loader-spinner";
import { Like1, MessageText1, Share, Trash} from "iconsax-reactjs"

export default function UserProfile() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchProfile = async () => {
            const token = localStorage.getItem("token");

            if (!token) {
                setError("You are not logged in.");
                setLoading(false);
                return;
            }

            try {
                const response = await axios.get(
                    "https://route-posts.routemisr.com/users/profile-data",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                console.log("Profile data: ", response.data);
                setUser(response.data.data?.user ?? response.data.data ?? response.data);
            } catch (err: any) {
                setError(
                    err.response?.data?.message || "Failed to fetch profile."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    if (loading) return <div className="flex min-h-screen items-center justify-center">
        <TailSpin
            visible={true}
            height="80"
            width="80"
            color="#4fa94d"
            ariaLabel="tail-spin-loading"
            radius="1"
            wrapperStyle={{}}
            wrapperClass=""
        />
    </div>


    if (error) return <p className="text-red-500">{error}</p>;

    
    const uploadCoverPhoto = async (
  event: React.ChangeEvent<HTMLInputElement>
) => {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("You must be logged in.");
    }

    const formData = new FormData();
    formData.append("cover", file);

    const response = await fetch(
      "https://route-posts.routemisr.com/users/upload-cover",
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error("Failed to upload cover photo.");
    }

    const result = await response.json();
    console.log("Cover uploaded successfully:", result);

    
    setUser((prev: String | null) =>
      prev ? { ...prev, cover: result.data?.cover || result.data?.user?.cover } : prev
    );
  } catch (error) {
    console.error("Cover upload error:", error);
  } finally {
    event.target.value = "";
  }
};
    return (
    <div className="flex flex-col items-center gap-2 rounded-2xl bg-black px-4 py-8 text-center shadow-xl mx-auto min-h-16 max-w-7xl justify-between sm:px-6 lg:px-8">
            <div className="relative mb-16 w-full">

 
  <div className="relative h-48 w-full overflow-hidden rounded-2xl sm:h-64">
    <div>
    <img
      src={
        user?.cover ||
        "https://upload.wikimedia.org/wikipedia/commons/b/b9/No_Cover.jpg"
      }
      alt="Cover Photo"
      className="absolute inset-0 h-full w-full object-cover"
    />
     {/* Dark overlay */}
  <div className="absolute inset-0 bg-black/20 transition group-hover:bg-black/40" />

  {/* Upload button */}
  <label className="absolute bottom-4 right-4 z-10 cursor-pointer rounded-lg bg-black/70 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-600">
    Change Cover
    <input
      type="file"
      accept="image/*"
      className="hidden"
      onChange={uploadCoverPhoto}
    />
  </label>
    </div>
    
    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

    <div className="absolute bottom-4 right-40 z-10 flex gap-4 text-white sm:gap-6">
      <div className="text-center">
        <p className="text-lg font-bold">{user?.bookmarksCount ?? 0}</p>
        <p className="text-xs text-gray-200">Bookmarked Posts</p>
      </div>
      
      <div className="text-center">
        <p className="text-lg font-bold">{user?.followersCount ?? 0}</p>
        <p className="text-xs text-gray-200">Followers</p>
      </div>

      <div className="text-center">
        <p className="text-lg font-bold">{user?.followingCount ?? 0}</p>
        <p className="text-xs text-gray-200">Following</p>
      </div>
    </div>
  </div>

  <div className="absolute -bottom-12 left-5 z-20 h-28 w-28 rounded-full border-4 border-black bg-gray-900 p-1 shadow-lg shadow-cyan-500/20 sm:left-8 sm:h-32 sm:w-32">
    <img
      src={user?.photo || ""}
      alt="Profile Photo"
      className="h-full w-full rounded-full object-cover"
    />
  </div>

  <div className="ml-36 mt-4 sm:ml-44 text-center justify-center items-center">
    <h3 className="text-xl font-bold text-white">{user?.name}<span> </span>
       @{user?.username}
    </h3>
  </div>

</div>


            <h2 className="text-xl font-bold tracking-wide text-white">
                {user?.name || "No username"}
            </h2>


            <p className="text-sm text-gray-400">
                {user?.email || "No email"}
            </p>


            <span className="mt-1 rounded-full bg-cyan-950 px-4 py-1 text-xs font-medium text-cyan-400">
                Route Member
            </span>
            <div>
                <Myposts />
            </div>
        </div>
    );
}

function Myposts() {
    const getMyPosts = async () => {
        const token = localStorage.getItem("token");
        let user = localStorage.getItem("user");
        let parsedUser;
        if (user) {
            parsedUser = JSON.parse(user);
        }



        const response = await axios.get(
            'https://route-posts.routemisr.com/users/'+parsedUser._id+'/posts',
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        return response.data;
    };
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const data = await getMyPosts();

                console.log("Posts response:", data);


                const postsData = data.data?.posts ?? data.data ?? data.posts ?? [];
                setPosts(Array.isArray(postsData) ? postsData : []);
            } catch (err: any) {
                setError(
                    err.response?.data?.message ||
                    err.message ||
                    "Failed to fetch posts."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, []);

    if (loading) {
        return <div className="flex min-h-screen items-center justify-center">
            <TailSpin
                visible={true}
                height="80"
                width="80"
                color="#4fa94d"
                ariaLabel="tail-spin-loading"
                radius="1"
                wrapperStyle={{}}
                wrapperClass=""
            />
        </div>
    }

    if (error) {
        return <p className="p-6 text-red-400">{error}</p>;
    }

    const deletePost = async (postId: string) => {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      console.error("You must be logged in to delete a post.");
      return;
    }

    const response = await fetch(
      `https://route-posts.routemisr.com/posts/${postId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to delete post (${response.status})`);
    }

    // Update the UI immediately without refreshing
    setPosts((prev) =>
      prev.filter((post) => post._id !== postId)
    );

    console.log("Post deleted successfully");
  } catch (error) {
    console.error("Error deleting post:", error);
  }
};

    return (<div className="mx-auto space-y-4 p-4 block min-h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-white">My Posts</h1>

        {posts.length === 0 ? (
            <p className="text-gray-400">You haven't created any posts yet.</p>
        ) : (
            posts.map((post) => (
                <article
                    key={post._id || post.id}
                    className="rounded-xl border border-gray-800 bg-[#111] p-5 text-white"
                >
                    <h2>{post.user?.name +" @"+ post.user?.username || "Unkown User"}</h2>
                    <h2 className="text-lg font-semibold">
                        {post.body || "Untitled post"}
                    </h2>

                    <p className="mt-2 text-gray-300">
                        {post.content || post.text || ""}
                    </p><img src={post.image} className="w-full"></img>
                    <div className="grid grid-cols-4 gap-5 pt-3 text-sm text-gray-500 justify-center items-center">
                        <span><Like1 size="24" color="#2ccce4"/> {post.likesCount ?? 0} Likes</span>
                        <span><MessageText1 size="24" color="#2ccce4"/> {post.commentsCount ?? 0} Comments</span>
                        <span><Share size="24" color="#2ccce4"/> {post.sharesCount ?? 0} Shares</span>
                        <span><button type="button" className="cursor-pointer" onClick={() => deletePost(post._id)}><Trash size="32" color="#f47373" variant="Outline"/>Delete Post</button></span>
                    </div>
                </article>
            ))
        )}
    </div>
    )
}

