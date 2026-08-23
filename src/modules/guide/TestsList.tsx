import { useState } from 'react';
import { IonContent, IonInput, IonPage } from '@ionic/react';
import PageHeader from '../../components/PageHeader';
import PillarRow from '../../components/PillarRow';
import '../../components/PillarRow.css';
import { SearchIcon } from '../../components/icons';
import { searchClinicalTests } from '../../domain/reference/clinicalTests';
import './Guide.css';

/** Flat, searchable list of every canonical test — the direct-entry door into a Test Card. */
const TestsList: React.FC = () => {
  const [query, setQuery] = useState('');
  const results = searchClinicalTests(query);

  return (
    <IonPage>
      <PageHeader title="All Tests" backHref="/guide" />
      <IonContent fullscreen className="ion-padding">
        <div className="rx-search">
          <SearchIcon size={18} className="rx-search-icon" />
          <IonInput
            className="rx-search-input"
            placeholder="Search tests"
            value={query}
            onIonInput={(e) => setQuery(e.detail.value ?? '')}
          />
        </div>

        <div className="rx-pillars">
          {results.map((test) => (
            <PillarRow
              key={test.id}
              icon={<SearchIcon size={20} />}
              title={test.title}
              desc={test.purpose}
              routerLink={`/guide/tests/${test.id}`}
              state={{ from: '/guide/tests' }}
            />
          ))}
        </div>
        {results.length === 0 && <p className="rx-hint">No tests match &ldquo;{query}&rdquo;.</p>}
      </IonContent>
    </IonPage>
  );
};

export default TestsList;
