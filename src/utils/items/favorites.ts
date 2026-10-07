import type { FavoriteItem, Item, FilterSort, ValueSort } from "@/types";
import { matchesTextSearch } from "@/utils/helpers/itemSearch";
import {
  filterByTypes,
  filterByValueSort,
  parseCashValue,
  sortByValueSort,
} from "@/utils/trading/values";
import { isSeasonalItem } from "./season";

// Favorites omit catalog-only fields that item cards do not need.
export function favoriteCatalogItems(favorites: FavoriteItem[]): Item[] {
  return favorites.map(({ item }) => ({
    creator: null,
    season: null,
    level: null,
    cash_value: null,
    duped_value: null,
    price: "",
    duped_owners: [],
    notes: null,
    demand: null,
    duped_demand: null,
    trend: null,
    description: null,
    health: null,
    tradable: 0,
    last_updated: 0,
    ...item,
    is_seasonal: Number(isSeasonalItem(item)),
    is_limited: item.is_limited ?? 0,
  }));
}

export function filterFavoriteItems(
  favorites: FavoriteItem[],
  query: string,
  filters: FilterSort[],
  sort: ValueSort,
  min?: number,
  max?: number,
): Item[] {
  const items = favoriteCatalogItems(favorites).filter((item) => {
    const cash = parseCashValue(item.cash_value);
    return (
      matchesTextSearch([item.name, item.type], query) &&
      (min === undefined || cash >= min) &&
      (max === undefined || (cash >= 0 && cash <= max))
    );
  });
  return sortByValueSort(
    filterByValueSort(
      filterByTypes(
        items,
        filters.filter((filter) => filter !== "favorites"),
      ),
      sort,
    ),
    sort,
  );
}
