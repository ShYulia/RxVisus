import { Star } from '@phosphor-icons/react';
import { useFavoritesStore, type FavoriteRef } from '../store/favoritesStore';
import './FavoriteStarButton.css';

export interface FavoriteStarButtonProps {
  favorite: FavoriteRef;
  /** Used only for the accessible label, e.g. "Vertex Distance". */
  label: string;
}

/** Toggle button for adding/removing an item from Favorites — used in calculator and Clinical Guide headers. */
const FavoriteStarButton: React.FC<FavoriteStarButtonProps> = ({ favorite, label }) => {
  const isFavorite = useFavoritesStore((s) => s.isFavorite(favorite));
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);

  return (
    <button
      type="button"
      className={`rx-favorite-btn ${isFavorite ? 'rx-favorite-btn-active' : ''}`}
      onClick={() => toggleFavorite(favorite)}
      aria-pressed={isFavorite}
      aria-label={isFavorite ? `Remove ${label} from Favorites` : `Add ${label} to Favorites`}
    >
      <Star size={20} weight={isFavorite ? 'fill' : 'regular'} />
    </button>
  );
};

export default FavoriteStarButton;
