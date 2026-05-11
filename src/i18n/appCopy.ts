import type { Achievement, SubjectId } from "../data/arData";
import type { AppLanguage } from "../settings/AppSettingsContext";

const subjectCopy = {
  biology: {
    en: {
      name: "Science naturelle",
      tagline: "Cells, organs and ecosystems",
      lessonCount: "18 lessons",
    },
    ar: {
      name: "العلوم الطبيعية",
      tagline: "الخلايا والأعضاء والأنظمة البيئية",
      lessonCount: "18 درسًا",
    },
  },
  physics: {
    en: {
      name: "Physics",
      tagline: "Motion, light and forces",
      lessonCount: "14 lessons",
    },
    ar: {
      name: "الفيزياء",
      tagline: "الحركة والضوء والقوى",
      lessonCount: "14 درسًا",
    },
  },
  history: {
    en: {
      name: "History",
      tagline: "Civilizations and timelines",
      lessonCount: "12 lessons",
    },
    ar: {
      name: "التاريخ",
      tagline: "الحضارات والخطوط الزمنية",
      lessonCount: "12 درسًا",
    },
  },
  geography: {
    en: {
      name: "Geography",
      tagline: "Maps, climate and terrain",
      lessonCount: "16 lessons",
    },
    ar: {
      name: "الجغرافيا",
      tagline: "الخرائط والمناخ والتضاريس",
      lessonCount: "16 درسًا",
    },
  },
} satisfies Record<
  SubjectId,
  Record<AppLanguage, { name: string; tagline: string; lessonCount: string }>
>;

const experienceCopy: Record<
  string,
  Record<
    AppLanguage,
    {
      title: string;
      shortDescription: string;
      teaser: string;
      focusTitle: string;
      focusCopy: string;
      duration: string;
    }
  >
