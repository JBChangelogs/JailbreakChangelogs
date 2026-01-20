import FavoriteButton from "@/components/Items/FavoriteButton";
import { fetchUserFavorites } from "@/utils/api";
import { getCurrentUser } from "@/utils/serverSession";

interface Props {
  itemId: number;
  initialFavoriteCountPromise: Promise<number | null>;
}

// Client component wrapper for Favorite functionality that can suspend
export default async function FavoriteButtonServer({
  itemId,
  initialFavoriteCountPromise,
}: Props) {
  const [user, initialFavoriteCount] = await Promise.all([
    getCurrentUser(),
    initialFavoriteCountPromise,
  ]);
  const isAuthenticated = !!user;

  let isFavorited = false;

  // If user is logged in, fetch their favorite status for this item
  if (isAuthenticated && user?.id) {
    const favoritesData = await fetchUserFavorites(user.id);
    if (favoritesData !== null && Array.isArray(favoritesData)) {
      isFavorited = favoritesData.some((fav) => {
        const favoriteId = String(fav.item_id);
        if (favoriteId.includes("-")) {
          const [parentId] = favoriteId.split("-");
          return Number(parentId) === itemId;
        }
        return Number(favoriteId) === itemId;
      });
    }
  }

  return (
    <FavoriteButton
      itemId={itemId}
      isAuthenticated={isAuthenticated}
      initialIsFavorited={isFavorited}
      initialCount={initialFavoriteCount || 0}
    />
  );
}
