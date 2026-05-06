import reproductiveIcon from "../test_female_reproductive_organs-x_section/assets/female reproductive system icon.png";
import AnatomyModelArPage from "./AnatomyModelArPage";

type FemaleReproductiveSystemArPageProps = {
  experienceTitle: string;
  language: string;
  onBack: () => void;
  theme: string;
};

const FemaleReproductiveSystemArPage: React.FC<
  FemaleReproductiveSystemArPageProps
> = ({ experienceTitle, language, onBack, theme }) => (
  <AnatomyModelArPage
    experienceTitle={experienceTitle}
    language={language}
    onBack={onBack}
    theme={theme}
    experiencePath="test_female_reproductive_organs-x_section"
    hintIcon={reproductiveIcon}
    hintCopy={{
      en: {
        title: "Female Reproductive System",
        description:
          "Study the uterus, ovaries and connected pathways through a clear AR cross-section with guided notes.",
      },
      ar: {
        title:
          "\u0627\u0644\u062c\u0647\u0627\u0632 \u0627\u0644\u062a\u0646\u0627\u0633\u0644\u064a \u0627\u0644\u0623\u0646\u062b\u0648\u064a",
        description:
          "\u0627\u062f\u0631\u0633 \u0627\u0644\u0631\u062d\u0645 \u0648\u0627\u0644\u0645\u0628\u0627\u064a\u0636 \u0648\u0627\u0644\u0645\u0633\u0627\u0631\u0627\u062a \u0627\u0644\u0645\u062a\u0635\u0644\u0629 \u0645\u0646 \u062e\u0644\u0627\u0644 \u0645\u0642\u0637\u0639 \u0648\u0627\u0636\u062d \u0641\u064a \u0627\u0644\u0648\u0627\u0642\u0639 \u0627\u0644\u0645\u0639\u0632\u0632.",
      },
    }}
  />
);

export default FemaleReproductiveSystemArPage;
