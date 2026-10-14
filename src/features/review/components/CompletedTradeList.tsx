import CompletedTradeCard from "@/features/review/components/CompletedTradeCard";
import { completedTrades } from "@/features/review/mocks/reviews";

export default function CompletedTradeList() {
  return (
    <section aria-labelledby="completed-trades-title">
      <h2
        id="completed-trades-title"
        className="text-heading-20 text-black-900 mb-4"
      >
        거래 완료 목록
        <span className="text-black-600 ml-2">{completedTrades.length}</span>
      </h2>

      <ul className="flex flex-col gap-3">
        {completedTrades.map((trade) => (
          <li key={trade.id}>
            <CompletedTradeCard trade={trade} />
          </li>
        ))}
      </ul>
    </section>
  );
}
