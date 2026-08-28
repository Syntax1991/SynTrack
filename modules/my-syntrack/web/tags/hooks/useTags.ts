import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";
import {
  assignTag,
  bulkAssignTags,
  createTag,
  deleteTag,
  listTagAssignments,
  listTags,
  unassignTag,
  updateTag
} from "../api/tagApi";
import type {
  TagAssignment,
  TagBulkAssignInput,
  TagCreateInput,
  TagUpdateInput,
  TagView
} from "../types/tag.types";

export type TagsState = {
  tags: TagView[];
  assignments: TagAssignment[];
  tagIdsByCharacterId: Map<
    string,
    Set<string>
  >;
  isLoading: boolean;
  error: string | null;
  reload: () => void;
  create: (
    input: TagCreateInput
  ) => Promise<void>;
  update: (
    id: string,
    input: TagUpdateInput
  ) => Promise<void>;
  remove: (id: string) => Promise<void>;
  assign: (
    tagId: string,
    characterId: string
  ) => Promise<void>;
  unassign: (
    tagId: string,
    characterId: string
  ) => Promise<void>;
  bulkAssign: (
    input: TagBulkAssignInput
  ) => Promise<void>;
};

export function useTags(): TagsState {
  const [tags, setTags] = useState<
    TagView[]
  >([]);

  const [assignments, setAssignments] =
    useState<TagAssignment[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [reloadToken, setReloadToken] =
    useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const [
          tagResponse,
          assignmentResponse
        ] = await Promise.all([
          listTags(),
          listTagAssignments()
        ]);

        if (!cancelled) {
          setTags(tagResponse.items);

          setAssignments(
            assignmentResponse.items
          );
        }
      }
      catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Tags could not be loaded."
          );
        }
      }
      finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const reload = useCallback(() => {
    setReloadToken(
      (previous) => previous + 1
    );
  }, []);

  const tagIdsByCharacterId = useMemo(
    () => {
      const map = new Map<
        string,
        Set<string>
      >();

      for (const assignment of assignments) {
        const existing =
          map.get(
            assignment.characterId
          ) ?? new Set<string>();

        existing.add(assignment.tagId);
        map.set(
          assignment.characterId,
          existing
        );
      }

      return map;
    },
    [assignments]
  );

  const create = async (
    input: TagCreateInput
  ) => {
    await createTag(input);
    reload();
  };

  const update = async (
    id: string,
    input: TagUpdateInput
  ) => {
    await updateTag(id, input);
    reload();
  };

  const remove = async (id: string) => {
    await deleteTag(id);
    reload();
  };

  const assign = async (
    tagId: string,
    characterId: string
  ) => {
    await assignTag(tagId, characterId);
    reload();
  };

  const unassign = async (
    tagId: string,
    characterId: string
  ) => {
    await unassignTag(
      tagId,
      characterId
    );
    reload();
  };

  const bulkAssign = async (
    input: TagBulkAssignInput
  ) => {
    await bulkAssignTags(input);
    reload();
  };

  return {
    tags,
    assignments,
    tagIdsByCharacterId,
    isLoading,
    error,
    reload,
    create,
    update,
    remove,
    assign,
    unassign,
    bulkAssign
  };
}
