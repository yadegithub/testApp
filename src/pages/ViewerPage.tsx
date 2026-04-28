import { IonContent, IonIcon, IonPage } from "@ionic/react";
import {
  arrowBack,
  informationCircleOutline,
  refreshOutline,
  resizeOutline,
  textOutline,
  volumeHighOutline,
} from "ionicons/icons";
import { useEffect, useState } from "react";
import { Redirect, useHistory, useParams } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import SceneArtwork from "../components/SceneArtwork";
import { getExperienceById, getSubjectById } from "../data/arData";
import { getExperienceCopy, getSubjectCopy } from "../i18n/appCopy";
import HeartArPage from "./HeartArPage";
import PendulumArPage from "./PendulumArPage";
import { recordExperienceLaunch } from "../profile/userProgressStore";
import { useAppSettings } from "../settings/AppSettingsContext";
import SolarSystemArPage from "./SolarSystemArPage";

type ToolMode = "rotate" | "scale";

const ViewerPage: React.FC = () => {
  const history = useHistory();
  const { experienceId } = useParams<{ experienceId: string }>();
  const { user } = useAuth();
  const { settings } = useAppSettings();
  const [toolMode, setToolMode] = useState<ToolMode>("rotate");
  const [showLabels, setShowLabels] = useState(true);

  const experience = getExperienceById(experienceId);

  useEffect(() => {
    if (user && experience) {
      recordExperienceLaunch(user, experience);
    }
  }, [experience, user]);

  if (!experience) {
    return <Redirect to="/tabs/library" />;
  }

  const subject = getSubjectById(experience.subjectId);
  const localizedExperience =
    getExperienceCopy(experience.id, settings.language) ?? experience;
  const localizedSubject = subject
    ? getSubjectCopy(subject.id, settings.language)
    : null;
  const isArabic = settings.language === "ar";
  const handleBack = () => {
    if (window.history.length > 1) {
      history.goBack();
      return;
    }

    history.replace("/tabs/library");
  };

  if (experience.id === "human-heart") {
    return (
      <HeartArPage
        experienceTitle={localizedExperience.title}
        language={settings.language}
        onBack={handleBack}
        theme={settings.theme}
      />
    );
  }

  if (experience.id === "solar-system-model") {
    return (
      <SolarSystemArPage
        experienceTitle={localizedExperience.title}
        language={settings.language}
        onBack={handleBack}
        theme={settings.theme}
      />
    );
  }

  if (experience.id === "simple-pendulum") {
    return (
      <PendulumArPage
        experienceTitle={localizedExperience.title}
        language={settings.language}
        onBack={handleBack}
        theme={settings.theme}
      />
    );
  }

  const copy = isArabic
    ? {
        module: "ÙˆØ­Ø¯Ø©",
        moreInfo: "Ù…Ø²ÙŠØ¯ Ù…Ù† Ø§Ù„Ù…Ø¹Ù„ÙˆÙ…Ø§Øª",
        subjectInAr: "ÙÙŠ Ø§Ù„ÙˆØ§Ù‚Ø¹ Ø§Ù„Ù…Ø¹Ø²Ø²",
        rotate: "ØªØ¯ÙˆÙŠØ±",
        scale: "ØªØ­Ø¬ÙŠÙ…",
        labelsOn: "Ø§Ù„ØªØ³Ù…ÙŠØ§Øª Ù…ÙØ¹Ù„Ø©",
        labelsOff: "Ø§Ù„ØªØ³Ù…ÙŠØ§Øª Ù…ØªÙˆÙ‚ÙØ©",
        focusPoint: "Ù†Ù‚Ø·Ø© Ø§Ù„ØªØ±ÙƒÙŠØ²",
        readMore: "Ø§Ù‚Ø±Ø£ Ø§Ù„Ù…Ø²ÙŠØ¯",
        audioGuide: "ØªØ´ØºÙŠÙ„ Ø§Ù„Ø¯Ù„ÙŠÙ„ Ø§Ù„ØµÙˆØªÙŠ",
        ar: "Ø§Ù„ÙˆØ§Ù‚Ø¹ Ø§Ù„Ù…Ø¹Ø²Ø²",
        goBack: "Ø§Ù„Ø¹ÙˆØ¯Ø©",
      }
    : {
        module: "module",
        moreInfo: "More information",
        subjectInAr: "in AR",
        rotate: "Rotate",
        scale: "Scale",
        labelsOn: "Labels On",
        labelsOff: "Labels Off",
        focusPoint: "Focus point",
        readMore: "Read More",
        audioGuide: "Play audio guide",
        ar: "AR",
        goBack: "Go back",
      };

  return (
    <IonPage>
      <IonContent fullscreen className="app-page viewer-content">
        <div
          className={`screen screen--viewer screen--viewer-${experience.artwork}`}
          dir={isArabic ? "rtl" : "ltr"}
        >
          <div className="viewer-fog viewer-fog--one" />
          <div className="viewer-fog viewer-fog--two" />

          <div className="topbar topbar--dark">
            <button
              type="button"
              className="icon-button icon-button--dark"
              aria-label={copy.goBack}
              onClick={handleBack}
            >
              <IonIcon icon={arrowBack} />
            </button>

            <div className="brand-copy brand-copy--stacked brand-copy--centered">
              <span className="brand-copy__eyebrow">
                {(localizedSubject?.name ?? copy.ar)} {copy.module}
              </span>
              <strong>{localizedExperience.title}</strong>
            </div>

            <button
              type="button"
              className="icon-button icon-button--dark"
              aria-label={copy.moreInfo}
              onClick={() => history.push("/tabs/library")}
            >
              <IonIcon icon={informationCircleOutline} />
            </button>
          </div>

          <div className="viewer-heading">
            <span>
              {(localizedSubject?.name ?? copy.ar)} {copy.subjectInAr}
            </span>
            <h1>{localizedExperience.title.toUpperCase()}</h1>
          </div>

          <div className="viewer-stage">
            <div className="viewer-tools">
              <button
                type="button"
                className={`viewer-tool ${
                  toolMode === "rotate" ? "viewer-tool--active" : ""
                }`}
                onClick={() => setToolMode("rotate")}
              >
                <IonIcon icon={refreshOutline} />
                {copy.rotate}
              </button>
              <button
                type="button"
                className={`viewer-tool ${
                  toolMode === "scale" ? "viewer-tool--active" : ""
                }`}
                onClick={() => setToolMode("scale")}
              >
                <IonIcon icon={resizeOutline} />
                {copy.scale}
              </button>
              <button
                type="button"
                className={`viewer-tool ${
                  showLabels ? "viewer-tool--active" : ""
                }`}
                onClick={() => setShowLabels((currentValue) => !currentValue)}
              >
                <IonIcon icon={textOutline} />
                {showLabels ? copy.labelsOn : copy.labelsOff}
              </button>
            </div>

            <SceneArtwork variant={experience.artwork} showLabels={showLabels} />
          </div>

          <section className="viewer-info-card">
            <div
              className={`viewer-info-card__preview viewer-info-card__preview--${experience.artwork}`}
            >
              <span />
            </div>

            <div className="viewer-info-card__copy">
              <span className="section-head__eyebrow">{copy.focusPoint}</span>
              <strong>{localizedExperience.focusTitle}</strong>
              <p>{localizedExperience.focusCopy}</p>
            </div>

            <div className="viewer-info-card__actions">
              <button
                type="button"
                className="launch-chip"
                onClick={() => history.push("/tabs/library")}
              >
                {copy.readMore}
              </button>
              <button
                type="button"
                className="audio-button"
                aria-label={copy.audioGuide}
              >
                <IonIcon icon={volumeHighOutline} />
              </button>
            </div>
          </section>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ViewerPage;
