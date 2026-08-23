import { useState } from 'react';
import { IonContent, IonInput, IonPage } from '@ionic/react';
import PageHeader from '../../components/PageHeader';
import PillarRow from '../../components/PillarRow';
import '../../components/PillarRow.css';
import { BookIcon, CompassIcon, SearchIcon } from '../../components/icons';
import { guideAreas } from '../../domain/reference/guideAreas';
import { searchClinicalTests } from '../../domain/reference/clinicalTests';
import './Guide.css';

const Guide: React.FC = () => {
  const [query, setQuery] = useState('');
  const trimmed = query.trim();
  const results = trimmed ? searchClinicalTests(trimmed) : [];

  return (
    <IonPage>
      <PageHeader title="Clinical Guide" backHref="/home" />
      <IonContent fullscreen className="ion-padding">
        <div className="rx-search">
          <SearchIcon size={18} className="rx-search-icon" />
          <IonInput
            className="rx-search-input"
            placeholder="Search tests, e.g. Maddox"
            value={query}
            onIonInput={(e) => setQuery(e.detail.value ?? '')}
          />
        </div>

        {trimmed ? (
          <div className="rx-pillars">
            {results.length === 0 && <p className="rx-hint">No tests match &ldquo;{trimmed}&rdquo;.</p>}
            {results.map((test) => (
              <PillarRow
                key={test.id}
                icon={<SearchIcon size={20} />}
                title={test.title}
                desc={test.purpose}
                routerLink={`/guide/tests/${test.id}`}
                state={{ from: '/guide' }}
              />
            ))}
          </div>
        ) : (
          <>
            <p className="rx-section-label">Clinical pathways</p>
            <div className="rx-pillars">
              {guideAreas.map((area) => (
                <PillarRow
                  key={area.id}
                  icon={<CompassIcon size={22} />}
                  title={area.title}
                  desc={area.desc}
                  comingSoon={!area.pathwayId}
                  routerLink={area.pathwayId ? `/guide/pathway/${area.pathwayId}` : undefined}
                />
              ))}
            </div>

            <p className="rx-section-label">Or browse directly</p>
            <div className="rx-pillars">
              <PillarRow
                icon={<BookIcon size={22} />}
                title="All Tests"
                desc="Browse every canonical test card"
                routerLink="/guide/tests"
              />
            </div>
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Guide;
