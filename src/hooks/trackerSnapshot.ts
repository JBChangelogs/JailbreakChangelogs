import { replaceEqualDeep } from "@tanstack/react-query";

export function shareTrackerSnapshot<T>(
  previous: T[],
  incoming: T[],
  getKey?: (item: T) => string,
): T[] {
  if (!getKey) return replaceEqualDeep(previous, incoming);

  const byKey = new Map(previous.map((item) => [getKey(item), item]));
  const next = incoming.map((item) =>
    replaceEqualDeep(byKey.get(getKey(item)), item),
  );
  return next.length === previous.length &&
    next.every((item, index) => item === previous[index])
    ? previous
    : next;
}
