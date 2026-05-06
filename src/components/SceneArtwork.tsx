import type { CSSProperties } from "react";
import type { ExperienceArtworkId } from "../data/arData";

interface Hotspot {
  label: string;
  style: CSSProperties;
}

interface SceneArtworkProps {
  variant: ExperienceArtworkId;
  showLabels: boolean;
}

const hotspotMap: Record<ExperienceArtworkId, Hotspot[]> = {
  heart: [
    { label: "Aorta", style: { top: "20%", right: "22%" } },
    { label: "Ventricle", style: { top: "50%", left: "16%" } },
    { label: "Atrium", style: { top: "32%", left: "18%" } },
  ],
  lung: [
    { label: "Trachea", style: { top: "16%", left: "48%" } },
    { label: "Left lung", style: { top: "44%", left: "16%" } },
    { label: "Bronchi", style: { top: "40%", right: "14%" } },
  ],
  solar: [
    { label: "Sun", style: { top: "46%", left: "16%" } },
    { label: "Inner orbit", style: { top: "25%", right: "18%" } },
    { label: "Gas giant", style: { bottom: "24%", right: "18%" } },
  ],
  circuit: [
    { label: "Battery", style: { top: "30%", left: "16%" } },
    { label: "Switch", style: { bottom: "22%", left: "42%" } },
    { label: "Bulb", style: { top: "30%", right: "16%" } },
  ],
  magnetic: [
    { label: "North pole", style: { top: "18%", left: "50%" } },
    { label: "Field arc", style: { top: "48%", right: "14%" } },
    { label: "South pole", style: { bottom: "16%", left: "50%" } },
  ],
  pendulum: [
    { label: "Pivot", style: { top: "16%", left: "52%" } },
    { label: "Swing path", style: { top: "52%", right: "12%" } },
    { label: "Bob", style: { bottom: "16%", left: "22%" } },
  ],
  civilizations: [
    { label: "Temple roof", style: { top: "16%", left: "32%" } },
    { label: "Column hall", style: { top: "54%", left: "12%" } },
    { label: "Artifact", style: { bottom: "15%", right: "18%" } },
  ],
  tectonics: [
    { label: "Plate edge", style: { top: "36%", left: "12%" } },
    { label: "Mantle flow", style: { bottom: "22%", left: "50%" } },
    { label: "Subduction", style: { top: "24%", right: "14%" } },
  ],
};

