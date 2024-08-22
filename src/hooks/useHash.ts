import { useState, useCallback, useEffect } from "react";

const removeHash = (hash: string) => hash.replace(/^#/, "");

export const useHash = (): [string, (newHash: string) => void] => {
  const [hash, setHash] = useState<string>(() =>
    removeHash(window.location.hash),
  );

  const hashChangeHandler = useCallback(() => {
    setHash(removeHash(window.location.hash));
  }, []);

  useEffect(() => {
    window.addEventListener("hashchange", hashChangeHandler);
    return () => {
      window.removeEventListener("hashchange", hashChangeHandler);
    };
  });

  const updateHash = useCallback(
    (newHash: string) => {
      if (newHash !== hash) window.location.hash = newHash;
    },
    [hash],
  );

  return [hash, updateHash];
};
