import AnatomyModelArPage from "./AnatomyModelArPage";
import digestiveSystemIcon from "../test_diagnostic_systeme/assets/digestive_system icon.png";

type DigestiveSystemArPageProps = {
  experienceTitle: string;
  language: string;
  onBack: () => void;
  theme: string;
};

const DigestiveSystemArPage: React.FC<DigestiveSystemArPageProps> = ({
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
    experiencePath="test_diagnostic_systeme"
    hintIcon={digestiveSystemIcon}
    hintCopy={{
      en: {
        title: "Digestive System",
        description:
          "An interactive model that shows the main digestive organs with guided notes to help you understand each structure.",
      },
      ar: {
        title:
          "\u0627\u0644\u062c\u0647\u0627\u0632 \u0627\u0644\u0647\u0636\u0645\u064a",
        description:
          "\u0646\u0645\u0648\u0630\u062c \u062a\u0641\u0627\u0639\u0644\u064a \u064a\u0639\u0631\u0636 \u0627\u0644\u0623\u0639\u0636\u0627\u0621 \u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629 \u0644\u0644\u0647\u0636\u0645 \u0645\u0639 \u0645\u0644\u0627\u062d\u0638\u0627\u062a \u0644\u0645\u0633\u0627\u0639\u062f\u062a\u0643 \u0639\u0644\u0649 \u0641\u0647\u0645 \u0648\u0638\u0627\u0626\u0641 \u0643\u0644 \u062c\u0632\u0621.",
      },
    }}
  />
);

export default DigestiveSystemArPage;
