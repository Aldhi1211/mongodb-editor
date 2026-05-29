import { useEffect, useRef, useState } from "react";
import { EJSON } from "bson";

export function useDocuments(roomId: string, collection: string) {
  const [data, setData] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isFetching, setIsFetching] = useState(false);
  const limit = 20;
  const token = () => localStorage.getItem("token");

  // Refs so the mongoedit:saved event handler always has the latest values
  const pageRef = useRef(1);
  useEffect(() => { pageRef.current = page; }, [page]);

  const fetchData = async (p = page) => {
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

    const es = new EventSource(
      `/api/rooms/${roomId}/collections/${collection}/stream`,
    );
    es.onmessage = () => fetchData(page);

    // Refresh when the edit page saves a document and navigates back
    const handleSaved = () => fetchData(pageRef.current);
    window.addEventListener("mongoedit:saved", handleSaved);

    return () => {
      es.close();
      window.removeEventListener("mongoedit:saved", handleSaved);
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
