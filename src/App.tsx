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
  const galleryLength = isGallery ? post?.data?.gallery_data?.items.length : 0;

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

  const prevEnebled = posts.length > 0 && postIndex > 0;
  const nextEnabled = posts.length > 0 && postIndex < posts.length - 1;

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
          <button onClick={handlePrev} disabled={!prevEnebled}>
            ◀︎ Prev
          </button>{" "}
          <button onClick={handleNext} disabled={!nextEnabled}>
            Next ►
          </button>
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
  const backgroundImage = post.preview?.images[0].resolutions[0].url;

  if (post.post_hint === "image")
    return <Image post={post} backgroundImage={backgroundImage} />;
  //if (post.post_hint === "hosted:video") console.log(post);
  if (post.post_hint === "hosted:video")
    return <HostedVideo post={post} backgroundImage={backgroundImage} />;
  if (post.post_hint === "rich:video")
    return <RichVideo post={post} backgroundImage={backgroundImage} />;
  //if (post.is_gallery) console.log(post);
  if (post.is_gallery) {
    return <Gallery post={post} galleryIndex={galleryIndex} />;
  }

  return (
    <div className="entry default">
      <a target="_blank" href={BASE_URI + post.permalink}>
        <h3>{post.title}</h3>
      </a>
      <div>{JSON.stringify(post, null, 2)}</div>
    </div>
  );
}

function Gallery({ post, galleryIndex }: { post: Post; galleryIndex: number }) {
  if (post.gallery_data && post.media_metadata) {
    //const imageKeys = Object.keys(post.media_metadata);
    const imageKeys = post.gallery_data.items.map(
      (item: { media_id: string; id: number }) => item.media_id,
    );
    const media = post.media_metadata[imageKeys[galleryIndex]];
    const backgroundImage = media.p[0].u;

    return (
      <div className="entry gallery" key={media.id}>
        <img
          className="backBlurred"
          src={backgroundImage}
          alt={post.title}
          title={post.title}
          loading="eager"
        />
        <img
          className="contain"
          src={media.s?.u}
          alt={post.title}
          title={post.title}
          loading="lazy"
        />
      </div>
    );
  }
  return null;
}

function Image({
  post,
  backgroundImage,
}: {
  post: Post;
  backgroundImage: string | undefined;
}) {
  const imageUrl = post.url.includes("i.redgifs.com")
    ? post.preview?.images[0].source.url
    : post.url;
  return (
    <div className="entry image" key={post.id}>
      <img
        className="backBlurred"
        src={backgroundImage}
        alt={post.title}
        title={post.title}
        loading="eager"
      />
      <img
        className="contain"
        src={imageUrl}
        alt={post.title}
        title={post.title}
        loading="lazy"
      />
    </div>
  );
}

function HostedVideo({
  post,
  backgroundImage,
}: {
  post: Post;
  backgroundImage: string | undefined;
}) {
  return (
    <div className="entry hostedvideo" key={post.id}>
      <img
        className="backBlurred"
        src={backgroundImage}
        alt={post.title}
        title={post.title}
        loading="eager"
      />
      <video
        className="contain"
        src={post.secure_media.reddit_video.fallback_url}
        title={post.title}
        autoPlay
        loop
        playsInline
      />
    </div>
  );
}

function RichVideo({
  post,
  backgroundImage,
}: {
  post: Post;
  backgroundImage: string | undefined;
}) {
  return (
    <div className="entry richvideo" key={post.id}>
      <img
        className="backBlurred"
        src={backgroundImage}
        alt={post.title}
        title={post.title}
        loading="eager"
      />
      <iframe
        className="contain"
        src={post.secure_media_embed.content?.match(/https:[^"]+/)?.[0] ?? ""}
        frameBorder="0"
        scrolling="no"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}

export default App;
