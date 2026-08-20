import { IonContent, IonPage } from '@ionic/react';
import { Star } from '@phosphor-icons/react';
import PageHeader from '../../components/PageHeader';
import PillarRow from '../../components/PillarRow';
import '../../components/PillarRow.css';
import { useFavoritesStore } from '../../store/favoritesStore';
import { resolveFavorite } from './resolveFavorite';

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
          <div className="rx-pillars">
            {resolved.map((item) => (
              <PillarRow
                key={`${item.type}:${item.id}`}
                icon={<Star size={20} weight="fill" />}
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
