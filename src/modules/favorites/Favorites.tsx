import { IonContent, IonPage } from '@ionic/react';
import PageHeader from '../../components/PageHeader';
import PillarRow from '../../components/PillarRow';
import '../../components/PillarRow.css';
import { CalculatorIcon, CompassIcon, SearchIcon } from '../../components/icons';
import { useFavoritesStore, type FavoriteRef } from '../../store/favoritesStore';
import { resolveFavorite } from './resolveFavorite';

// Same per-type icon already used for this content elsewhere (Calculators hub,
// Clinical Guide's pathway/test rows) — so a saved item still reads as "what it is"
// at a glance, without adding a text badge to every row.
const TYPE_ICON: Record<FavoriteRef['type'], React.ReactNode> = {
  calculator: <CalculatorIcon size={26} />,
  test: <SearchIcon size={24} />,
  pathway: <CompassIcon size={26} />,
};

const Favorites: React.FC = () => {
  const favorites = useFavoritesStore((s) => s.favorites);
  const hydrated = useFavoritesStore((s) => s.hydrated);

  const resolved = favorites.map(resolveFavorite).filter((f) => f !== null);

  return (
    <IonPage>
      <PageHeader title="Favorites" backHref="/home" />
      <IonContent fullscreen className="ion-padding">
        {hydrated && resolved.length === 0 && (
          <p className="rx-hint">
            No favorites yet. Tap the star on any calculator or Clinical Guide item to add it here.
          </p>
        )}

        {resolved.length > 0 && (
          <div className="rx-pillars rx-pillars-cards">
            {resolved.map((item) => (
              <PillarRow
                key={`${item.type}:${item.id}`}
                icon={TYPE_ICON[item.type]}
                title={item.title}
                desc={item.desc}
                routerLink={item.route}
              />
            ))}
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Favorites;
