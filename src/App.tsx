import { useEffect, useState } from "react";
import { useHash } from "./hooks/useHash";
import "./App.css";
import { Reddit, Children, Post } from "./reddit";

const BASE_URI = "https://old.reddit.com";

function App() {
  const [hash, setHash] = useHash();
  const [posts, setPosts] = useState<Children[]>([]);
  const [postIndex, setPostIndex] = useState(0);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const post = posts && posts[postIndex];
  const isGallery = !!post?.data?.is_gallery;
  const galleryLength = isGallery ? post?.data?.gallery_data.items.length : 0;

  const handlePrev = () => {
    if (isGallery && galleryIndex - 1 >= 0) {
      setGalleryIndex((index) => index - 1);
      return;
    }
    setGalleryIndex(0);
    setPostIndex((index) => (index - 1 > 0 ? index - 1 : 0));
  };

  const handleNext = () => {
    if (isGallery && galleryIndex + 1 < galleryLength) {
      setGalleryIndex((index) => index + 1);
      return;
    }
    setGalleryIndex(0);
    setPostIndex((index) =>
      index + 1 < posts.length ? index + 1 : posts.length - 1,
    );
  };

  useEffect(() => {
    document.title = hash;
    const feed = `${BASE_URI}/${hash}.json?raw_json=1&limit=100`;
    setPostIndex(0);
    setPosts([]);
    fetch(feed)
      .then((res) => res.json())
      .then((data: Reddit) => {
        setPosts(
          data.data.children.filter(
            (value) =>
              value.data?.is_gallery ||
              (value.data?.post_hint &&
                ["image", "hosted:video", "rich:video"].includes(
                  value.data.post_hint,
                )),
          ),
        );
      });
  }, [hash]);

  return (
    <>
      <div className="head">
        <h1 style={{ marginTop: "-0.2em" }}>{hash || "rview"}</h1>
        <div style={{ padding: 5, flexGrow: 1, textAlign: "center" }}>
          {post && (
            <>
              <h4>
                <a target="_blank" href={BASE_URI + post.data.permalink}>
                  {post.data.title}
                </a>
              </h4>
              <a
                target="_blank"
                href={`${BASE_URI}/user/${post.data.author}`}
                onClick={(event) => {
                  event.preventDefault();
                  setHash(`user/${post.data.author}`);
                }}
              >
                <small>u/{post.data.author}</small>
              </a>
              {" - "}
              <a
                target="_blank"
                href={`${BASE_URI}/user/${post.data.subreddit}`}
                onClick={(event) => {
                  event.preventDefault();
                  setHash(`r/${post.data.subreddit}`);
                }}
              >
                <small>r/{post.data.subreddit}</small>
              </a>
            </>
          )}
        </div>
        <div style={{ padding: 5, whiteSpace: "nowrap" }}>
          <button onClick={handlePrev}>◀︎ Prev</button>{" "}
          <button onClick={handleNext}>Next ►</button>
        </div>
      </div>

      {post && (
        <DefaultPost
          key={post.data.id}
          post={post.data}
          galleryIndex={galleryIndex}
        />
      )}
    </>
  );
}

function DefaultPost({
  post,
  galleryIndex,
}: {
  post: Post;
  galleryIndex: number;
}) {
  console.log(post);
  if (post.post_hint === "image") return <Image post={post} />;
  //if (post.post_hint === "hosted:video") console.log(post);
  if (post.post_hint === "hosted:video") return <HostedVideo post={post} />;
  if (post.post_hint === "rich:video") return <RichVideo post={post} />;
  //if (post.is_gallery) console.log(post);
  if (post.is_gallery)
    return <Gallery post={post} galleryIndex={galleryIndex} />;

  return (
    <div className="entry">
      <a target="_blank" href={BASE_URI + post.permalink}>
        <h3>{post.title}</h3>
      </a>
      <div>{JSON.stringify(post, null, 2)}</div>
    </div>
  );
}

function Gallery({ post, galleryIndex }: { post: Post; galleryIndex: number }) {
  if (post.media_metadata) {
    const imageKeys = Object.keys(post.media_metadata);
    const media = post.media_metadata[imageKeys[galleryIndex]];

    return (
      <div className="entry" key={media.id}>
        <img
          className="contain"
          src={media.s?.u}
          alt={post.title}
          title={post.title}
        />
      </div>
    );
  }
  return null;
}

function Image({ post }: { post: Post }) {
  const imageUrl = post.url.includes("i.redgifs.com")
    ? post.preview?.images[0].source.url
    : post.url;
  return (
    <div className="entry" key={post.id}>
      <img
        className="contain"
        src={imageUrl}
        alt={post.title}
        title={post.title}
      />
    </div>
  );
}

function HostedVideo({ post }: { post: Post }) {
  return (
    <div className="entry" key={post.id}>
      <video
        className="contain"
        src={post.secure_media.reddit_video.fallback_url}
        title={post.title}
        autoPlay
        loop
      />
    </div>
  );
}

function RichVideo({ post }: { post: Post }) {
  return (
    <div className="entry" key={post.id}>
      <iframe
        className="contain"
        src={post.secure_media_embed.content?.match(/https:[^"]+/)?.[0] ?? ""}
        frameBorder="0"
        scrolling="no"
        allowFullScreen
      />
    </div>
  );
}

export default App;
