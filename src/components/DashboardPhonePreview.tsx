import { IonIcon } from "@ionic/react";
import { arrowForward, menuOutline, playCircle } from "ionicons/icons";
import geographyImage from "../assets/images/geography.jpg";
import historyImage from "../assets/images/history.jpg";
import humanLungImage from "../assets/images/corps humain.jpg";
import physicsImage from "../assets/images/physics.jpg";
import ProfileShortcut from "../components/ProfileShortcut";
import {
  featuredExperiences,
  subjects,
  type SubjectId,
} from "../data/arData";
import { getExperienceCopy, getSubjectCopy } from "../i18n/appCopy";
import { useAppSettings } from "../settings/AppSettingsContext";

const subjectImageMap: Record<SubjectId, string> = {
  biology: humanLungImage,
  physics: physicsImage,
  history: historyImage,
  geography: geographyImage,
};

const DashboardPhonePreview: React.FC = () => {
  const { settings } = useAppSettings();
  const isArabic = settings.language === "ar";
  const copy = isArabic
    ? {
        eyebrow: "فصل دراسي غامر",
        profile: "الملف الشخصي",
        title: "تعلّم مع مشاهد ثلاثية الأبعاد مصممة للواقع الممعزز.",
        subtitle: "ابدأ بالعلوم ثم افتح التاريخ والجغرافيا.",
        openDemo: "افتح العرض",
        explore: "استكشف",
        subjects: "المواد",
        viewAll: "عرض الكل",
        featured: "مميز",
        featuredTitle: "تجارب AR المميزة",
      }
    : {
        eyebrow: "Immersive classroom",
        profile: "Profile",
        title: "Learn with 3D scenes built for mobile AR.",
        subtitle: "Start with science, then open history and geography in AR.",
        openDemo: "Open demo",
        explore: "Explore",
        subjects: "Subjects",
        viewAll: "View all",
        featured: "Featured",
        featuredTitle: "Featured AR Experiences",
      };

  return (
    <div className="screen screen--dashboard landing-dashboard-preview" dir={isArabic ? "rtl" : "ltr"}>
      <div className="screen__ambient screen__ambient--left" />
      <div className="screen__ambient screen__ambient--right" />

      <div className="topbar topbar--light">
        <button type="button" className="icon-button" aria-label="Menu">
          <IonIcon icon={menuOutline} />
        </button>

        <div className="brand-lockup">
          <div className="brand-copy">
            <span className="brand-copy__eyebrow">{copy.eyebrow}</span>
            <strong>AR Learn</strong>
          </div>
        </div>

        <ProfileShortcut label={copy.profile} />
      </div>

      <section className="spotlight-card">
        <div>
          <h1>{copy.title}</h1>
          <p>{copy.subtitle}</p>
        </div>

        <button type="button" className="pill-action">
          {copy.openDemo}
          <IonIcon icon={arrowForward} />
        </button>
      </section>

      <div className="section-head">
        <div>
          <span className="section-head__eyebrow">{copy.explore}</span>
          <h2>{copy.subjects}</h2>
        </div>
        <button type="button" className="ghost-button">
          {copy.viewAll}
        </button>
      </div>

      <div className="subject-grid">
        {subjects.map((subject) => (
          <button
            key={subject.id}
            type="button"
            className="subject-card"
            style={{
              backgroundImage: `url(${subjectImageMap[subject.id]})`,
              backgroundPosition: "center",
              backgroundSize: "cover",
              backgroundRepeat: "no-repeat",
            }}
          >
            <div className="subject-card__overlay">
              <span className="subject-card__title">
                {getSubjectCopy(subject.id, settings.language).name}
              </span>
            </div>
          </button>
        ))}
      </div>

      <div className="section-head">
        <div>
          <span className="section-head__eyebrow">{copy.featured}</span>
          <h2>{copy.featuredTitle}</h2>
        </div>
      </div>

      <div className="featured-strip">
        {featuredExperiences.slice(0, 3).map((experience) => {
          const localizedExperience =
            getExperienceCopy(experience.id, settings.language) ?? experience;

          return (
            <button
              key={experience.id}
              type="button"
              className="featured-card featured-card--photo"
              style={{
                backgroundImage: `linear-gradient(180deg, rgba(8, 15, 27, 0.08) 0%, rgba(8, 15, 27, 0.72) 100%), url(${experience.image})`,
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                backgroundSize: "cover",
              }}
            >
              <span className="featured-card__play" aria-hidden="true">
                <IonIcon icon={playCircle} />
              </span>
              <div className="featured-card__copy">
                <span>{localizedExperience.duration}</span>
                <strong>{localizedExperience.title}</strong>
                <p>{localizedExperience.teaser}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardPhonePreview;
