import { apiRequest } from "../../../../../apps/web/src/shared/api/httpClient";
import type {
  TagAssignment,
  TagBulkAssignInput,
  TagCreateInput,
  TagUpdateInput,
  TagView
} from "../types/tag.types";

export function listTags(): Promise<{
  items: TagView[];
}> {
  return apiRequest<{ items: TagView[] }>(
    "/tags"
  );
}

export function listTagAssignments(): Promise<{
  items: TagAssignment[];
}> {
  return apiRequest<{
    items: TagAssignment[];
  }>("/tags/assignments");
}

export function createTag(
  input: TagCreateInput
): Promise<TagView> {
  return apiRequest<TagView>("/tags", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function updateTag(
  id: string,
  update: TagUpdateInput
): Promise<TagView> {
  return apiRequest<TagView>(
    `/tags/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      body: JSON.stringify(update)
    }
  );
}

export function deleteTag(
  id: string
): Promise<void> {
  return apiRequest<void>(
    `/tags/${encodeURIComponent(id)}`,
    { method: "DELETE" }
  );
}

export function assignTag(
  tagId: string,
  characterId: string
): Promise<void> {
  return apiRequest<void>(
    `/tags/${encodeURIComponent(tagId)}/characters/${encodeURIComponent(characterId)}`,
    { method: "PUT" }
  );
}

export function unassignTag(
  tagId: string,
  characterId: string
): Promise<void> {
  return apiRequest<void>(
    `/tags/${encodeURIComponent(tagId)}/characters/${encodeURIComponent(characterId)}`,
    { method: "DELETE" }
  );
}

export function bulkAssignTags(
  input: TagBulkAssignInput
): Promise<void> {
  return apiRequest<void>(
    "/tags/assignments/bulk",
    {
      method: "POST",
      body: JSON.stringify(input)
    }
  );
}
