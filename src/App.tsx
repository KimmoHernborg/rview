import { useEffect, useState } from "react";
import { useHash } from "./hooks/useHash";
import { useRedditFeed } from "./hooks/useRedditFeed";
import { ScaleLoader } from "react-spinners";
import "./App.css";
import type { Post, Children } from "./reddit";

const BASE_URI = "https://old.reddit.com";

function getIndexPosistions(
  posts: Children[],
  postIndex: number,
  galleryIndex: number,
  offset: number,
) {
  const post = posts[postIndex];
  const isGallery = !!post?.data?.is_gallery;
  const galleryLength = isGallery ? post?.data?.gallery_data?.items.length : 0;
  if (
    isGallery &&
    galleryIndex + offset >= 0 &&
    galleryIndex + offset < galleryLength
  ) {
    // console.log("[next gallery]", {
    //   nextPostIndex: postIndex,
    //   nextGalleryIndex: galleryIndex + offset,
    // });
    return {
      nextPostIndex: postIndex,
      nextGalleryIndex: galleryIndex + offset,
    };
  }

  // Next post index
  let nextPostIndex = postIndex + offset;
  nextPostIndex = Math.min(nextPostIndex, posts.length - 1);
  nextPostIndex = Math.max(nextPostIndex, 0);

  // Next gallery index
  const nextIsGallery = !!posts[nextPostIndex]?.data?.is_gallery;
  const nextGalleryLength = nextIsGallery
    ? posts[nextPostIndex]?.data?.gallery_data?.items.length
    : 0;
  const nextGalleryIndex =
    offset < 0 && nextIsGallery ? nextGalleryLength - 1 : 0;
  // console.log("[next post+gallery]", { nextPostIndex, nextGalleryIndex });

  return { nextPostIndex, nextGalleryIndex };
}

function App() {
  const [hash, setHash] = useHash();
  const [postIndex, setPostIndex] = useState(0);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const { data: posts = [], isLoading, error } = useRedditFeed(hash);

  const post = posts && posts[postIndex];
  const isGallery = !!post?.data?.is_gallery;
  const galleryLength = isGallery ? post?.data?.gallery_data?.items.length : 0;

  const { nextPostIndex, nextGalleryIndex } = getIndexPosistions(
    posts,
    postIndex,
    galleryIndex,
    1,
  );
  const nextPost = posts[nextPostIndex];

  const handlePrev = () => {
    const { nextPostIndex, nextGalleryIndex } = getIndexPosistions(
      posts,
      postIndex,
      galleryIndex,
      -1,
    );
    setPostIndex(nextPostIndex);
    setGalleryIndex(nextGalleryIndex);
  };

  const handleNext = () => {
    setPostIndex(nextPostIndex);
    setGalleryIndex(nextGalleryIndex);
  };

  const prevEnebled = posts.length > 0 && (postIndex > 0 || galleryIndex > 0);
  const nextEnabled =
    posts.length > 0 &&
    (postIndex < posts.length - 1 || galleryIndex < galleryLength - 1);

  useEffect(() => {
    const hashStr = hash.toString();
    document.title = hashStr === "" ? "rview" : hashStr;
    setPostIndex(0);
    setGalleryIndex(0);
  }, [hash]);

  // console.log({ postIndex, galleryIndex });

  if (isLoading) {
    return (
      <div className="centered-loader">
        <ScaleLoader color="#ff4500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="centered-loader">
        <h2>Error loading feed</h2>
        <p style={{ margin: 0 }}>{error.message}</p>
        {/* <button onClick={() => window.location.reload()}>Retry</button> */}
      </div>
    );
  }

  return (
    <>
      <div className="head">
        <h1>{hash || "rview"}</h1>
        <div className="caption">
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
                href={`${BASE_URI}/r/${post.data.subreddit}`}
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
        <div className="md-spacer "></div>
        <div className="nav">
          <button onClick={handlePrev} disabled={!prevEnebled}>
            ◀︎ Prev
          </button>{" "}
          <button onClick={handleNext} disabled={!nextEnabled}>
            Next ▶
          </button>
        </div>
      </div>

      {post && (
        <>
          <DefaultPost
            key={post.data.id}
            post={post.data}
            galleryIndex={galleryIndex}
          />

          <div
            style={{
              visibility: "hidden",
              width: 0,
              height: 0,
              overflow: "hidden",
            }}
          >
            {nextPost && (
              <DefaultPost
                key={nextPost.data.id}
                post={nextPost.data}
                galleryIndex={nextGalleryIndex}
                isPreload={true}
              />
            )}
          </div>
        </>
      )}
    </>
  );
}

