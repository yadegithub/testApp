import civilizationsImage from "../assets/images/Ancient Civilizations.jpg";
import digestiveSystemImage from "../assets/images/digestive system.jpg";
import electricCircuitImage from "../assets/images/electric circuit.png";
import femaleReproductiveSystemImage from "../assets/images/female reproductive system.jpg";
import heartImage from "../assets/images/Coeur humain.jpg";
import kidneyImage from "../assets/images/Human kidney.jpg";
import lungImage from "../assets/images/human lung.jpg";
import skinImage from "../assets/images/human skin.jpg";
import magneticImage from "../assets/images/Magnetic Fields.png";
import pendulumImage from "../assets/images/Simple Pendulum.png";
import solarImage from "../assets/images/Solar System Model.jpg";
import tectonicsImage from "../assets/images/Tectonic Plates.jpg";
import volcanoImage from "../assets/images/volcano.png";

export type SubjectId = "biology" | "physics" | "history" | "geography";

export type ExperienceArtworkId =
  | "heart"
  | "lung"
  | "solar"
  | "circuit"
  | "magnetic"
  | "pendulum"
  | "civilizations"
  | "tectonics";

export interface Subject {
  id: SubjectId;
  name: string;
  tagline: string;
  lessonCount: string;
}

export interface Experience {
  id: string;
  title: string;
  shortDescription: string;
  teaser: string;
  focusTitle: string;
  focusCopy: string;
  duration: string;
  xp: number;
  subjectId: SubjectId;
  artwork: ExperienceArtworkId;
  image: string;
  featured: boolean;
}

export interface SubjectProgress {
  id: SubjectId;
  completion: number;
  status: string;
  xpLabel: string;
}

export interface BadgeToken {
  id: string;
  label: string;
  tone: "cyan" | "blue" | "green" | "orange" | "violet";
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  time: string;
}

export const subjects: Subject[] = [
  {
    id: "biology",
    name: "Science naturelle",
    tagline: "Cells, organs and ecosystems",
    lessonCount: "18 lessons",
  },
  {
    id: "physics",
    name: "Physics",
    tagline: "Motion, light and forces",
    lessonCount: "14 lessons",
  },
  {
    id: "history",
    name: "History",
    tagline: "Civilizations and timelines",
    lessonCount: "12 lessons",
  },
  {
    id: "geography",
    name: "Geography",
    tagline: "Maps, climate and terrain",
    lessonCount: "16 lessons",
  },
];

