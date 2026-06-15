import { useEffect, useState } from "react";
import { api } from "../lib/api";

export function useWorkspaces(workspaceId) {
  const [workspaces, setWorkspaces] = useState([]);
  const [tags, setTags] = useState([]);

  useEffect(() => {
    api("/workspaces")
      .then((data) => setWorkspaces(data.workspaces))
      .catch(() => setWorkspaces([]));
  }, []);

  useEffect(() => {
    if (!workspaceId) {
      setTags([]);
      return;
    }
    api(`/workspaces/${workspaceId}/tags`)
      .then((data) => setTags(data.tags))
      .catch(() => setTags([]));
  }, [workspaceId]);

  return { workspaces, tags };
}
