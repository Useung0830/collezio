"use client";

import { useState } from "react";

import MatchProposalCard from "@/features/matching/components/MatchProposalCard";
import { matchProposals } from "@/features/matching/mocks/matches";
import type { MatchProposalType } from "@/features/matching/types/match";

type MatchFilter = "all" | MatchProposalType;

const matchFilters: { label: string; value: MatchFilter }[] = [
  { label: "전체", value: "all" },
  { label: "추천", value: "recommended" },
  { label: "보낸 제안", value: "sent" },
  { label: "받은 제안", value: "received" },
];

export default function MatchHistoryList() {
  const [selectedFilter, setSelectedFilter] = useState<MatchFilter>("all");

  const filteredProposals =
    selectedFilter === "all"
      ? matchProposals
      : matchProposals.filter((proposal) => proposal.type === selectedFilter);

  const handleFilterChange = (filter: MatchFilter) => {
    setSelectedFilter(filter);
  };

  return (
    <section aria-labelledby="match-history-title">
      <h2 id="match-history-title" className="text-heading-20 text-black-900">
        매칭 내역 <span className="text-black-600 ml-2">3</span>
      </h2>

      <div className="mt-4 overflow-x-auto">
        <div className="flex min-w-max gap-1">
          {matchFilters.map((filter) => {
            const isActive = selectedFilter === filter.value;
            const count =
              filter.value === "all"
                ? matchProposals.length
                : matchProposals.filter(
                    (proposal) => proposal.type === filter.value,
                  ).length;

            return (
              <button
                key={filter.value}
                type="button"
                aria-pressed={isActive}
                className={`text-body-16 relative px-4 pb-3 ${
                  isActive ? "text-black-900" : "text-black-600"
                }`}
                onClick={() => handleFilterChange(filter.value)}
              >
                {filter.label} {count}
                {isActive && (
                  <span className="bg-black-900 absolute inset-x-4 bottom-0 h-px" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-5">
        {filteredProposals.map((proposal) => (
          <MatchProposalCard key={proposal.id} proposal={proposal} />
        ))}
      </div>
    </section>
  );
}
