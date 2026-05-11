import { IonContent, IonIcon, IonPage } from "@ionic/react";
import { arrowBack, optionsOutline, searchOutline } from "ionicons/icons";
import { useState } from "react";
import { useHistory, useLocation } from "react-router-dom";
import {
  experiences,
  isSubjectId,
  subjects,
  type SubjectId,
} from "../data/arData";
import { getExperienceCopy, getSubjectCopy } from "../i18n/appCopy";
import { useAppSettings } from "../settings/AppSettingsContext";

type SubjectFilter = SubjectId | "all";

const LibraryPage: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const { settings } = useAppSettings();
  const [query, setQuery] = useState("");
  const isArabic = settings.language === "ar";
  const copy = isArabic
    ? {
        title: "مكتبة الواقع المعزز",
        back: "العودة",
        searchPlaceholder: "ابحث عن درس أو موضوع",
        browseSubjects: "تصفح المواد",
        all: "الكل",
        modulesReady: "وحدات جاهزة",
        launch: "افتح AR",
      }
    : {
        title: "AR Library",
        back: "Back",
        searchPlaceholder: "Search lessons or topics",
        browseSubjects: "Browse subjects",
        all: "All",
        modulesReady: "modules ready",
        launch: "Launch AR",
      };
  const filterOptions: Array<{ label: string; value: SubjectFilter }> = [
    { label: copy.all, value: "all" },
    ...subjects.map((subject) => ({
      label: getSubjectCopy(subject.id, settings.language).name,
      value: subject.id,
    })),
  ];

  const params = new URLSearchParams(location.search);
  const subjectFilter = params.get("subject");
  const activeFilter: SubjectFilter = isSubjectId(subjectFilter)
    ? subjectFilter
    : "all";

  const handleBack = () => {
    if (window.history.length > 1) {
      history.goBack();
      return;
    }

    history.replace("/tabs/dashboard");
  };

  const visibleExperiences = experiences.filter((experience) => {
    const matchesFilter =
      activeFilter === "all" || experience.subjectId === activeFilter;
    const localizedExperience =
      getExperienceCopy(experience.id, settings.language) ?? experience;
    const text = `${localizedExperience.title} ${localizedExperience.shortDescription} ${localizedExperience.teaser}`;
    const matchesQuery = text.toLowerCase().includes(query.trim().toLowerCase());

    return matchesFilter && matchesQuery;
  });

  const setFilter = (value: SubjectFilter) => {
    if (value === "all") {
      history.replace("/tabs/library");
      return;
    }

    history.replace(`/tabs/library?subject=${value}`);
  };

  return (
    <IonPage>
      <IonContent fullscreen className="app-page">
        <div
          className="screen screen--library"
          dir={isArabic ? "rtl" : "ltr"}
        >
          <div className="screen__ambient screen__ambient--dark-left" />
          <div className="screen__ambient screen__ambient--dark-right" />

          <div className="topbar topbar--dark library-header">
            <button
              type="button"
              className="icon-button icon-button--dark"
              aria-label={copy.back}
              onClick={handleBack}
            >
              <IonIcon icon={arrowBack} />
            </button>

            <div className="brand-copy brand-copy--stacked brand-copy--centered library-header__copy">
              <strong>{copy.title}</strong>
            </div>

            <span className="topbar__spacer" aria-hidden="true" />
          </div>

          <div className="library-search">
            <label className="search-shell" htmlFor="library-search">
              <IonIcon icon={searchOutline} />
              <input
                id="library-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={copy.searchPlaceholder}
              />
            </label>

            <button
              type="button"
              className="filter-button"
              aria-label={copy.browseSubjects}
              onClick={() => setFilter(activeFilter === "all" ? "biology" : "all")}
            >
              <IonIcon icon={optionsOutline} />
            </button>
          </div>

          <div className="filter-strip">
            {filterOptions.map((filter) => (
              <button
                key={filter.value}
                type="button"
                className={`filter-chip ${
                  activeFilter === filter.value ? "filter-chip--active" : ""
                }`}
                onClick={() => setFilter(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="library-results">
            <span>
              {visibleExperiences.length} {copy.modulesReady}
            </span>
          </div>

          <div className="library-list">
            {visibleExperiences.map((experience) => {
              const localizedExperience =
                getExperienceCopy(experience.id, settings.language) ?? experience;

              return (
                <article key={experience.id} className="library-card">
                  <div className="experience-art experience-art--photo">
                    <img
                      className="experience-art__image"
                      src={experience.image}
                      alt={localizedExperience.title}
                    />
                    <span className="experience-art__shine" />
                  </div>

                  <div className="library-card__body">
                    <div className="library-card__copy">
                      <strong>{localizedExperience.title}</strong>
                      <p>{localizedExperience.shortDescription}</p>
                    </div>

                    <div className="library-card__footer">
                      <button
                        type="button"
                        className="launch-chip"
                        onClick={() => history.push(`/viewer/${experience.id}`)}
                      >
                        {copy.launch}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default LibraryPage;
