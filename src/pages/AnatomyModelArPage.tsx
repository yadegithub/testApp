import { IonContent, IonIcon, IonPage } from "@ionic/react";
import { arrowBack } from "ionicons/icons";
import "./HeartArPage.css";

type HintCopy = {
  en: {
    title: string;
    description: string;
  };
  ar?: {
    title: string;
    description: string;
  };
};

type AnatomyModelArPageProps = {
  experienceTitle: string;
  language: string;
  onBack: () => void;
  theme: string;
  experiencePath: string;
  hintCopy: HintCopy;
  hintIcon: string;
};

const AnatomyModelArPage: React.FC<AnatomyModelArPageProps> = ({
  experienceTitle,
  language,
  onBack,
  theme,
  experiencePath,
  hintCopy,
  hintIcon,
}) => {
  const resolvedLanguage = language === "ar" ? "ar" : "en";
  const searchParams = new URLSearchParams({
    lang: resolvedLanguage,
    theme: theme === "light" ? "light" : "dark",
  });

  const localizedHint = hintCopy[resolvedLanguage] ?? hintCopy.en;
  const copy =
    resolvedLanguage === "ar"
      ? {
          back: "\u0627\u0644\u0639\u0648\u062f\u0629",
        }
      : {
          back: "Go back",
        };

  return (
    <IonPage>
      <IonContent fullscreen scrollY={false} className="heart-ar-content">
        <div
          className="heart-ar-shell"
          dir={resolvedLanguage === "ar" ? "rtl" : "ltr"}
        >
          <iframe
            className="heart-ar-frame"
            title={experienceTitle}
            src={`/${experiencePath}/indexx.html?${searchParams.toString()}`}
            allow="camera; microphone; autoplay; fullscreen"
            allowFullScreen
          />

          <div className="heart-ar-overlay">
            <div className="heart-ar-topbar">
              <button
                type="button"
                className="icon-button icon-button--dark"
                aria-label={copy.back}
                onClick={onBack}
              >
                <IonIcon icon={arrowBack} />
              </button>

              <div className="heart-ar-title-pill">{experienceTitle}</div>

              <span className="heart-ar-topbar__spacer" aria-hidden="true" />
            </div>

            <div className="heart-ar-hint-strip" aria-hidden="true">
              <img src={hintIcon} alt={localizedHint.title} />
              <div>
                <strong>{localizedHint.title}</strong>
                <span>{localizedHint.description}</span>
              </div>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AnatomyModelArPage;
