// Lightweight in-house i18n for Partikel — Spanish / English / Catalan.
// No external library: a flat key dictionary + a small client context (see LanguageProvider).

export type Lang = "es" | "en" | "ca";

export const LANGS: { code: Lang; label: string }[] = [
  { code: "es", label: "ES" },
  { code: "en", label: "EN" },
  { code: "ca", label: "CA" },
];

type Dict = Record<string, string>;

export const translations: Record<Lang, Dict> = {
  es: {
    "nav.workspace": "Análisis",
    "nav.how": "Cómo funciona",
    "nav.cta": "Abrir análisis",

    "hero.eyebrow": "Roboflow × SAM3",
    "hero.title": "Detecta micropartículas",
    "hero.scroll": "Desplázate para empezar",
    "hero.kicker": "Cuenta partículas en segundos.",
    "hero.body":
      "Partikel es una herramienta de visión por computador. Sube una imagen de microscopía y un workflow de Roboflow con SAM3 detecta y clasifica cada partícula, fibra y fragmento.",
    "hero.cta": "Abrir el análisis",

    "ws.eyebrow": "Análisis",
    "ws.heading": "Analiza partículas con SAM3",
    "ws.subtitle":
      "Sube una imagen microscópica y detecta partículas, fibras y fragmentos. El procesamiento corre en el servidor con tu workflow de Roboflow — tu clave nunca llega al navegador.",
    "ws.drag": "Arrastra una imagen aquí",
    "ws.drop": "Suelta la imagen",
    "ws.or": "o",
    "ws.browse": "explora archivos",
    "ws.formats": "JPG · PNG",
    "ws.original": "Original",
    "ws.change": "Cambiar imagen",
    "ws.analyze": "Analizar",
    "ws.analyzing": "Analizando…",
    "ws.analyzing_full": "Analizando partículas…",
    "ws.running": "Ejecutando el workflow de Roboflow (SAM3)",
    "ws.annotated": "Anotada",
    "ws.detections": "Detecciones",
    "ws.particles_detected": "partículas detectadas",
    "ws.breakdown": "Desglose por clase",
    "ws.other_classes": "Otras clases:",
    "ws.summary": "Resumen",
    "ws.no_annotated": "El workflow no devolvió imagen anotada.",
    "ws.empty_title": "Los resultados del análisis aparecerán aquí.",
    "ws.empty_sub": "Sube una imagen y pulsa «Analizar».",
    "ws.local_note":
      "Las imágenes se quedan en tu dispositivo — nada se sube hasta que pulsas Analizar.",
    "ws.flow_image": "imagen",
    "ws.flow_detect": "detección",
    "ws.flow_count": "recuento",

    "class.particle": "Partículas",
    "class.fiber": "Fibras",
    "class.fragment": "Fragmentos",

    "err.format": "Formato no soportado. Sube una imagen JPG o PNG.",
    "err.read": "No se pudo leer la imagen.",
    "err.file": "Error leyendo el archivo.",
    "err.analyze": "No se pudo analizar la imagen.",
    "err.unexpected": "Error inesperado.",

    "how.eyebrow": "Cómo funciona",
    "how.heading": "De la imagen al recuento, en segundos",
    "how.s1.t": "Sube tu imagen",
    "how.s1.b":
      "Arrastra una foto de microscopía. Todo se queda en tu navegador hasta que la analizas.",
    "how.s2.t": "Detecta con Roboflow",
    "how.s2.b":
      "El workflow localiza cada objeto y lo etiqueta con su clase y su confianza.",
    "how.s3.t": "Segmenta con SAM3",
    "how.s3.b":
      "SAM3 convierte cada detección en una máscara precisa: partícula, fibra o fragmento.",
    "how.s4.t": "Cuenta y exporta",
    "how.s4.b":
      "Obtienes la imagen anotada, el recuento total y el desglose por clase.",

    "footer.tagline": "Detección de partículas · Roboflow + SAM3",
    "footer.built": "Hecho con Next.js",
  },

  en: {
    "nav.workspace": "Analysis",
    "nav.how": "How it works",
    "nav.cta": "Open analysis",

    "hero.eyebrow": "Roboflow × SAM3",
    "hero.title": "Detect microparticles",
    "hero.scroll": "Scroll to begin",
    "hero.kicker": "Count particles in seconds.",
    "hero.body":
      "Partikel is a computer-vision tool. Upload a microscopy image and a Roboflow workflow powered by SAM3 detects and classifies every particle, fiber and fragment.",
    "hero.cta": "Open the analysis",

    "ws.eyebrow": "Analysis",
    "ws.heading": "Analyze particles with SAM3",
    "ws.subtitle":
      "Upload a microscopy image and detect particles, fibers and fragments. Processing runs on the server with your Roboflow workflow — your key never reaches the browser.",
    "ws.drag": "Drag an image here",
    "ws.drop": "Drop the image",
    "ws.or": "or",
    "ws.browse": "browse files",
    "ws.formats": "JPG · PNG",
    "ws.original": "Original",
    "ws.change": "Change image",
    "ws.analyze": "Analyze",
    "ws.analyzing": "Analyzing…",
    "ws.analyzing_full": "Analyzing particles…",
    "ws.running": "Running the Roboflow workflow (SAM3)",
    "ws.annotated": "Annotated",
    "ws.detections": "Detections",
    "ws.particles_detected": "particles detected",
    "ws.breakdown": "Breakdown by class",
    "ws.other_classes": "Other classes:",
    "ws.summary": "Summary",
    "ws.no_annotated": "The workflow returned no annotated image.",
    "ws.empty_title": "Analysis results will appear here.",
    "ws.empty_sub": "Upload an image and press “Analyze”.",
    "ws.local_note":
      "Images stay on your device — nothing is uploaded until you press Analyze.",
    "ws.flow_image": "image",
    "ws.flow_detect": "detection",
    "ws.flow_count": "count",

    "class.particle": "Particles",
    "class.fiber": "Fibers",
    "class.fragment": "Fragments",

    "err.format": "Unsupported format. Upload a JPG or PNG image.",
    "err.read": "Couldn't read the image.",
    "err.file": "Error reading the file.",
    "err.analyze": "Couldn't analyze the image.",
    "err.unexpected": "Unexpected error.",

    "how.eyebrow": "How it works",
    "how.heading": "From image to count, in seconds",
    "how.s1.t": "Upload your image",
    "how.s1.b":
      "Drag in a microscopy photo. Everything stays in your browser until you analyze it.",
    "how.s2.t": "Detect with Roboflow",
    "how.s2.b":
      "The workflow finds every object and labels it with its class and confidence.",
    "how.s3.t": "Segment with SAM3",
    "how.s3.b":
      "SAM3 turns each detection into a precise mask: particle, fiber or fragment.",
    "how.s4.t": "Count and export",
    "how.s4.b":
      "You get the annotated image, the total count and the per-class breakdown.",

    "footer.tagline": "Particle detection · Roboflow + SAM3",
    "footer.built": "Built with Next.js",
  },

  ca: {
    "nav.workspace": "Anàlisi",
    "nav.how": "Com funciona",
    "nav.cta": "Obrir anàlisi",

    "hero.eyebrow": "Roboflow × SAM3",
    "hero.title": "Detecta micropartícules",
    "hero.scroll": "Desplaça't per començar",
    "hero.kicker": "Compta partícules en segons.",
    "hero.body":
      "Partikel és una eina de visió per computador. Puja una imatge de microscòpia i un workflow de Roboflow amb SAM3 detecta i classifica cada partícula, fibra i fragment.",
    "hero.cta": "Obrir l'anàlisi",

    "ws.eyebrow": "Anàlisi",
    "ws.heading": "Analitza partícules amb SAM3",
    "ws.subtitle":
      "Puja una imatge microscòpica i detecta partícules, fibres i fragments. El processament corre al servidor amb el teu workflow de Roboflow — la teva clau mai arriba al navegador.",
    "ws.drag": "Arrossega una imatge aquí",
    "ws.drop": "Deixa anar la imatge",
    "ws.or": "o",
    "ws.browse": "explora fitxers",
    "ws.formats": "JPG · PNG",
    "ws.original": "Original",
    "ws.change": "Canvia la imatge",
    "ws.analyze": "Analitza",
    "ws.analyzing": "Analitzant…",
    "ws.analyzing_full": "Analitzant partícules…",
    "ws.running": "Executant el workflow de Roboflow (SAM3)",
    "ws.annotated": "Anotada",
    "ws.detections": "Deteccions",
    "ws.particles_detected": "partícules detectades",
    "ws.breakdown": "Desglossament per classe",
    "ws.other_classes": "Altres classes:",
    "ws.summary": "Resum",
    "ws.no_annotated": "El workflow no ha retornat cap imatge anotada.",
    "ws.empty_title": "Els resultats de l'anàlisi apareixeran aquí.",
    "ws.empty_sub": "Puja una imatge i prem «Analitza».",
    "ws.local_note":
      "Les imatges es queden al teu dispositiu — res no es puja fins que prems Analitza.",
    "ws.flow_image": "imatge",
    "ws.flow_detect": "detecció",
    "ws.flow_count": "recompte",

    "class.particle": "Partícules",
    "class.fiber": "Fibres",
    "class.fragment": "Fragments",

    "err.format": "Format no compatible. Puja una imatge JPG o PNG.",
    "err.read": "No s'ha pogut llegir la imatge.",
    "err.file": "Error en llegir el fitxer.",
    "err.analyze": "No s'ha pogut analitzar la imatge.",
    "err.unexpected": "Error inesperat.",

    "how.eyebrow": "Com funciona",
    "how.heading": "De la imatge al recompte, en segons",
    "how.s1.t": "Puja la teva imatge",
    "how.s1.b":
      "Arrossega una foto de microscòpia. Tot es queda al teu navegador fins que l'analitzes.",
    "how.s2.t": "Detecta amb Roboflow",
    "how.s2.b":
      "El workflow localitza cada objecte i l'etiqueta amb la seva classe i confiança.",
    "how.s3.t": "Segmenta amb SAM3",
    "how.s3.b":
      "SAM3 converteix cada detecció en una màscara precisa: partícula, fibra o fragment.",
    "how.s4.t": "Compta i exporta",
    "how.s4.b":
      "Obtens la imatge anotada, el recompte total i el desglossament per classe.",

    "footer.tagline": "Detecció de partícules · Roboflow + SAM3",
    "footer.built": "Fet amb Next.js",
  },
};

export type TranslationKey = keyof (typeof translations)["es"];