> = {
  "human-heart": {
    en: {
      title: "Human Heart",
      shortDescription:
        "Inspect chambers, vessels and blood flow with guided labels.",
      teaser: "Step inside the cardiovascular system with a glowing 3D heart.",
      focusTitle: "Aorta",
      focusCopy:
        "Trace oxygen-rich blood leaving the left ventricle and see why the aorta is the body's main highway.",
      duration: "8 min lesson",
    },
    ar: {
      title: "قلب الإنسان",
      shortDescription:
        "استكشف الحجرات والأوعية وتدفق الدم مع تسميات إرشادية.",
      teaser: "ادخل إلى الجهاز القلبي الوعائي مع قلب ثلاثي الأبعاد متوهج.",
      focusTitle: "الشريان الأبهر",
      focusCopy:
        "تتبّع الدم الغني بالأكسجين وهو يغادر البطين الأيسر واكتشف لماذا يُعد الشريان الأبهر الطريق الرئيسي في الجسم.",
      duration: "درس 8 دقائق",
    },
  },
  "human-lung": {
    en: {
      title: "Human Lung",
      shortDescription:
        "Explore lobes, bronchi and airflow pathways with guided anatomy labels.",
      teaser: "Open a detailed lung model and follow how every breath moves.",
      focusTitle: "Bronchi",
      focusCopy:
        "Track how the trachea branches into the lungs and carries air toward smaller breathing passages.",
      duration: "7 min lesson",
    },
    ar: {
      title: "رئة الإنسان",
      shortDescription:
        "استكشف الفصوص والشعب الهوائية ومسارات التنفس مع تسميات تشريحية إرشادية.",
      teaser: "افتح نموذجًا مفصلًا للرئة وتابع كيف يتحرك كل نفس داخلها.",
      focusTitle: "الشعب الهوائية",
      focusCopy:
        "تتبّع كيف تنقسم القصبة الهوائية داخل الرئتين وتنقل الهواء إلى المسارات التنفسية الأصغر.",
      duration: "درس 7 دقائق",
    },
  },
  "digestive-system": {
    en: {
      title: "Digestive System",
      shortDescription:
        "Scan a QR code to place the full digestive system and explore its main structures with guided notes.",
      teaser:
        "Follow the full digestive pathway in AR and tap numbered labels to understand each major structure.",
      focusTitle: "Digestive System",
      focusCopy:
        "This model presents the digestive system as a complete pathway, from food entry to nutrient absorption and waste processing.",
      duration: "9 min lesson",
    },
    ar: {
      title: "الجهاز الهضمي",
      shortDescription:
        "امسح رمز QR لعرض الجهاز الهضمي في الواقع المعزز واستكشف الأعضاء بملاحظات إرشادية.",
      teaser:
        "تتبع مسار الهضم في الواقع المعزز واضغط على الأرقام لفهم كل عضو.",
      focusTitle: "الأمعاء الدقيقة",
      focusCopy:
        "يحدث معظم امتصاص المغذيات في الأمعاء الدقيقة بعد أن يفكك المعدة الطعام.",
      duration: "درس 9 دقائق",
    },
  },
  "human-skin": {
    en: {
      title: "Human Skin",
      shortDescription:
        "Explore the layers of the skin and the structures that protect, sense and regulate the body.",
      teaser:
        "Zoom into a skin cross-section in AR and tap each numbered label to inspect its anatomy.",
      focusTitle: "Dermis",
      focusCopy:
        "The dermis supports the outer surface of the skin and contains follicles, glands, vessels and sensory structures.",
      duration: "8 min lesson",
    },
    ar: {
      title: "جلد الإنسان",
      shortDescription:
        "استكشف طبقات الجلد والبنى التي تحمي الجسم وتساعده على الإحساس وتنظيم الحرارة.",
      teaser:
        "كبّر مقطعًا عرضيًا للجلد في الواقع المعزز واضغط على كل تسمية لفحص التشريح.",
      focusTitle: "الأدمة",
      focusCopy:
        "تدعم الأدمة الطبقة الخارجية للجلد وتحتوي على الجريبات والغدد والأوعية والبنى الحسية.",
      duration: "درس 8 دقائق",
    },
  },
  "female-reproductive-system": {
    en: {
      title: "Female Reproductive System",
      shortDescription:
        "Place a cross-section of the female reproductive system and explore the main organs with guided notes.",
      teaser:
        "Study the uterus, ovaries and connecting pathways in a clear AR cross-section.",
      focusTitle: "Uterus",
      focusCopy:
        "The uterus is the central muscular organ of the reproductive system and supports pregnancy when a fertilized egg implants.",
      duration: "9 min lesson",
    },
    ar: {
      title: "الجهاز التناسلي الأنثوي",
      shortDescription:
        "ضع مقطعًا للجهاز التناسلي الأنثوي واستكشف الأعضاء الرئيسية مع ملاحظات إرشادية.",
      teaser:
        "ادرس الرحم والمبايض والمسارات المتصلة من خلال مقطع واضح في الواقع المعزز.",
      focusTitle: "الرحم",
      focusCopy:
        "الرحم هو العضو العضلي المركزي في الجهاز التناسلي ويدعم الحمل عند انغراس البويضة المخصبة.",
      duration: "درس 9 دقائق",
    },
  },
  "human-kidney": {
    en: {
      title: "Human Kidney",
      shortDescription:
        "Inspect the kidney layers and vessels that filter blood and guide urine out of the organ.",
      teaser:
        "Tap through the cortex, medulla and ureter in a detailed AR kidney model.",
      focusTitle: "Renal Cortex",
      focusCopy:
        "The renal cortex is the outer region where filtration begins before fluid continues deeper into the kidney.",
      duration: "8 min lesson",
    },
    ar: {
      title: "كلية الإنسان",
      shortDescription:
        "افحص طبقات الكلية والأوعية التي ترشح الدم وتوجه البول إلى خارج العضو.",
      teaser:
        "تنقل بين القشرة واللب والحالب داخل نموذج كلية مفصل في الواقع المعزز.",
      focusTitle: "القشرة الكلوية",
      focusCopy:
        "القشرة الكلوية هي المنطقة الخارجية التي تبدأ فيها عملية الترشيح قبل أن يتجه السائل إلى عمق الكلية.",
      duration: "درس 8 دقائق",
    },
  },
  "solar-system-model": {
    en: {
      title: "Solar System Model",
      shortDescription:
        "Orbit around planets, compare scale and explore gravitational paths.",
      teaser: "Shrink the solar system onto your desk and navigate every orbit.",
      focusTitle: "Orbital Paths",
      focusCopy:
        "Watch planets sweep around the sun and compare how distance changes their speed across the model.",
      duration: "11 min lesson",
    },
    ar: {
      title: "نموذج النظام الشمسي",
      shortDescription:
        "تحرّك حول الكواكب وقارن الأحجام واستكشف المسارات الجاذبية.",
      teaser: "ضع النظام الشمسي على مكتبك واستكشف كل مدار.",
      focusTitle: "المسارات المدارية",
      focusCopy:
        "شاهد الكواكب وهي تدور حول الشمس وقارن كيف تغيّر المسافة سرعتها داخل النموذج.",
      duration: "درس 11 دقيقة",
    },
  },
  "electric-circuit": {
    en: {
      title: "Electric Circuit",
      shortDescription:
        "Explore a battery, wires, switch and bulb in a simple closed circuit.",
      teaser: "Place a classroom circuit on your desk and follow the current path.",
      focusTitle: "Closed Circuit",
      focusCopy:
        "See how current flows only when every component is connected in one complete loop.",
      duration: "6 min lesson",
    },
    ar: {
      title: "الدائرة الكهربائية",
      shortDescription:
        "استكشف بطارية وأسلاكًا ومفتاحًا ومصباحًا داخل دائرة كهربائية مغلقة بسيطة.",
      teaser: "ضع دائرة كهربائية مدرسية على مكتبك وتابع مسار التيار.",
      focusTitle: "دائرة مغلقة",
      focusCopy:
        "لاحظ كيف يمر التيار فقط عندما تكون كل المكونات متصلة في حلقة كاملة.",
      duration: "درس 6 دقائق",
    },
  },
  "magnetic-fields": {
    en: {
      title: "Magnetic Fields",
      shortDescription:
        "Reveal magnetic lines, polarity and field strength around a live core.",
      teaser: "Turn invisible field lines into an interactive glowing structure.",
      focusTitle: "Flux Density",
      focusCopy:
        "See how field lines tighten near the poles and spread wider as magnetic force becomes weaker.",
      duration: "9 min lesson",
    },
    ar: {
      title: "الحقول المغناطيسية",
      shortDescription:
        "اكشف خطوط المجال والقطبية وشدة المجال حول نواة نشطة.",
      teaser: "حوّل خطوط المجال غير المرئية إلى بنية تفاعلية متوهجة.",
      focusTitle: "كثافة الفيض",
      focusCopy:
        "لاحظ كيف تتقارب خطوط المجال قرب الأقطاب وتتباعد كلما ضعفت القوة المغناطيسية.",
      duration: "درس 9 دقائق",
    },
  },
  "simple-pendulum": {
    en: {
      title: "Simple Pendulum",
      shortDescription:
        "Experiment with amplitude, period and gravity using a responsive model.",
      teaser: "Pull, release and observe how rhythm changes with length and force.",
      focusTitle: "Restoring Force",
      focusCopy:
        "Follow the swing arc and understand how gravity keeps pulling the bob back toward equilibrium.",
      duration: "7 min lesson",
    },
    ar: {
      title: "البندول البسيط",
      shortDescription:
        "جرّب السعة والزمن الدوري والجاذبية باستخدام نموذج تفاعلي.",
      teaser: "اسحب ثم اترك ولاحظ كيف يتغير الإيقاع مع الطول والقوة.",
      focusTitle: "قوة الإرجاع",
      focusCopy:
        "تابع مسار التأرجح وافهم كيف تعيد الجاذبية الجسم إلى موضع الاتزان.",
      duration: "درس 7 دقائق",
    },
  },
  "ancient-civilizations": {
    en: {
      title: "Castle of Consuegra",
      shortDescription:
        "Explore a medieval Spanish castle and its defensive architecture in AR.",
      teaser:
        "Place the Castle of Consuegra on your desk and inspect its fortress design.",
      focusTitle: "Main Keep",
      focusCopy:
        "Study how the keep, walls, towers and gate helped protect the fortress and control movement.",
      duration: "10 min lesson",
    },
    ar: {
      title: "الحضارات القديمة",
      shortDescription:
        "تجوّل بين المعابد والأدوات والقصص من الإمبراطوريات الأولى بالواقع المعزز.",
      teaser: "أحضر موقعًا أثريًا مصغرًا إلى الصف أو المنزل.",
      focusTitle: "تصميم المعبد",
      focusCopy:
        "استكشف كيف رتبت المساحات الاحتفالية والأعمدة والقطع الأثرية لتوجيه الحركة والطقوس.",
      duration: "درس 10 دقائق",
    },
  },
  "tectonic-plates": {
    en: {
      title: "Tectonic Plates",
      shortDescription:
        "Peel back the crust and observe boundaries, uplift and subduction.",
      teaser: "Transform flat maps into a layered model of Earth's shifting shell.",
      focusTitle: "Convergent Edge",
      focusCopy:
        "Watch one plate press under another and discover how mountains, trenches and earthquakes begin.",
      duration: "9 min lesson",
    },
    ar: {
      title: "الصفائح التكتونية",
      shortDescription: "اكشف القشرة ولاحظ الحدود والارتفاع والانغراز.",
      teaser: "حوّل الخرائط المسطحة إلى نموذج طبقي لقشرة الأرض المتحركة.",
      focusTitle: "الحافة التقاربية",
      focusCopy:
        "شاهد صفيحة تنزلق أسفل أخرى واكتشف كيف تبدأ الجبال والخنادق والزلازل.",
      duration: "درس 9 دقائق",
    },
  },
  volcano: {
    en: {
      title: "Volcano",
      shortDescription:
        "Scan the QR code to place a volcano model and explore the crater, vent, magma chamber and lava flow.",
      teaser:
        "Launch the volcano in AR and inspect how eruptions move magma from underground to the surface.",
      focusTitle: "Magma Chamber",
      focusCopy:
        "The magma chamber stores molten rock beneath the volcano before pressure pushes it upward through the main vent.",
      duration: "8 min lesson",
    },
    ar: {
      title: "البركان",
      shortDescription:
        "امسح رمز QR لوضع نموذج بركان واستكشاف الفوهة والقناة وغرفة الصهارة وتدفق الحمم.",
      teaser:
        "شغل البركان في الواقع المعزز وافحص كيف تحرك الثورانات الصهارة من باطن الأرض إلى السطح.",
      focusTitle: "غرفة الصهارة",
      focusCopy:
        "تخزن غرفة الصهارة الصخور المنصهرة تحت البركان قبل أن يدفعها الضغط صعودا عبر القناة الرئيسية.",
      duration: "درس 8 دقائق",
    },
  },
};