export const experiences: Experience[] = [
  {
    id: "human-heart",
    title: "Human Heart",
    shortDescription:
      "Inspect chambers, vessels and blood flow with guided labels.",
    teaser: "Step inside the cardiovascular system with a glowing 3D heart.",
    focusTitle: "Aorta",
    focusCopy:
      "Trace oxygen-rich blood leaving the left ventricle and see why the aorta is the body's main highway.",
    duration: "8 min lesson",
    xp: 220,
    subjectId: "biology",
    artwork: "heart",
    image: heartImage,
    featured: true,
  },
  {
    id: "human-lung",
    title: "Human Lung",
    shortDescription:
      "Explore lobes, bronchi and airflow pathways with guided anatomy labels.",
    teaser: "Open a detailed lung model and follow how every breath moves.",
    focusTitle: "Bronchi",
    focusCopy:
      "Track how the trachea branches into the lungs and carries air toward smaller breathing passages.",
    duration: "7 min lesson",
    xp: 180,
    subjectId: "biology",
    artwork: "lung",
    image: lungImage,
    featured: false,
  },
  {
    id: "digestive-system",
    title: "Digestive System",
    shortDescription:
      "Scan a QR code to place the full digestive system and explore its main structures with guided notes.",
    teaser:
      "Follow the full digestive pathway in AR and tap numbered labels to understand each major structure.",
    focusTitle: "Digestive System",
    focusCopy:
      "This model presents the digestive system as a complete pathway, from food entry to nutrient absorption and waste processing.",
    duration: "9 min lesson",
    xp: 190,
    subjectId: "biology",
    artwork: "lung",
    image: digestiveSystemImage,
    featured: false,
  },
  {
    id: "human-skin",
    title: "Human Skin",
    shortDescription:
      "Explore the layers of the skin and the structures that protect, sense and regulate the body.",
    teaser:
      "Zoom into a skin cross-section in AR and tap each numbered label to inspect its anatomy.",
    focusTitle: "Dermis",
    focusCopy:
      "The dermis supports the outer surface of the skin and contains follicles, glands, vessels and sensory structures.",
    duration: "8 min lesson",
    xp: 170,
    subjectId: "biology",
    artwork: "lung",
    image: skinImage,
    featured: false,
  },
  {
    id: "female-reproductive-system",
    title: "Female Reproductive System",
    shortDescription:
      "Place a cross-section of the female reproductive system and explore the main organs with guided notes.",
    teaser:
      "Study the uterus, ovaries and connecting pathways in a clear AR cross-section.",
    focusTitle: "Uterus",
    focusCopy:
      "The uterus is the central muscular organ of the reproductive system and supports pregnancy when a fertilized egg implants.",
    duration: "9 min lesson",
    xp: 195,
    subjectId: "biology",
    artwork: "heart",
    image: femaleReproductiveSystemImage,
    featured: false,
  },
  {
    id: "human-kidney",
    title: "Human Kidney",
    shortDescription:
      "Inspect the kidney layers and vessels that filter blood and guide urine out of the organ.",
    teaser:
      "Tap through the cortex, medulla and ureter in a detailed AR kidney model.",
    focusTitle: "Renal Cortex",
    focusCopy:
      "The renal cortex is the outer region where filtration begins before fluid continues deeper into the kidney.",
    duration: "8 min lesson",
    xp: 180,
    subjectId: "biology",
    artwork: "heart",
    image: kidneyImage,
    featured: false,
  },
  {
    id: "solar-system-model",
    title: "Solar System Model",
    shortDescription:
      "Orbit around planets, compare scale and explore gravitational paths.",
    teaser: "Shrink the solar system onto your desk and navigate every orbit.",
    focusTitle: "Orbital Paths",
    focusCopy:
      "Watch planets sweep around the sun and compare how distance changes their speed across the model.",
    duration: "11 min lesson",
    xp: 180,
    subjectId: "physics",
    artwork: "solar",
    image: solarImage,
    featured: true,
  },
  {
    id: "electric-circuit",
    title: "Electric Circuit",
    shortDescription:
      "Explore a battery, wires, switch and bulb in a simple closed circuit.",
    teaser: "Place a classroom circuit on your desk and follow the current path.",
    focusTitle: "Closed Circuit",
    focusCopy:
      "See how current flows only when every component is connected in one complete loop.",
    duration: "6 min lesson",
    xp: 150,
    subjectId: "physics",
    artwork: "circuit",
    image: electricCircuitImage,
    featured: false,
  },
  {
    id: "magnetic-fields",
    title: "Magnetic Fields",
    shortDescription:
      "Reveal magnetic lines, polarity and field strength around a live core.",
    teaser: "Turn invisible field lines into an interactive glowing structure.",
    focusTitle: "Flux Density",
    focusCopy:
      "See how field lines tighten near the poles and spread wider as magnetic force becomes weaker.",
    duration: "9 min lesson",
    xp: 160,
    subjectId: "physics",
    artwork: "magnetic",
    image: magneticImage,
    featured: false,
  },
  {
    id: "simple-pendulum",
    title: "Simple Pendulum",
    shortDescription:
      "Experiment with amplitude, period and gravity using a responsive model.",
    teaser: "Pull, release and observe how rhythm changes with length and force.",
    focusTitle: "Restoring Force",
    focusCopy:
      "Follow the swing arc and understand how gravity keeps pulling the bob back toward equilibrium.",
    duration: "7 min lesson",
    xp: 140,
    subjectId: "physics",
    artwork: "pendulum",
    image: pendulumImage,
    featured: false,
  },
  {
    id: "ancient-civilizations",
    title: "Castle of Consuegra",
    shortDescription:
      "Explore a medieval Spanish castle and its defensive architecture in AR.",
    teaser: "Place the Castle of Consuegra on your desk and inspect its fortress design.",
    focusTitle: "Main Keep",
    focusCopy:
      "Study how the keep, walls, towers and gate helped protect the fortress and control movement.",
    duration: "10 min lesson",
    xp: 170,
    subjectId: "history",
    artwork: "civilizations",
    image: civilizationsImage,
    featured: false,
  },
  {
    id: "tectonic-plates",
    title: "Tectonic Plates",
    shortDescription:
      "Peel back the crust and observe boundaries, uplift and subduction.",
    teaser: "Transform flat maps into a layered model of Earth's shifting shell.",
    focusTitle: "Convergent Edge",
    focusCopy:
      "Watch one plate press under another and discover how mountains, trenches and earthquakes begin.",
    duration: "9 min lesson",
    xp: 165,
    subjectId: "geography",
    artwork: "tectonics",
    image: tectonicsImage,
    featured: true,
  },
  {
    id: "volcano",
    title: "Volcano",
    shortDescription:
      "Scan the QR code to place a volcano model and explore the crater, vent, magma chamber and lava flow.",
    teaser:
      "Launch the volcano in AR and inspect how eruptions move magma from underground to the surface.",
    focusTitle: "Magma Chamber",
    focusCopy:
      "The magma chamber stores molten rock beneath the volcano before pressure pushes it upward through the main vent.",
    duration: "8 min lesson",
    xp: 155,
    subjectId: "geography",
    artwork: "tectonics",
    image: volcanoImage,
    featured: false,
  },
];

