import { IonContent, IonIcon, IonPage } from "@ionic/react";
import { arrowBack } from "ionicons/icons";
import "./HeartArPage.css";

type SolarSystemArPageProps = {
  experienceTitle: string;
  language: string;
  onBack: () => void;
  theme: string;
};

const SolarSystemArPage: React.FC<SolarSystemArPageProps> = ({
  experienceTitle,
  language,
  onBack,
  theme,
}) => {
  const resolvedLanguage = language === "ar" ? "ar" : "en";
  const searchParams = new URLSearchParams({
    lang: resolvedLanguage,
    theme: theme === "light" ? "light" : "dark",
  });

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
            src={`/test_solar/indexx.html?${searchParams.toString()}`}
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
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default SolarSystemArPage;