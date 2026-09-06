import { IonContent, IonPage } from '@ionic/react';
import PageHeader from '../../components/PageHeader';
import { ExternalLinkIcon, HeartIcon, ShieldIcon } from '../../components/icons';
import greetingEye from '../../assets/illustrations/greeting-eye.png';
import './About.css';

const LINKEDIN_URL = 'https://www.linkedin.com/in/julia-shalev-57460379';

const About: React.FC = () => (
  <IonPage>
    <PageHeader title="About" backHref="/home" />
    <IonContent fullscreen className="ion-padding rx-about-content">
      <div className="rx-about-inner">
        <div className="rx-about-hero">
          <img src={greetingEye} alt="" className="rx-about-eye" />
          <div className="rx-about-hero-text">
            <p className="rx-about-eyebrow">About</p>
            <h1 className="rx-about-hero-wordmark">RxKit</h1>
            <p className="rx-about-hero-tagline">Clinical Tools for Optometry</p>
            <p className="rx-about-hero-desc">
              RxKit is a collection of clinical tools for everyday optometric practice —
              calculators, quick reference material, and testing pathways, built to work
              offline and stay out of the way during a clinic session.
            </p>
          </div>
        </div>

        <div className="rx-about-creator-card">
          <p className="rx-about-eyebrow">About the Creator</p>
          <p className="rx-about-creator-name">Yulia Shalev</p>
          <p className="rx-about-creator-title">Optometrist &amp; Software Developer</p>
          <p className="rx-about-bio">
            I&rsquo;m an optometrist and software developer with professional experience
            in both clinical practice and software development. I hold a B.Sc. in
            Optometry and an M.Sc. in Computer Science.
          </p>
          <p className="rx-about-bio">
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
            <ExternalLinkIcon size={14} />
          </a>
        </div>

        <div className="rx-about-disclaimer">
          <div className="rx-about-disclaimer-head">
            <ShieldIcon size={20} className="rx-about-disclaimer-icon" />
            <p className="rx-about-disclaimer-title">Clinical Disclaimer</p>
          </div>
          <div className="rx-about-disclaimer-text">
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

        <div className="rx-about-divider" />

        <div className="rx-about-footer">
          <p className="rx-about-footer-name">RxKit</p>
          <p className="rx-about-footer-line">For eye care professionals</p>
          <HeartIcon size={16} className="rx-about-footer-heart" />
        </div>
      </div>
    </IonContent>
  </IonPage>
);

export default About;