export const featuredExperiences = experiences.filter(
  (experience) => experience.featured,
);

export const subjectProgress: SubjectProgress[] = [
  {
    id: "biology",
    completion: 86,
    status: "Level unlocked",
    xpLabel: "1240 XP",
  },
  {
    id: "physics",
    completion: 74,
    status: "Level unlocked",
    xpLabel: "980 XP",
  },
  {
    id: "geography",
    completion: 42,
    status: "Map review pending",
    xpLabel: "410 XP",
  },
  {
    id: "history",
    completion: 61,
    status: "Timeline unlocked",
    xpLabel: "620 XP",
  },
];

export const badgeTokens: BadgeToken[] = [
  { id: "explorer", label: "Explorer", tone: "cyan" },
  { id: "atom", label: "Atom Ace", tone: "blue" },
  { id: "bio", label: "Bio Lab", tone: "green" },
  { id: "champion", label: "Champion", tone: "orange" },
  { id: "legend", label: "Time Keeper", tone: "violet" },
];

export const achievements: Achievement[] = [
  {
    id: "heart",
    title: "Human Heart completed",
    description: "You identified every major chamber in the anatomy lesson.",
    time: "Today",
  },
  {
    id: "streak",
    title: "Seven-day learning streak",
    description: "You kept your AR practice alive for an entire week.",
    time: "Yesterday",
  },
  {
    id: "badge",
    title: "Field Scientist badge earned",
    description: "Geography exploration now unlocks terrain overlays.",
    time: "April 6",
  },
];

export const getExperienceById = (id: string) =>
  experiences.find((experience) => experience.id === id);

export const getSubjectById = (id: SubjectId) =>
  subjects.find((subject) => subject.id === id);

export const isSubjectId = (value: string | null): value is SubjectId =>
  value === "biology" ||
  value === "physics" ||
  value === "history" ||
  value === "geography";
