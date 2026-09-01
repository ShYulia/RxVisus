import { IonContent, IonPage } from '@ionic/react';
import PageHeader from '../../components/PageHeader';
import { ExternalLinkIcon } from '../../components/icons';
import pkg from '../../../package.json';
import './About.css';

const LINKEDIN_URL = 'https://www.linkedin.com/in/julia-shalev-57460379';

const About: React.FC = () => (
  <IonPage>
    <PageHeader title="About" backHref="/home" />
    <IonContent fullscreen className="ion-padding">
      <div className="rx-about-inner">
        <div className="rx-about-brand">
          <span className="rx-about-wordmark">RxKit</span>
          <span className="rx-about-tagline">Clinical Tools for Optometry</span>
        </div>

        <div className="rx-list-section">
          <p className="rx-list-section-label">About RxKit</p>
          <p className="rx-hint" style={{ marginTop: 0 }}>
            RxKit is a collection of clinical tools for everyday optometric practice —
            calculators, quick reference material, and testing pathways, built to work
            offline and stay out of the way during a clinic session.
          </p>
        </div>

        <div className="rx-about-divider" />

        <div className="rx-list-section">
          <p className="rx-list-section-label">About the Creator</p>
          <p className="rx-about-name">Yulia Shalev</p>
          <p className="rx-about-role">Optometrist &amp; Software Developer</p>
          <p className="rx-hint" style={{ marginTop: 10 }}>
            I&rsquo;m an optometrist and software developer with professional experience
            in both clinical practice and software development. I hold a B.Sc. in
            Optometry and an M.Sc. in Computer Science.
          </p>
          <p className="rx-hint">
            RxKit grew out of that combination. I wanted the calculators, clinical
            references, and practical tools I use in everyday optometric practice in
            one place — built the way I&rsquo;d want to use them myself.
          </p>
          <a
            className="rx-about-link"
            href={LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            LinkedIn
            <ExternalLinkIcon size={13} />
          </a>
        </div>

        <div className="rx-about-divider" />

        <div className="rx-about-footer">
          <p>Version {pkg.version}</p>
          <p>
            RxKit is a clinical reference and decision-support tool for qualified
            eye-care professionals — not a diagnostic device. It does not diagnose
            patients or replace professional clinical judgment.
          </p>
          <p>
            It helps you measure, calculate, organize, and interpret clinical findings.
            You independently verify all findings and remain responsible for diagnosis,
            management, and treatment decisions.
          </p>
          <p>RxKit runs entirely offline. No patient data is collected, transmitted, or stored.</p>
        </div>
      </div>
    </IonContent>
  </IonPage>
);

export default About;