const SceneArtwork: React.FC<SceneArtworkProps> = ({ variant, showLabels }) => (
  <div className={`scene-art scene-art--${variant}`}>
    <div className="scene-art__platform" />

    {variant === "heart" && (
      <svg
        viewBox="0 0 260 320"
        className="heart-model"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id="heartCore" x1="40" y1="34" x2="220" y2="250">
            <stop offset="0%" stopColor="#fcb0a6" />
            <stop offset="45%" stopColor="#c4494b" />
            <stop offset="100%" stopColor="#7d2532" />
          </linearGradient>
          <linearGradient id="heartBlue" x1="72" y1="20" x2="138" y2="96">
            <stop offset="0%" stopColor="#7dd0ff" />
            <stop offset="100%" stopColor="#4161ff" />
          </linearGradient>
          <linearGradient id="heartRed" x1="144" y1="8" x2="210" y2="112">
            <stop offset="0%" stopColor="#ffb18a" />
            <stop offset="100%" stopColor="#df3d3f" />
          </linearGradient>
          <linearGradient id="heartShadow" x1="110" y1="170" x2="190" y2="286">
            <stop offset="0%" stopColor="#7f2442" stopOpacity="0" />
            <stop offset="100%" stopColor="#380d19" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        <path
          d="M103 73C86 54 59 55 48 88c-11 34 8 72 40 103 20 19 34 39 42 66 13-29 28-48 52-69 31-28 50-64 37-102-12-34-41-36-58-5-6-30-27-36-58 7Z"
          fill="url(#heartCore)"
          stroke="#702231"
          strokeWidth="6"
        />
        <path
          d="M78 41c-10 7-14 20-9 34 6 17 24 28 42 30V32c-11-3-22 0-33 9Z"
          fill="url(#heartBlue)"
          stroke="#3344a2"
          strokeWidth="4"
        />
        <path
          d="M146 27c14 4 27 13 37 28 12 18 17 40 13 57l-32 5-18-24-1-66Z"
          fill="url(#heartRed)"
          stroke="#8f2a30"
          strokeWidth="4"
        />
        <path
          d="M111 94c-14 25-18 59-9 88 9 26 22 44 29 57 10-18 26-37 37-61 12-27 13-54 6-77l-63-7Z"
          fill="url(#heartShadow)"
        />
        <path
          d="M104 125c16-10 36-11 53-2"
          fill="none"
          stroke="#ffd1cf"
          strokeWidth="6"
          strokeLinecap="round"
          opacity="0.8"
        />
        <path
          d="M96 157c21-14 48-15 69-5"
          fill="none"
          stroke="#f4a2aa"
          strokeWidth="5"
          strokeLinecap="round"
          opacity="0.75"
        />
        <path
          d="M149 39c12-20 28-21 38-11 10 11 11 29 4 43"
          fill="none"
          stroke="#ffcf9d"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d="M100 44c-7-17-23-24-35-18-13 7-18 22-13 39"
          fill="none"
          stroke="#7dd0ff"
          strokeWidth="10"
          strokeLinecap="round"
        />

        {[["86", "102"], ["168", "115"], ["136", "184"]].map(([cx, cy]) => (
          <g key={`${cx}-${cy}`}>
            <circle cx={cx} cy={cy} r="14" fill="#4bdcff" opacity="0.18" />
            <circle cx={cx} cy={cy} r="8" fill="#6ef7ff" />
          </g>
        ))}
      </svg>
    )}

    {variant === "lung" && (
      <svg
        viewBox="0 0 320 360"
        className="lung-model"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id="lungStem" x1="160" y1="24" x2="160" y2="152">
            <stop offset="0%" stopColor="#f3fbff" />
            <stop offset="100%" stopColor="#9edcff" />
          </linearGradient>
          <linearGradient id="lungLeftFill" x1="72" y1="82" x2="170" y2="284">
            <stop offset="0%" stopColor="#ffb0b6" />
            <stop offset="48%" stopColor="#ef5f73" />
            <stop offset="100%" stopColor="#aa2948" />
          </linearGradient>
          <linearGradient id="lungRightFill" x1="248" y1="82" x2="150" y2="284">
            <stop offset="0%" stopColor="#ffc1b6" />
            <stop offset="48%" stopColor="#f16d79" />
            <stop offset="100%" stopColor="#b92e4d" />
          </linearGradient>
        </defs>

        <path
          d="M146 28h28c7 0 12 5 12 12v66c0 7-5 12-12 12h-28c-7 0-12-5-12-12V40c0-7 5-12 12-12Z"
          fill="url(#lungStem)"
        />
        <path
          d="M150 108c-17 8-32 21-46 37-26 30-42 60-49 92-8 36-5 69 8 101 15 36 40 60 75 73 20 7 38 7 56 0V144c-11-16-24-28-44-36Z"
          fill="url(#lungLeftFill)"
        />
        <path
          d="M170 108c17 8 32 21 46 37 26 30 42 60 49 92 8 36 5 69-8 101-15 36-40 60-75 73-20 7-38 7-56 0V144c11-16 24-28 44-36Z"
          fill="url(#lungRightFill)"
        />
        <path
          d="M160 118v56M160 174l-34 42M160 174l34 42M160 174l-56 68M160 174l56 68"
          fill="none"
          stroke="#dbf8ff"
          strokeLinecap="round"
          strokeWidth="12"
        />
        <path
          d="M160 118v56M160 174l-34 42M160 174l34 42M160 174l-56 68M160 174l56 68"
          fill="none"
          stroke="#56c9ff"
          strokeLinecap="round"
          strokeWidth="4"
        />
        <path
          d="M104 168c32 27 53 62 62 104M84 226c35 22 56 53 64 92M216 168c-32 27-53 62-62 104M236 226c-35 22-56 53-64 92"
          fill="none"
          stroke="rgba(255, 255, 255, 0.36)"
          strokeLinecap="round"
          strokeWidth="7"
        />

        {[["110", "184"], ["210", "192"], ["160", "256"]].map(([cx, cy]) => (
          <g key={`${cx}-${cy}`}>
            <circle cx={cx} cy={cy} r="14" fill="#4bdcff" opacity="0.18" />
            <circle cx={cx} cy={cy} r="8" fill="#6ef7ff" />
          </g>
        ))}
      </svg>
    )}

    {variant === "solar" && (
      <div className="solar-scene" aria-hidden="true">
        <span className="solar-scene__orbit solar-scene__orbit--1" />
        <span className="solar-scene__orbit solar-scene__orbit--2" />
        <span className="solar-scene__orbit solar-scene__orbit--3" />
        <span className="solar-scene__sun" />
        <span className="solar-scene__planet solar-scene__planet--1" />
        <span className="solar-scene__planet solar-scene__planet--2" />
        <span className="solar-scene__planet solar-scene__planet--3" />
        <span className="solar-scene__planet solar-scene__planet--4" />
      </div>
    )}

    {variant === "circuit" && (
      <div className="circuit-scene" aria-hidden="true">
        <span className="circuit-scene__wire circuit-scene__wire--top" />
        <span className="circuit-scene__wire circuit-scene__wire--bottom" />
        <span className="circuit-scene__battery" />
        <span className="circuit-scene__switch" />
        <span className="circuit-scene__bulb" />
      </div>
    )}

    {variant === "magnetic" && (
      <div className="magnetic-scene" aria-hidden="true">
        <span className="magnetic-scene__core" />
        <span className="magnetic-scene__line magnetic-scene__line--1" />
        <span className="magnetic-scene__line magnetic-scene__line--2" />
        <span className="magnetic-scene__line magnetic-scene__line--3" />
        <span className="magnetic-scene__line magnetic-scene__line--4" />
      </div>
    )}

    {variant === "pendulum" && (
      <div className="pendulum-scene" aria-hidden="true">
        <span className="pendulum-scene__frame" />
        <span className="pendulum-scene__rod pendulum-scene__rod--left" />
        <span className="pendulum-scene__rod pendulum-scene__rod--center" />
        <span className="pendulum-scene__rod pendulum-scene__rod--right" />
        <span className="pendulum-scene__bob pendulum-scene__bob--left" />
        <span className="pendulum-scene__bob pendulum-scene__bob--center" />
        <span className="pendulum-scene__bob pendulum-scene__bob--right" />
      </div>
    )}

    {variant === "civilizations" && (
      <div className="civilizations-scene" aria-hidden="true">
        <span className="civilizations-scene__roof" />
        <span className="civilizations-scene__step civilizations-scene__step--1" />
        <span className="civilizations-scene__step civilizations-scene__step--2" />
        <span className="civilizations-scene__step civilizations-scene__step--3" />
        <span className="civilizations-scene__column civilizations-scene__column--1" />
        <span className="civilizations-scene__column civilizations-scene__column--2" />
        <span className="civilizations-scene__column civilizations-scene__column--3" />
        <span className="civilizations-scene__artifact" />
      </div>
    )}

    {variant === "tectonics" && (
      <div className="tectonics-scene" aria-hidden="true">
        <span className="tectonics-scene__plate tectonics-scene__plate--left" />
        <span className="tectonics-scene__plate tectonics-scene__plate--right" />
        <span className="tectonics-scene__mantle" />
        <span className="tectonics-scene__flow tectonics-scene__flow--left" />
        <span className="tectonics-scene__flow tectonics-scene__flow--right" />
      </div>
    )}

    {showLabels &&
      hotspotMap[variant].map((hotspot) => (
        <div
          key={`${variant}-${hotspot.label}`}
          className="scene-hotspot"
          style={hotspot.style}
        >
          <span className="scene-hotspot__dot" />
          <span className="scene-hotspot__label">{hotspot.label}</span>
        </div>
      ))}
  </div>
);

export default SceneArtwork;
