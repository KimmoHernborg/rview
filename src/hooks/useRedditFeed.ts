import { useQuery } from "@tanstack/react-query";
import type { Reddit, Children } from "../reddit";

const BASE_URI = "https://old.reddit.com";

async function fetchRedditFeed(hash: string): Promise<Children[]> {
  const feed = `${BASE_URI}/${hash}.json?raw_json=1&limit=100`;
  const response = await fetch(feed, { cache: "no-cache" });

  if (!response.ok) {
    throw new Error(`Failed to fetch feed: ${response.statusText}`);
  }

  const data: Reddit = await response.json();

  return data.data.children.filter(
    (value) =>
      value.data?.is_gallery ||
      (value.data?.post_hint &&
        ["image", "hosted:video", "rich:video"].includes(value.data.post_hint)),
  );
}

export function useRedditFeed(hash: string) {
  return useQuery({
    queryKey: ["redditFeed", hash],
    queryFn: () => fetchRedditFeed(hash),
    // enabled: !!hash,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
