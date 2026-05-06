import kidneyIcon from "../test_kidney/assets/Human kidney icon.jpg";
import AnatomyModelArPage from "./AnatomyModelArPage";

type KidneyArPageProps = {
  experienceTitle: string;
  language: string;
  onBack: () => void;
  theme: string;
};

const KidneyArPage: React.FC<KidneyArPageProps> = ({
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
    experiencePath="test_kidney"
    hintIcon={kidneyIcon}
    hintCopy={{
      en: {
        title: "Human Kidney",
        description:
          "Inspect the kidney layers and vessels in AR to understand how filtration and urine flow are organized.",
      },
      ar: {
        title: "\u0643\u0644\u064a\u0629 \u0627\u0644\u0625\u0646\u0633\u0627\u0646",
        description:
          "\u0627\u0641\u062d\u0635 \u0637\u0628\u0642\u0627\u062a \u0627\u0644\u0643\u0644\u064a\u0629 \u0648\u0627\u0644\u0623\u0648\u0639\u064a\u0629 \u0641\u064a \u0627\u0644\u0648\u0627\u0642\u0639 \u0627\u0644\u0645\u0639\u0632\u0632 \u0644\u0641\u0647\u0645 \u0643\u064a\u0641 \u062a\u0646\u0638\u0645 \u0639\u0645\u0644\u064a\u0629 \u0627\u0644\u062a\u0631\u0634\u064a\u062d \u0648\u0645\u0631\u0648\u0631 \u0627\u0644\u0628\u0648\u0644.",
      },
    }}
  />
);

export default KidneyArPage;