const badgeCopy: Record<string, Record<AppLanguage, string>> = {
  explorer: { en: "Explorer", ar: "المستكشف" },
  atom: { en: "Atom Ace", ar: "خبير الذرة" },
  bio: { en: "Bio Lab", ar: "مختبر العلوم الطبيعية" },
  champion: { en: "Champion", ar: "البطل" },
  legend: { en: "Time Keeper", ar: "حارس الزمن" },
};

const progressStatusCopy: Record<string, Record<AppLanguage, string>> = {
  "Level unlocked": { en: "Level unlocked", ar: "تم فتح المستوى" },
  "Map review pending": {
    en: "Map review pending",
    ar: "مراجعة الخريطة قيد الانتظار",
  },
  "Timeline unlocked": { en: "Timeline unlocked", ar: "تم فتح الخط الزمني" },
  "Start your first lesson": {
    en: "Start your first lesson",
    ar: "ابدأ أول درس لك",
  },
  "Lesson in progress": { en: "Lesson in progress", ar: "الدرس قيد التقدم" },
  Mastered: { en: "Mastered", ar: "تم الإتقان" },
};

const staticAchievementCopy: Record<
  string,
  Record<AppLanguage, { title: string; description: string; time: string }>
> = {
  heart: {
    en: {
      title: "Human Heart completed",
      description: "You identified every major chamber in the anatomy lesson.",
      time: "Today",
    },
    ar: {
      title: "تم إكمال قلب الإنسان",
      description: "لقد حددت جميع الحجرات الرئيسية في درس التشريح.",
      time: "اليوم",
    },
  },
  streak: {
    en: {
      title: "Seven-day learning streak",
      description: "You kept your AR practice alive for an entire week.",
      time: "Yesterday",
    },
    ar: {
      title: "سلسلة تعلم لمدة سبعة أيام",
      description: "حافظت على ممارسة الواقع المعزز لمدة أسبوع كامل.",
      time: "أمس",
    },
  },
  badge: {
    en: {
      title: "Field Scientist badge earned",
      description: "Geography exploration now unlocks terrain overlays.",
      time: "April 6",
    },
    ar: {
      title: "تم الحصول على شارة عالم ميداني",
      description: "أصبح استكشاف الجغرافيا يفتح الآن طبقات التضاريس.",
      time: "6 أبريل",
    },
  },
};

