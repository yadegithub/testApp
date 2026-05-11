import { IonContent, IonIcon, IonPage } from "@ionic/react";
import {
  arrowBack,
  checkmarkCircleOutline,
  helpCircleOutline,
  timeOutline,
} from "ionicons/icons";
import { useEffect, useMemo, useState } from "react";
import heartIcon from "../test_heart/assets/heart-icon.jpeg";
import "./HeartArPage.css";

const QUIZ_DELAY_SECONDS = 180;

type QuizQuestion = {
  id: string;
  prompt: string;
  options: Array<{
    id: string;
    label: string;
    isCorrect: boolean;
  }>;
};

type HeartArPageProps = {
  experienceTitle: string;
  language: string;
  onBack: () => void;
  theme: string;
};

const HeartArPage: React.FC<HeartArPageProps> = ({
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
  const [timeLeft, setTimeLeft] = useState(QUIZ_DELAY_SECONDS);
  const [isQuizVisible, setIsQuizVisible] = useState(false);
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const copy = useMemo(
    () =>
      resolvedLanguage === "ar"
        ? {
            back: "\u0627\u0644\u0639\u0648\u062f\u0629",
            continueAr: "\u0645\u062a\u0627\u0628\u0639\u0629 \u0627\u0644\u0639\u0631\u0636",
            quizActive: "\u0627\u062e\u062a\u0628\u0627\u0631 \u0627\u0644\u0642\u0644\u0628 \u062c\u0627\u0647\u0632",
            quizComplete:
              "\u062a\u0645 \u0625\u0643\u0645\u0627\u0644 \u0627\u062e\u062a\u0628\u0627\u0631 \u0627\u0644\u0642\u0644\u0628",
            quizEyebrow: "\u062a\u0642\u064a\u064a\u0645 \u0633\u0631\u064a\u0639",
            quizIntro:
              "\u0628\u0639\u062f \u0645\u0631\u0648\u0631 \u062b\u0644\u0627\u062b \u062f\u0642\u0627\u0626\u0642\u060c \u062d\u0627\u0646 \u0627\u0644\u0648\u0642\u062a \u0644\u0644\u0625\u062c\u0627\u0628\u0629 \u0639\u0646 \u0623\u0633\u0626\u0644\u0629 \u0633\u0631\u064a\u0639\u0629 \u062d\u0648\u0644 \u0627\u0644\u0642\u0644\u0628.",
            quizNote:
              "\u0623\u062c\u0628 \u0639\u0646 \u062c\u0645\u064a\u0639 \u0627\u0644\u0623\u0633\u0626\u0644\u0629 \u0642\u0628\u0644 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0627\u062e\u062a\u0628\u0627\u0631.",
            quizResult: "\u0623\u062d\u0631\u0632\u062a {score} \u0645\u0646 {total}.",
            quizTimer: "\u0627\u0644\u0627\u062e\u062a\u0628\u0627\u0631 \u0628\u0639\u062f",
            quizTitle: "\u0627\u0633\u062a\u0628\u064a\u0627\u0646 \u0627\u0644\u0642\u0644\u0628 \u0627\u0644\u0628\u0634\u0631\u064a",
            hintTitle: "\u0642\u0644\u0628 \u0627\u0644\u0625\u0646\u0633\u0627\u0646",
            hintDescription:
              "\u0627\u0645\u0633\u062d \u0631\u0645\u0632 QR \u0648\u0636\u0639 \u0627\u0644\u0642\u0644\u0628 \u062b\u0645 \u0627\u0641\u062d\u0635 \u0627\u0644\u0623\u0630\u064a\u0646\u064a\u0646 \u0648\u0627\u0644\u0628\u0637\u064a\u0646\u064a\u0646 \u0648\u0627\u0644\u0623\u0648\u0639\u064a\u0629 \u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629.",
            submitQuiz: "\u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0625\u062c\u0627\u0628\u0627\u062a",
          }
        : {
            back: "Go back",
            continueAr: "Continue AR",
            quizActive: "Heart quiz ready",
            quizComplete: "Heart quiz completed",
            quizEyebrow: "Quick check",
            quizIntro:
              "Three minutes have passed. Answer a short questionnaire about the human heart.",
            quizNote:
              "Answer every question before submitting the quiz.",
            quizResult: "You scored {score} out of {total}.",
            quizTimer: "Quiz in",
            quizTitle: "Human Heart Questionnaire",
            hintTitle: "Human Heart",
            hintDescription:
              "Scan the QR code, place the heart, then inspect the atria, ventricles and major vessels.",
            submitQuiz: "Submit answers",
          },
    [resolvedLanguage],
  );

  const questions = useMemo<QuizQuestion[]>(
    () =>
      resolvedLanguage === "ar"
        ? [
            {
              id: "left-ventricle",
              prompt:
                "\u0623\u064a \u062d\u062c\u0631\u0629 \u0641\u064a \u0627\u0644\u0642\u0644\u0628 \u062a\u0636\u062e \u0627\u0644\u062f\u0645 \u0627\u0644\u063a\u0646\u064a \u0628\u0627\u0644\u0623\u0643\u0633\u062c\u064a\u0646 \u0625\u0644\u0649 \u0633\u0627\u0626\u0631 \u0627\u0644\u062c\u0633\u0645\u061f",
              options: [
                {
                  id: "a",
                  label: "\u0627\u0644\u0628\u0637\u064a\u0646 \u0627\u0644\u0623\u064a\u0633\u0631",
                  isCorrect: true,
                },
                {
                  id: "b",
                  label: "\u0627\u0644\u0623\u0630\u064a\u0646 \u0627\u0644\u0623\u064a\u0645\u0646",
                  isCorrect: false,
                },
                {
                  id: "c",
                  label: "\u0627\u0644\u0628\u0637\u064a\u0646 \u0627\u0644\u0623\u064a\u0645\u0646",
                  isCorrect: false,
                },
              ],
            },
            {
              id: "aorta",
              prompt:
                "\u0645\u0627 \u0627\u0633\u0645 \u0627\u0644\u0648\u0639\u0627\u0621 \u0627\u0644\u062f\u0645\u0648\u064a \u0627\u0644\u0631\u0626\u064a\u0633\u064a \u0627\u0644\u0630\u064a \u064a\u062d\u0645\u0644 \u0627\u0644\u062f\u0645 \u0628\u0639\u064a\u062f\u0627\u064b \u0639\u0646 \u0627\u0644\u0642\u0644\u0628\u061f",
              options: [
                {
                  id: "a",
                  label: "\u0627\u0644\u0648\u0631\u064a\u062f \u0627\u0644\u0623\u062c\u0648\u0641",
                  isCorrect: false,
                },
                {
                  id: "b",
                  label: "\u0627\u0644\u0623\u0628\u0647\u0631",
                  isCorrect: true,
                },
                {
                  id: "c",
                  label: "\u0627\u0644\u0634\u0631\u064a\u0627\u0646 \u0627\u0644\u0631\u0626\u0648\u064a",
                  isCorrect: false,
                },
              ],
            },
            {
              id: "right-side",
              prompt:
                "\u0645\u0627 \u0627\u0644\u0648\u0638\u064a\u0641\u0629 \u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629 \u0644\u0644\u062c\u0627\u0646\u0628 \u0627\u0644\u0623\u064a\u0645\u0646 \u0645\u0646 \u0627\u0644\u0642\u0644\u0628\u061f",
              options: [
                {
                  id: "a",
                  label:
                    "\u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u062f\u0645 \u0627\u0644\u0641\u0642\u064a\u0631 \u0628\u0627\u0644\u0623\u0643\u0633\u062c\u064a\u0646 \u0625\u0644\u0649 \u0627\u0644\u0631\u0626\u062a\u064a\u0646",
                  isCorrect: true,
                },
                {
                  id: "b",
                  label:
                    "\u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u062f\u0645 \u0625\u0644\u0649 \u0627\u0644\u062f\u0645\u0627\u063a \u0645\u0628\u0627\u0634\u0631\u0629",
                  isCorrect: false,
                },
                {
                  id: "c",
                  label:
                    "\u0627\u0644\u062a\u062d\u0643\u0645 \u0641\u064a \u0636\u0631\u0628\u0627\u062a \u0627\u0644\u0642\u0644\u0628",
                  isCorrect: false,
                },
              ],
            },
          ]
        : [
            {
              id: "left-ventricle",
              prompt:
                "Which chamber pumps oxygen-rich blood to the rest of the body?",
              options: [
                {
                  id: "a",
                  label: "Left ventricle",
                  isCorrect: true,
                },
                {
                  id: "b",
                  label: "Right atrium",
                  isCorrect: false,
                },
                {
                  id: "c",
                  label: "Right ventricle",
                  isCorrect: false,
                },
              ],
            },
            {
              id: "aorta",
              prompt:
                "What is the name of the main vessel that carries blood away from the heart?",
              options: [
                {
                  id: "a",
                  label: "Vena cava",
                  isCorrect: false,
                },
                {
                  id: "b",
                  label: "Aorta",
                  isCorrect: true,
                },
                {
                  id: "c",
                  label: "Pulmonary artery",
                  isCorrect: false,
                },
              ],
            },
            {
              id: "right-side",
              prompt: "What does the right side of the heart mainly do?",
              options: [
                {
                  id: "a",
                  label: "Sends oxygen-poor blood to the lungs",
                  isCorrect: true,
                },
                {
                  id: "b",
                  label: "Sends blood straight to the brain",
                  isCorrect: false,
                },
                {
                  id: "c",
                  label: "Controls the heart rhythm directly",
                  isCorrect: false,
                },
              ],
            },
          ],
    [resolvedLanguage],
  );

  const formattedTime = useMemo(() => {
    const minutes = String(Math.floor(timeLeft / 60)).padStart(2, "0");
    const seconds = String(timeLeft % 60).padStart(2, "0");

    return `${minutes}:${seconds}`;
  }, [timeLeft]);

  const hasAnsweredEveryQuestion = questions.every(
    (question) => answers[question.id],
  );

  const quizSummary =
    quizScore === null
      ? copy.quizNote
      : copy.quizResult
          .replace("{score}", String(quizScore))
          .replace("{total}", String(questions.length));

  useEffect(() => {
    setTimeLeft(QUIZ_DELAY_SECONDS);
    setIsQuizVisible(false);
    setIsQuizCompleted(false);
    setQuizScore(null);
    setAnswers({});
  }, [experienceTitle, resolvedLanguage, theme]);

  useEffect(() => {
    if (isQuizVisible || isQuizCompleted) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setTimeLeft((currentTime) => {
        if (currentTime <= 1) {
          window.clearInterval(intervalId);
          setIsQuizVisible(true);
          return 0;
        }

        return currentTime - 1;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [isQuizCompleted, isQuizVisible]);

  const handleAnswerChange = (questionId: string, optionId: string) => {
    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      [questionId]: optionId,
    }));
  };

  const handleQuizSubmit = () => {
    if (!hasAnsweredEveryQuestion) {
      return;
    }

    const nextScore = questions.reduce((score, question) => {
      const selectedOption = question.options.find(
        (option) => option.id === answers[question.id],
      );

      return selectedOption?.isCorrect ? score + 1 : score;
    }, 0);

    setQuizScore(nextScore);
  };

  const handleQuizClose = () => {
    setIsQuizVisible(false);
    setIsQuizCompleted(true);
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
            src={`/test_heart/indexx.html?${searchParams.toString()}`}
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

            <div className="heart-ar-hint-strip" aria-hidden="true">
              <img src={heartIcon} alt={copy.hintTitle} />
              <div>
                <strong>{copy.hintTitle}</strong>
                <span>{copy.hintDescription}</span>
              </div>
            </div>

            <div className="heart-ar-quiz-pill-wrap">
              <div
                className={`heart-ar-quiz-pill ${
                  isQuizCompleted ? "heart-ar-quiz-pill--done" : ""
                }`}
              >
                <IonIcon
                  icon={isQuizCompleted ? checkmarkCircleOutline : timeOutline}
                />
                <span>
                  {isQuizCompleted
                    ? copy.quizComplete
                    : isQuizVisible
                      ? copy.quizActive
                      : `${copy.quizTimer} ${formattedTime}`}
                </span>
              </div>
            </div>

            {isQuizVisible ? (
              <div
                className="heart-ar-quiz-layer"
                role="dialog"
                aria-modal="true"
                aria-labelledby="heart-ar-quiz-title"
              >
                <div className="heart-ar-quiz-card">
                  <div className="heart-ar-quiz-head">
                    <span className="heart-ar-quiz-eyebrow">
                      <IonIcon icon={helpCircleOutline} />
                      {copy.quizEyebrow}
                    </span>
                    <h2 id="heart-ar-quiz-title">{copy.quizTitle}</h2>
                    <p>{copy.quizIntro}</p>
                  </div>

                  <div className="heart-ar-quiz-list">
                    {questions.map((question, index) => (
                      <section
                        key={question.id}
                        className="heart-ar-quiz-question"
                      >
                        <strong>
                          {index + 1}. {question.prompt}
                        </strong>

                        <div className="heart-ar-quiz-options">
                          {question.options.map((option) => {
                            const isSelected =
                              answers[question.id] === option.id;
                            const optionClassNames = [
                              "heart-ar-quiz-option",
                              isSelected
                                ? "heart-ar-quiz-option--selected"
                                : "",
                              quizScore !== null && option.isCorrect
                                ? "heart-ar-quiz-option--correct"
                                : "",
                              quizScore !== null &&
                              isSelected &&
                              !option.isCorrect
                                ? "heart-ar-quiz-option--wrong"
                                : "",
                            ]
                              .filter(Boolean)
                              .join(" ");

                            return (
                              <label
                                key={option.id}
                                className={optionClassNames}
                              >
                                <input
                                  type="radio"
                                  name={question.id}
                                  value={option.id}
                                  checked={isSelected}
                                  disabled={quizScore !== null}
                                  onChange={() =>
                                    handleAnswerChange(question.id, option.id)
                                  }
                                />
                                <span>{option.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      </section>
                    ))}
                  </div>

                  <div className="heart-ar-quiz-footer">
                    <p
                      className={`heart-ar-quiz-summary ${
                        quizScore !== null
                          ? "heart-ar-quiz-summary--scored"
                          : ""
                      }`}
                    >
                      {quizSummary}
                    </p>

                    <button
                      type="button"
                      className="heart-ar-quiz-button"
                      disabled={quizScore === null && !hasAnsweredEveryQuestion}
                      onClick={
                        quizScore === null ? handleQuizSubmit : handleQuizClose
                      }
                    >
                      {quizScore === null ? copy.submitQuiz : copy.continueAr}
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default HeartArPage;
