import { IonContent, IonPage } from "@ionic/react";
import { type MouseEvent, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import DashboardPhonePreview from "../components/DashboardPhonePreview";

const HEADER_OFFSET = 104;
const DEMO_VIDEO_URL = "/site-demo/demo-video.mp4";
const DEMO_QR_CODE_URL = "/site-demo/demo-qr.png";
const DEMO_URL = "https://4c69zz.csb.app/";

const features = [
  {
    title: "Lecons en RA",
    description:
      "Projetez le contenu scientifique dans le monde reel pour apprendre dans un contexte vivant.",
  },
  {
    title: "Modeles 3D",
    description:
      "Observez des structures anatomiques detaillees sous tous les angles pour une meilleure comprehension spatiale.",
  },
  {
    title: "Guidage audio",
    description:
      "Ecoutez des explications guidees pendant l'exploration pour rendre l'apprentissage plus accessible.",
  },
  {
    title: "Interaction",
    description:
      "Touchez, faites pivoter et examinez chaque modele pour apprendre de facon active.",
  },
];

const steps = [
  {
    number: "01",
    title: "Connexion",
    description: "Connectez-vous pour acceder a l'application, a votre progression et aux lecons disponibles.",
  },
  {
    number: "02",
    title: "Choisir une matiere",
    description: "Selectionnez un sujet comme la biologie ou l'anatomie dans la bibliotheque d'apprentissage.",
  },
  {
    number: "03",
    title: "Scanner le QR code",
    description: "Utilisez la camera de l'appareil pour scanner un QR code et ouvrir l'activite en realite augmentee.",
  },
  {
    number: "04",
    title: "Voir le modele 3D",
    description: "Ouvrez le modele interactif et explorez-le avec les controles tactiles et l'audio.",
  },
];

const storyLearningSteps = [
  {
    number: "01",
    title: "Apprendre a travers une histoire",
    description:
      "Chaque lecon se deroule comme une courte histoire pour relier les connaissances a une experience memorable.",
  },
  {
    number: "02",
    title: "Interagir pendant l'exploration",
    description:
      "Les eleves touchent, observent et repondent a des invites pendant l'histoire pour apprendre activement.",
  },
  {
    number: "03",
    title: "Realiser un exercice final",
    description:
      "L'activite finale aide l'eleve a explorer et exprimer ce qu'il a compris de l'histoire.",
  },
];

const subjects = [
  {
    title: "Science naturelle",
    description:
      "Decouvrez des modeles lies au corps humain, aux organes et aux systemes vivants dans un format immersif.",
  },
  {
    title: "Physique",
    description:
      "Explorez des modeles interactifs autour du mouvement, des forces, du magnetisme et d'autres notions physiques.",
  },
  {
    title: "Histoire",
    description:
      "Parcourez des scenes et des contenus immersifs pour mieux comprendre les civilisations et les epoques.",
  },
  {
    title: "Geographie",
    description:
      "Visualisez les cartes, les reliefs et les phenomenes de la Terre avec des modeles clairs et interactifs.",
  },
];

const LandingPage: React.FC = () => {
  const location = useLocation();
  const contentRef = useRef<HTMLIonContentElement | null>(null);
  const sectionHref = (sectionId: string) => `${location.pathname}#${sectionId}`;
  const getSectionOffsetTop = (section: HTMLElement) => {
    let offsetTop = section.offsetTop;
    let currentParent = section.offsetParent as HTMLElement | null;

    while (currentParent) {
      offsetTop += currentParent.offsetTop;
      currentParent = currentParent.offsetParent as HTMLElement | null;
    }

    return offsetTop;
  };

  const scrollToSection = async (
    sectionId: string,
    options?: { updateHash?: boolean }
  ) => {
    const section = document.getElementById(sectionId);

    if (!section) {
      return;
    }

    if (options?.updateHash !== false) {
      window.history.replaceState({}, "", `${location.pathname}#${sectionId}`);
    }

    const scrollElement = await contentRef.current?.getScrollElement();

    if (scrollElement && contentRef.current) {
      const sectionTop = getSectionOffsetTop(section) - HEADER_OFFSET;

      await contentRef.current.scrollToPoint(0, Math.max(0, sectionTop), 500);
      return;
    }

    const sectionTop =
      section.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;

    window.scrollTo({
      top: Math.max(0, sectionTop),
      behavior: "smooth",
    });
  };

  const handleSectionLinkClick = (
    event: MouseEvent<HTMLAnchorElement>,
    sectionId: string
  ) => {
    event.preventDefault();
    void scrollToSection(sectionId);
  };

  useEffect(() => {
    if (!location.hash) {
      return;
    }

    const sectionId = location.hash.replace("#", "");
    const section = document.getElementById(sectionId);

    if (!section) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      void scrollToSection(sectionId, { updateHash: false });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [location.hash]);

  return (
    <IonPage>
      <IonContent ref={contentRef} fullscreen className="landing-page">
        <div className="landing-page-shell relative min-h-screen overflow-hidden bg-white text-slate-900">
          <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur animate-fade-in">
            <div className="mx-auto max-w-6xl px-6 lg:px-8">
              <nav className="flex min-h-16 items-center justify-between gap-4 py-4">
                <a
                  href={sectionHref("top")}
                  onClick={(event) => handleSectionLinkClick(event, "top")}
                  className="landing-brand text-lg font-semibold tracking-tight text-slate-950 transition hover:text-slate-700"
                >
                  AR Learn
                </a>

                <div className="hidden items-center gap-8 text-sm text-slate-600 md:flex">
                  <a
                    href={sectionHref("features")}
                    className="transition hover:text-slate-950"
                    onClick={(event) => handleSectionLinkClick(event, "features")}
                  >
                    Fonctionnalites
                  </a>
                  <a
                    href={sectionHref("how-it-works")}
                    className="transition hover:text-slate-950"
                    onClick={(event) => handleSectionLinkClick(event, "how-it-works")}
                  >
                    Comment ca marche
                  </a>
                  <a
                    href={sectionHref("story-learning")}
                    className="transition hover:text-slate-950"
                    onClick={(event) => handleSectionLinkClick(event, "story-learning")}
                  >
                    Apprentissage narratif
                  </a>
                  <a
                    href={sectionHref("demo")}
                    className="transition hover:text-slate-950"
                    onClick={(event) => handleSectionLinkClick(event, "demo")}
                  >
                    Demo
                  </a>
                  <a
                    href={sectionHref("subjects")}
                    className="transition hover:text-slate-950"
                    onClick={(event) => handleSectionLinkClick(event, "subjects")}
                  >
                    Sujets
                  </a>
                </div>

                <Link
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-100"
                  to="/login"
                >
                  Se connecter
                </Link>
              </nav>
            </div>
          </header>

          <div className="mx-auto max-w-6xl px-6 pt-20 lg:px-8 lg:pt-24">
            <main id="top" className="pb-12">
              <section className="grid gap-10 pb-8 pt-2 md:pb-10 md:pt-4 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
                <div className="max-w-2xl animate-fade-up">
                  <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-slate-600 shadow-sm">
                    Plateforme educative en realite augmentee
                  </span>

                  <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                    Rendez l'apprentissage mobile plus simple.
                  </h1>

                  <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
                    Une page claire, moderne et dynamique pour presenter une experience
                    d'apprentissage immersive, interactive et adaptee au mobile.
                  </p>

                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <Link
                      className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
                      to="/register"
                    >
                      Commencer
                    </Link>
                    <Link
                      className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-900 transition hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-100"
                      to="/login"
                    >
                      Se connecter
                    </Link>
                  </div>
                </div>

                <div
                  className="landing-phone-shell mx-auto w-full max-w-md animate-fade-up"
                  style={{ animationDelay: "120ms" }}
                >
                  <div className="landing-phone-device hover-lift">
                    <div className="landing-phone-notch" aria-hidden="true" />
                    <div
                      className="landing-phone-side landing-phone-side--top"
                      aria-hidden="true"
                    />
                    <div
                      className="landing-phone-side landing-phone-side--middle"
                      aria-hidden="true"
                    />
                    <div className="landing-phone-screen">
                      <div className="landing-phone-scroll">
                        <DashboardPhonePreview />
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section id="features" className="scroll-mt-24 py-8 md:py-10">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-sm font-medium uppercase tracking-[0.16em] text-slate-500">
                      Fonctionnalites
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                      Des outils penses pour un apprentissage scientifique immersif.
                    </h2>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {features.map((feature, index) => (
                    <article
                      key={feature.title}
                      className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm animate-fade-up hover-lift"
                      style={{ animationDelay: `${index * 90}ms` }}
                    >
                      <h3 className="text-lg font-semibold tracking-tight text-slate-950">
                        {feature.title}
                      </h3>
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {feature.description}
                      </p>
                    </article>
                  ))}
                </div>
              </section>

              <section id="how-it-works" className="scroll-mt-24 py-8 md:py-10">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-sm font-medium uppercase tracking-[0.16em] text-slate-500">
                      Comment ca marche
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                      Un parcours d'apprentissage en 4 etapes.
                    </h2>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {steps.map((step, index) => (
                    <article
                      key={step.number}
                      className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm animate-fade-up hover-lift"
                      style={{ animationDelay: `${index * 90}ms` }}
                    >
                      <p className="text-sm font-medium text-slate-500">{step.number}</p>
                      <h3 className="mt-3 text-lg font-semibold tracking-tight text-slate-950">
                        {step.title}
                      </h3>
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {step.description}
                      </p>
                    </article>
                  ))}
                </div>
              </section>

              <section id="story-learning" className="scroll-mt-24 py-8 md:py-10">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-sm font-medium uppercase tracking-[0.16em] text-slate-500">
                      Apprentissage narratif interactif
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                      Des lecons qui ressemblent a une aventure guidee.
                    </h2>
                  </div>
                </div>

                <div className="mt-6 max-w-3xl">
                  <p className="text-sm leading-7 text-slate-600 sm:text-base">
                    Les eleves suivent une petite histoire, interagissent avec les scenes
                    et terminent par un exercice simple pour verifier ce qu'ils ont compris.
                  </p>
                </div>

                <div className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm animate-fade-up">
                  <div className="grid gap-6 md:grid-cols-3">
                    {storyLearningSteps.map((step, index) => (
                      <div
                        key={step.number}
                        className={[
                          "flex gap-4",
                          index > 0
                            ? "border-t border-slate-200 pt-6 md:border-l md:border-t-0 md:pl-6 md:pt-0"
                            : "",
                        ].join(" ")}
                      >
                        <div className="text-sm font-semibold text-slate-400">
                          {step.number}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold tracking-tight text-slate-950">
                            {step.title}
                          </h3>
                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section id="subjects" className="scroll-mt-24 py-8 md:py-10">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-sm font-medium uppercase tracking-[0.16em] text-slate-500">
                      Sujets
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                      Explorez les matieres disponibles dans l'application.
                    </h2>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {subjects.map((subject, index) => (
                    <article
                      key={subject.title}
                      className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm animate-fade-up hover-lift"
                      style={{ animationDelay: `${index * 90}ms` }}
                    >
                      <h3 className="text-lg font-semibold tracking-tight text-slate-950">
                        {subject.title}
                      </h3>
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {subject.description}
                      </p>
                    </article>
                  ))}
                </div>
              </section>

              <section id="demo" className="scroll-mt-24 py-8 md:py-10">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-sm font-medium uppercase tracking-[0.16em] text-slate-500">
                      Demo
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                      Decouvrez l'experience avant de commencer.
                    </h2>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                  <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm animate-fade-up hover-lift">
                    <h3 className="text-lg font-semibold tracking-tight text-slate-950">
                      Apercu video
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      Regardez un court apercu pour voir comment l'experience RA se lance et se presente sur mobile.
                    </p>
                    <div className="mt-6 flex justify-center">
                      <video
                        className="w-full max-w-[18rem] rounded-[2rem] border border-slate-200 bg-slate-950 shadow-inner sm:max-w-[20rem]"
                        controls
                        playsInline
                        preload="metadata"
                        style={{ aspectRatio: "5 / 9" }}
                      >
                        <source src={DEMO_VIDEO_URL} type="video/mp4" />
                        Votre navigateur ne prend pas en charge la lecture video.
                      </video>
                    </div>
                  </article>

                  <article className="flex flex-col rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm animate-fade-up hover-lift" style={{ animationDelay: "100ms" }}>
                    <h3 className="text-lg font-semibold tracking-tight text-slate-950">
                      Scanner le QR de demo
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      Ajoutez ici un QR code pour ouvrir rapidement la demonstration sur mobile.
                    </p>

                    <div className="flex flex-1 items-center justify-center py-8">
                      <img
                        src={DEMO_QR_CODE_URL}
                        alt="QR code de demonstration AR Learn"
                        className="mx-auto h-60 w-60 rounded-[2rem] border border-slate-200 bg-white object-contain p-5 shadow-inner sm:h-64 sm:w-64"
                      />
                    </div>

                    <a
                      className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
                      href={DEMO_URL}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Essayer la demo
                    </a>
                  </article>
                </div>
              </section>

            </main>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default LandingPage;
