import skinIcon from "../test_human_anatomy_skin/assets/human skin icon.jpg";
import AnatomyModelArPage from "./AnatomyModelArPage";

type HumanSkinArPageProps = {
  experienceTitle: string;
  language: string;
  onBack: () => void;
  theme: string;
};

const HumanSkinArPage: React.FC<HumanSkinArPageProps> = ({
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
    experiencePath="test_human_anatomy_skin"
    hintIcon={skinIcon}
    hintCopy={{
      en: {
        title: "Human Skin",
        description:
          "Explore the main layers of the skin and the structures that protect, sense and regulate the body.",
      },
      ar: {
        title: "\u062c\u0644\u062f \u0627\u0644\u0625\u0646\u0633\u0627\u0646",
        description:
          "\u0627\u0633\u062a\u0643\u0634\u0641 \u0637\u0628\u0642\u0627\u062a \u0627\u0644\u062c\u0644\u062f \u0648\u0627\u0644\u0628\u0646\u0649 \u0627\u0644\u062a\u064a \u062a\u062d\u0645\u064a \u0627\u0644\u062c\u0633\u0645 \u0648\u062a\u0633\u0627\u0639\u062f \u0641\u064a \u0627\u0644\u0625\u062d\u0633\u0627\u0633 \u0648\u062a\u0646\u0638\u064a\u0645 \u0627\u0644\u062d\u0631\u0627\u0631\u0629.",
      },
    }}
  />
);

export default HumanSkinArPage;
