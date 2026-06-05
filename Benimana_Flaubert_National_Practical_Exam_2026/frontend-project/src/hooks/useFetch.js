import { useState, useEffect, useCallback } from "react";

// Custom hook: runs an async loader, exposes data/loading/error + a refetch().
// `apiFn` should return an axios promise resolving to { data: { data } }.
export function useFetch(apiFn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refetch = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFn();
      setData(res.data.data);
    } catch (err) {
      if (!err.response) {
        setError("Unable to connect to the server. Please try again.");
      } else {
        setError(err.response.data?.error || "Something went wrong");
      }
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch, setData };
}
