import AnatomyModelArPage from "./AnatomyModelArPage";
import volcanoIcon from "../test_volcano/assets/volcano_icon.png";

type VolcanoArPageProps = {
  experienceTitle: string;
  language: string;
  onBack: () => void;
  theme: string;
};

const VolcanoArPage: React.FC<VolcanoArPageProps> = ({
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
    experiencePath="test_volcano"
    hintIcon={volcanoIcon}
    hintCopy={{
      en: {
        title: "Volcano",
        description:
          "Scan the QR code, place the volcano, then inspect the crater, vent, magma chamber and lava flow.",
      },
      ar: {
        title: "\u0627\u0644\u0628\u0631\u0643\u0627\u0646",
        description:
          "\u0627\u0645\u0633\u062d \u0631\u0645\u0632 QR \u0648\u0636\u0639 \u0627\u0644\u0628\u0631\u0643\u0627\u0646 \u062b\u0645 \u0627\u0641\u062d\u0635 \u0627\u0644\u0641\u0648\u0647\u0629 \u0648\u0627\u0644\u0642\u0646\u0627\u0629 \u0648\u063a\u0631\u0641\u0629 \u0627\u0644\u0635\u0647\u0627\u0631\u0629 \u0648\u062a\u062f\u0641\u0642 \u0627\u0644\u062d\u0645\u0645.",
      },
    }}
  />
);

export default VolcanoArPage;
