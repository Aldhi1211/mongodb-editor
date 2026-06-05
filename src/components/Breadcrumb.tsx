"use client";

/**
 * Sub-toolbar breadcrumb shown directly under the navbar — matches the Montra
 * mockup (`cluster / collection / leaf`). Segments before the last are clickable
 * when a handler is provided.
 */
export default function Breadcrumb({
  cluster,
  collection,
  leaf,
  onClusterClick,
  onCollectionClick,
  right,
}: {
  cluster?: string | null;
  collection?: string | null;
  /** Final, non-clickable segment (e.g. "New Document"). */
  leaf?: string | null;
  onClusterClick?: () => void;
  onCollectionClick?: () => void;
  /** Optional right-aligned content (count, filter button, …). */
  right?: React.ReactNode;
}) {
  const sep = <span className="text-neutral-300 select-none">/</span>;

  return (
    <div className="flex h-11 items-center justify-between gap-3 border-b border-neutral-200 bg-white px-4 sm:px-5 lg:px-6 flex-shrink-0">
      <div className="flex min-w-0 items-center gap-2 font-mono text-[12px]">
        {cluster && (
          <button
            type="button"
            onClick={onClusterClick}
            disabled={!onClusterClick}
            className={`truncate ${
              onClusterClick && (collection || leaf)
                ? "text-neutral-400 hover:text-neutral-900 cursor-pointer transition-colors"
                : "text-neutral-900"
            }`}
          >
            {cluster}
          </button>
        )}

        {collection && (
          <>
            {cluster && sep}
            <button
              type="button"
              onClick={onCollectionClick}
              disabled={!onCollectionClick}
              className={`truncate ${
                onCollectionClick && leaf
                  ? "text-neutral-400 hover:text-neutral-900 cursor-pointer transition-colors"
                  : "text-neutral-900"
              }`}
            >
              {collection}
            </button>
          </>
        )}

        {leaf && (
          <>
            {(cluster || collection) && sep}
            <span className="truncate text-neutral-900">{leaf}</span>
          </>
        )}
      </div>

      {right && <div className="flex items-center gap-3 flex-shrink-0">{right}</div>}
    </div>
  );
}
