import { useEffect, useRef, useState } from "react";
import { EJSON } from "bson";

export function useDocuments(roomId: string, collection: string) {
  const [data, setData] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isFetching, setIsFetching] = useState(false);
  const limit = 50;
  const token = () => localStorage.getItem("token");

  // Refs so the mongoedit:saved event handler always has the latest values
  const pageRef = useRef(1);
  useEffect(() => { pageRef.current = page; }, [page]);

  // Last active query (filter + sort) so auto-refresh can re-run it instead of
  // reverting a filtered view back to the unfiltered collection. null = unfiltered.
  const lastQueryRef = useRef<{ filter: any; sort?: any } | null>(null);

  const fetchData = async (p = page) => {
    lastQueryRef.current = null;
    setIsFetching(true);
    try {
      const res = await fetch(
        `/api/rooms/${roomId}/collections/${collection}?page=${p}&limit=${limit}`,
        { headers: { Authorization: `Bearer ${token()}` } },
      );
      const json = await res.json();
      setData(json.data || []);
      setTotal(json.total || 0);
    } finally {
      setIsFetching(false);
    }
  };

  const queryData = async (filter: any, p = 1, sort?: any) => {
    const filtered = (filter && Object.keys(filter).length > 0) || !!sort;
    lastQueryRef.current = filtered ? { filter, sort } : null;
    setIsFetching(true);
    try {
      const encodedFilter = encodeURIComponent(
        EJSON.stringify(filter, { relaxed: false }),
      );
      let url = `/api/rooms/${roomId}/collections/${collection}?filter=${encodedFilter}&page=${p}&limit=${limit}`;
      if (sort) {
        url += `&sort=${encodeURIComponent(EJSON.stringify(sort, { relaxed: false }))}`;
      }
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token()}` } });
      const json = await res.json();
      setData(json.data || []);
      setTotal(json.total || 0);
      setPage(p);
    } finally {
      setIsFetching(false);
    }
  };

  const createDoc = (payload: any) =>
    fetch(`/api/rooms/${roomId}/collections/${collection}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token()}`,
      },
      body: JSON.stringify(payload),
    });

  const updateDoc = (id: string, payload: any) =>
    fetch(`/api/rooms/${roomId}/collections/${collection}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token()}`,
      },
      body: JSON.stringify(payload),
    });

  const deleteDoc = (id: string) =>
    fetch(`/api/rooms/${roomId}/collections/${collection}/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token()}` },
    });

  useEffect(() => {
    setPage(1);
    fetchData(1);

    // Re-run the active query (filtered or not) so auto-refresh keeps the
    // current filter/sort instead of reverting to the unfiltered collection.
    const refresh = () => {
      const q = lastQueryRef.current;
      if (q) return queryData(q.filter, pageRef.current, q.sort);
      return fetchData(pageRef.current);
    };

    const es = new EventSource(
      `/api/rooms/${roomId}/collections/${collection}/stream`,
    );
    es.onmessage = () => refresh();

    // Refresh when the edit page saves a document and navigates back (same tab)
    const handleSaved = () => refresh();
    window.addEventListener("mongoedit:saved", handleSaved);

    // Cross-tab refresh: a save in another tab (e.g. "Edit in New Tab") writes
    // mongoedit:saved:ping; the storage event fires here if it's our collection.
    const handleStorage = (e: StorageEvent) => {
      if (e.key !== "mongoedit:saved:ping" || !e.newValue) return;
      try {
        const p = JSON.parse(e.newValue);
        if (p.roomId === roomId && p.collection === collection) refresh();
      } catch { /* ignore malformed ping */ }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      es.close();
      window.removeEventListener("mongoedit:saved", handleSaved);
      window.removeEventListener("storage", handleStorage);
    };
  }, [roomId, collection]);

  return {
    data,
    fetchData,
    queryData,
    createDoc,
    updateDoc,
    deleteDoc,
    page,
    setPage,
    total,
    limit,
    isFetching,
  };
}
