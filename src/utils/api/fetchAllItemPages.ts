type ItemPage<T> = {
  items: T[];
  page: number;
  total_pages: number;
};

export async function fetchAllItemPages<T>(
  fetchPage: (page: number) => Promise<Response>,
): Promise<T[]> {
  const loadPage = async (page: number): Promise<ItemPage<T>> => {
    const response = await fetchPage(page);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch items page ${page} (${response.status})`,
      );
    }

    const result: ItemPage<T> = await response.json();
    if (
      !Array.isArray(result.items) ||
      result.page !== page ||
      !Number.isInteger(result.total_pages) ||
      result.total_pages < 0
    ) {
      throw new Error(`Invalid items page ${page}`);
    }
    return result;
  };

  const firstPage = await loadPage(1);
  const items = [...firstPage.items];

  for (let page = 2; page <= firstPage.total_pages; page += 5) {
    const lastPage = Math.min(page + 4, firstPage.total_pages);
    const pages = await Promise.all(
      Array.from({ length: lastPage - page + 1 }, (_, index) =>
        loadPage(page + index),
      ),
    );
    for (const result of pages) items.push(...result.items);
  }

  return items;
}
