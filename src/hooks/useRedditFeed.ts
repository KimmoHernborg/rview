import { useInfiniteQuery } from "@tanstack/react-query";
import type { Reddit, Children } from "../reddit";

const BASE_URI = "https://old.reddit.com";

async function fetchRedditFeed(
  hash: string,
  after?: string,
): Promise<{ posts: Children[]; after?: string }> {
  const url = new URL(`${BASE_URI}/${hash}.json`);
  url.searchParams.set("raw_json", "1");
  url.searchParams.set("limit", "25");
  if (after) {
    url.searchParams.set("after", after);
  }

  const response = await fetch(url.toString(), { cache: "no-cache" });

  if (!response.ok) {
    throw new Error(`Failed to fetch feed: ${response.statusText}`);
  }

  const data: Reddit = await response.json();

  const filteredPosts = data.data.children.filter(
    (value) =>
      value.data?.is_gallery ||
      (value.data?.post_hint &&
        ["image", "hosted:video", "rich:video"].includes(value.data.post_hint)),
  );

  return {
    posts: filteredPosts,
    after: data.data.after || undefined,
  };
}

export function useRedditFeed(hash: string) {
  return useInfiniteQuery({
    queryKey: ["redditFeed", hash],
    queryFn: ({ pageParam }) => fetchRedditFeed(hash, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.after,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
}
