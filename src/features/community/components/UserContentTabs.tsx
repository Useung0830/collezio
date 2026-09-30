import type { UserContentTab } from "@/features/community/types/userContent";

type UserContentTabsProps = {
  activeTab: UserContentTab;
  onChange: (tab: UserContentTab) => void;
};

const tabs: { label: string; value: UserContentTab }[] = [
  { label: "게시글", value: "posts" },
  { label: "댓글", value: "comments" },
];

export default function UserContentTabs({
  activeTab,
  onChange,
}: UserContentTabsProps) {
  return (
    <div className="border-black-200 flex border-b" role="tablist">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.value;

        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            id={`user-content-tab-${tab.value}`}
            aria-controls={`user-content-${tab.value}`}
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onKeyDown={(event) => {
              if (
                !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
              )
                return;
              event.preventDefault();
              const next =
                event.key === "Home"
                  ? "posts"
                  : event.key === "End"
                    ? "comments"
                    : activeTab === "posts"
                      ? "comments"
                      : "posts";
              onChange(next);
              document.getElementById(`user-content-tab-${next}`)?.focus();
            }}
            className={`text-body-16 relative px-4 pb-3 ${
              isActive ? "text-black-900" : "text-black-600"
            }`}
            onClick={() => onChange(tab.value)}
          >
            {tab.label}
            {isActive && (
              <span className="bg-black-900 absolute inset-x-4 bottom-0 h-px" />
            )}
          </button>
        );
      })}
    </div>
  );
}
