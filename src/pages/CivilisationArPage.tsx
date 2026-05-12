import AnatomyModelArPage from "./AnatomyModelArPage";
import civilisationIcon from "../test_civilisation/assets/civilisation_icon.jpg";

type CivilisationArPageProps = {
  experienceTitle: string;
  language: string;
  onBack: () => void;
  theme: string;
};

const CivilisationArPage: React.FC<CivilisationArPageProps> = ({
  experienceTitle,
  language,
  onBack,
  theme,
}) => (
  <AnatomyModelArPage
    experienceTitle={experienceTitle}
    language={language}
    onBack={onBack}
    theme={theme}
    experiencePath="test_civilisation"
    hintIcon={civilisationIcon}
    hintCopy={{
      en: {
        title: "Castle of Consuegra",
        description:
          "Explore a medieval Spanish castle in AR and tap numbered labels to study its defensive features.",
      },
      ar: {
        title: "قلعة كونسويغرا",
        description:
          "استكشف قلعة إسبانية من العصور الوسطى في الواقع المعزز واضغط على الأرقام لدراسة عناصرها الدفاعية.",
      },
    }}
  />
);

export default CivilisationArPage;