function DefaultPost({
  post,
  galleryIndex,
  isPreload = false,
}: {
  post: Post;
  galleryIndex: number;
  isPreload?: boolean;
}) {
  console.log(post);
  const backgroundImage = post.preview?.images[0].resolutions[0].url;

  if (post.post_hint === "image")
    return <Image post={post} backgroundImage={backgroundImage} />;
  //if (post.post_hint === "hosted:video") console.log(post);
  if (post.post_hint === "hosted:video")
    return (
      <HostedVideo
        post={post}
        backgroundImage={backgroundImage}
        isPreload={isPreload}
      />
    );
  if (post.post_hint === "rich:video")
    return (
      <RichVideo
        post={post}
        backgroundImage={backgroundImage}
        isPreload={isPreload}
      />
    );
  if (post.is_gallery) {
    // console.log(post);
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
    // console.log(media);

    if (media.status !== "valid") {
      return null;
    }

    const backgroundImage = media.p[0].u;
    const srcSet =
      media.p.map((image) => `${image.u} ${image.x}w`).join(", ") +
      `, ${media.s?.u} ${media.s?.x}w`;
    const isAnimated = media.e === "AnimatedImage";
    return (
      <div className="entry gallery" key={media.id}>
        <img
          className="backBlurred"
          src={backgroundImage}
          alt={post.title}
          title={post.title}
          loading="eager"
          width={media.s?.x}
          height={media.s?.y}
        />
        {isAnimated ? (
          <img
            className="contain"
            src={media.s?.gif}
            alt={post.title}
            title={post.title}
            loading="lazy"
            width={media.s?.x}
            height={media.s?.y}
          />
        ) : (
          <img
            className="contain"
            src={media.s?.u}
            srcSet={srcSet}
            sizes="auto"
            alt={post.title}
            title={post.title}
            loading="lazy"
            width={media.s?.x}
            height={media.s?.y}
          />
        )}
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
  const isAnimated = post.preview?.images[0]?.variants["gif"] !== undefined;
  const imageUrl = !isAnimated
    ? post.url.includes("i.redgifs.com")
      ? post.preview?.images[0].source.url
      : post.url
    : post.preview?.images[0]?.variants.gif?.source.url;
  const srcSet =
    post.preview?.images[0].resolutions
      .map((image) => `${image.url} ${image.width}w`)
      .join(", ") +
    `, ${post.preview?.images[0].source.url} ${post.preview?.images[0].source.width}w`;
  return (
    <div className="entry image" key={post.id}>
      <img
        className="backBlurred"
        src={backgroundImage}
        alt={post.title}
        title={post.title}
        loading="eager"
      />
      {!isAnimated ? (
        <img
          className="contain"
          src={imageUrl}
          srcSet={srcSet}
          sizes="auto"
          width={post.preview?.images[0].source.width}
          height={post.preview?.images[0].source.height}
          alt={post.title}
          title={post.title}
          loading="lazy"
        />
      ) : (
        <img
          className="contain"
          src={imageUrl}
          alt={post.title}
          title={post.title}
          loading="lazy"
        />
      )}
    </div>
  );
}

function HostedVideo({
  post,
  backgroundImage,
  isPreload = false,
}: {
  post: Post;
  backgroundImage: string | undefined;
  isPreload: boolean;
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
        autoPlay={!isPreload}
        loop
        playsInline
      />
    </div>
  );
}

function RichVideo({
  post,
  backgroundImage,
  isPreload = false,
}: {
  post: Post;
  backgroundImage: string | undefined;
  isPreload: boolean;
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
      {!isPreload && (
        <iframe
          className="contain"
          src={post.secure_media_embed.content?.match(/https:[^"]+/)?.[0] ?? ""}
          frameBorder="0"
          scrolling="no"
          allowFullScreen
          loading="lazy"
        />
      )}
    </div>
  );
}

export default App;
