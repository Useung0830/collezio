import styles from "./productShowcase.module.css";

interface ProductShowcaseEmptySlotsProps {
  productCount: number;
  size?: "default" | "compact";
}

const SHOWCASE_LAYOUTS = {
  default: [
    { columns: 2, visibility: "block md:hidden" },
    { columns: 4, visibility: "hidden md:block" },
  ],
  compact: [
    { columns: 2, visibility: "block sm:hidden" },
    { columns: 3, visibility: "hidden sm:block lg:hidden" },
    { columns: 5, visibility: "hidden lg:block" },
  ],
};

export default function ProductShowcaseEmptySlots({
  productCount,
  size = "default",
}: ProductShowcaseEmptySlotsProps) {
  if (productCount === 0) return null;

  return SHOWCASE_LAYOUTS[size].flatMap(({ columns, visibility }) => {
    const emptyCount = (columns - (productCount % columns)) % columns;

    return Array.from({ length: emptyCount }, (_, slot) => (
      <li
        key={`${columns}-${slot}`}
        aria-hidden="true"
        className={`${styles.compartment} ${visibility}`}
      >
        <div className={styles.display}>
          <span className={styles.interior} />
          <span className={styles.reflection} />
        </div>
      </li>
    ));
  });
}