export const getLocale = (language: AppLanguage) =>
  language === "ar" ? "ar" : "en-US";

export const getSubjectCopy = (subjectId: SubjectId, language: AppLanguage) =>
  subjectCopy[subjectId][language];

export const getExperienceCopy = (
  experienceId: string,
  language: AppLanguage,
) => experienceCopy[experienceId]?.[language];

export const getBadgeLabel = (badgeId: string, language: AppLanguage) =>
  badgeCopy[badgeId]?.[language] ?? badgeId;

export const getProgressStatusLabel = (
  status: string,
  language: AppLanguage,
) => progressStatusCopy[status]?.[language] ?? status;

const formatDateLabel = (rawValue: string, language: AppLanguage) => {
  if (rawValue === "Today") {
    return language === "ar" ? "اليوم" : rawValue;
  }

  if (rawValue === "Yesterday") {
    return language === "ar" ? "أمس" : rawValue;
  }

  const parsedDate = new Date(rawValue);

  if (Number.isNaN(parsedDate.getTime())) {
    return rawValue;
  }

  return new Intl.DateTimeFormat(getLocale(language), {
    month: "long",
    day: "numeric",
  }).format(parsedDate);
};

export const getAchievementCopy = (
  achievement: Achievement,
  language: AppLanguage,
) => {
  const staticCopy = staticAchievementCopy[achievement.id]?.[language];

  if (staticCopy) {
    return staticCopy;
  }

  if (achievement.id === "account-created") {
    const firstName = achievement.description.split(",")[0] ?? "";

    return language === "ar"
      ? {
          title: "تم إنشاء الحساب",
          description: `${firstName}، ملفك في AR Learn جاهز لأول درس.`,
          time: formatDateLabel(achievement.time, language),
        }
      : {
          title: "Account created",
          description:
            achievement.description ||
            `${firstName}, your AR Learn profile is ready for its first lesson.`,
          time: formatDateLabel(achievement.time, language),
        };
  }

  if (achievement.id.startsWith("launch-")) {
    const experienceId = achievement.id.replace("launch-", "");
    const localizedExperience = getExperienceCopy(experienceId, language);

    if (localizedExperience) {
      return language === "ar"
        ? {
            title: `تم استكشاف ${localizedExperience.title}`,
            description: "لقد أحرزت تقدمًا جديدًا بفتح هذا الدرس في الواقع المعزز.",
            time: formatDateLabel(achievement.time, language),
          }
        : {
            title: `${localizedExperience.title} explored`,
            description:
              "You added fresh progress by opening this AR lesson.",
            time: formatDateLabel(achievement.time, language),
          };
    }
  }

  return {
    title: achievement.title,
    description: achievement.description,
    time: formatDateLabel(achievement.time, language),
  };
};
