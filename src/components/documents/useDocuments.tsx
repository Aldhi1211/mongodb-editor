import { useEffect, useState } from "react";
import { EJSON } from "bson";

export function useDocuments(roomId: string, collection: string) {
  const [data, setData] = useState<any[]>([]);
  const token = () => localStorage.getItem("token");

  const fetchData = async () => {
    const res = await fetch(`/api/rooms/${roomId}/collections/${collection}`, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    const json = await res.json();
    setData(json.data || []);
  };

  const queryData = async (filter: any) => {
    const encodedFilter = encodeURIComponent(
      EJSON.stringify(filter, { relaxed: false }),
    );

    const res = await fetch(
      `/api/rooms/${roomId}/collections/${collection}?filter=${encodedFilter}`,
      {
        headers: {
          Authorization: `Bearer ${token()}`,
        },
      },
    );

    const json = await res.json();

    setData(json.data || []);
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

  // === REALTIME STREAM ===
  useEffect(() => {
    // 1. LOAD AWAL
    fetchData();

    // 2. SUBSCRIBE REALTIME
    const es = new EventSource(
      `/api/rooms/${roomId}/collections/${collection}/stream`,
    );

    es.onmessage = () => {
      fetchData();
    };

    return () => es.close();
  }, [roomId, collection]);

  return { data, fetchData, queryData, createDoc, updateDoc, deleteDoc };
}
