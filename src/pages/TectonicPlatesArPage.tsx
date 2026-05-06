import AnatomyModelArPage from "./AnatomyModelArPage";
import tectonicPlatesIcon from "../test_tectonic_plates/assets/tectonic_plates_icon.jpg";

type TectonicPlatesArPageProps = {
  experienceTitle: string;
  language: string;
  onBack: () => void;
  theme: string;
};

const TectonicPlatesArPage: React.FC<TectonicPlatesArPageProps> = ({
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
    experiencePath="test_tectonic_plates"
    hintIcon={tectonicPlatesIcon}
    hintCopy={{
      en: {
        title: "Tectonic Plates",
        description:
          "Explore plate collision, subduction and uplift in AR to see how Earth's surface changes over time.",
      },
      ar: {
        title: "\u0627\u0644\u0635\u0641\u0627\u0626\u062d \u0627\u0644\u062a\u0643\u062a\u0648\u0646\u064a\u0629",
        description:
          "\u0627\u0633\u062a\u0643\u0634\u0641 \u062a\u0635\u0627\u062f\u0645 \u0627\u0644\u0635\u0641\u0627\u0626\u062d \u0648\u0627\u0644\u0627\u0646\u063a\u0631\u0627\u0632 \u0648\u0627\u0631\u062a\u0641\u0627\u0639 \u0627\u0644\u0642\u0634\u0631\u0629 \u0641\u064a \u0627\u0644\u0648\u0627\u0642\u0639 \u0627\u0644\u0645\u0639\u0632\u0632 \u0644\u0641\u0647\u0645 \u0643\u064a\u0641 \u064a\u062a\u063a\u064a\u0631 \u0633\u0637\u062d \u0627\u0644\u0623\u0631\u0636.",
      },
    }}
  />
);

export default TectonicPlatesArPage;
