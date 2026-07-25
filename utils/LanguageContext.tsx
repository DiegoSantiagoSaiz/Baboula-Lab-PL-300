import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'es';

const translations = {
  en: {
    // App Header / General
    app_title: "Baboulas",
    app_title_lab: "Data Lab",
    app_powered_by: "Powered by Gemini & AI Studio. Built with love for learning.",
    logout: "Log Out",
    back_to_dashboard: "Back to Dashboard",
    close: "Close",
    loading: "Loading...",
    error: "Error",
    processing: "Processing...",
    reset: "Reset",

    // Auth screen
    welcome_back: "Welcome Back!",
    create_account: "Create Your Account",
    login_subtitle: "Log in to access your progress.",
    signup_subtitle: "Sign up to save your progress across devices.",
    email: "Email Address",
    alias: "Name or Alias",
    alias_placeholder: "Your display name",
    password: "Password",
    hide_password: "Hide password",
    show_password: "Show password",
    log_in_btn: "Log In",
    create_account_btn: "Create Account",
    need_account: "Need an account? Sign up",
    already_account: "Already have an account? Log in",
    continue_guest: "Continue as Guest",
    or_continue_with: "Or continue with",

    // Dashboard navigation & hero
    train_tab: "TRAIN",
    analytics_tab: "ANALYTICS",
    study_guide_tab: "STUDY GUIDE",
    method_title: "THE BABOULAS METHOD",
    hero_title: "Empower your PL-300 Power BI certification journey with high-performance workouts.",
    official_portal: "Microsoft Certified Trainer (MCT)",
    optimized_focus: "Optimized for Focus",
    why_baboulas: "Why study with the Baboulas Method?",
    why_baboulas_desc: "Designed for professionals seeking to master Microsoft Power BI PL-300 exam in record time, with a practical focus and zero empty memorization.",

    // Pillars
    pillar1_title: "Adaptive Practice",
    pillar1_desc: "Question difficulty automatically adapts to your level in real time. Train your weak spots directly.",
    pillar1_tag: "Maximum Efficiency",
    pillar2_title: "AI Feedback",
    pillar2_desc: "Ultra-direct technical explanations in 2-3 sentences by Baboulas AI to understand theory instantly after each question.",
    pillar2_tag: "Active Learning",
    pillar3_title: "Heatmap",
    pillar3_desc: "Instant visualization of your mastery level across the 4 key areas of the official PL-300 exam.",
    pillar3_tag: "Success Approach",
    pillar4_title: "Offline Focus",
    pillar4_desc: "Study without the noise of screens. Generate printable guides in clean format optimized for paper study.",
    pillar4_tag: "Pure Concentration",

    // Practice Session form
    practice_session: "Practice Session",
    difficulty: "Difficulty",
    adaptive: "Adaptive (Recommended)",
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
    category: "Category",
    all_categories: "All Categories",
    prep_data: "Prepare the data",
    model_data: "Model the data",
    viz_data: "Visualize and analyze the data",
    deploy_assets: "Deploy and maintain assets",
    timer: "Timer (minutes)",
    timer_15: "15 minutes",
    timer_10: "10 minutes",
    timer_5: "5 minutes",
    timer_unlimited: "No Limit",
    start_practice: "START PRACTICE",

    // Exam simulation
    exam_sim: "Exam Simulation",
    exam_desc: "10 high-difficulty questions, 10 minutes. Evaluate your actual level before exam day.",
    start_exam: "START EXAM",

    // Right panel / Extra widgets
    bookmarked_questions_count: "Bookmarked Questions ({count})",
    download_exam_txt: "Download Exam (.txt)",
    study_streak: "Study Streak",
    your_evolution: "Your Evolution",
    questions: "Questions",
    accuracy: "Accuracy",
    study_hub: "Study Hub",
    study_hub_desc: "Access integrated, printable study sets ready for offline review.",
    enter_hub: "Enter Hub",
    reset_data: "Reset Data",
    reset_confirm: "Are you sure you want to reset all your progress? This action cannot be undone and will delete your accumulated statistics.",

    // Readiness Gauge
    readiness_title: "Readiness Score",
    readiness_desc: "Calculated based on your current accuracy and streak.",
    readiness_low: "KEEP PUSHING",
    readiness_mid: "ON THE TRACK",
    readiness_high: "READY FOR EXAM",

    // Calendar
    calendar_title: "2026 Study Calendar",
    holiday_today: "Today",
    holiday_tomorrow: "Tomorrow",
    holiday_days: "In {diff} days",
    holiday_none: "No more holidays this year.",
    holiday_national: "National",
    holiday_regional: "Regional",
    holiday_local: "Local",

    // Bookmarks screen
    no_bookmarks: "No Bookmarked Questions",
    no_bookmarks_desc: "You haven't bookmarked any questions yet. You can bookmark questions during any quiz session.",
    your_bookmarks: "Your Bookmarked Questions",
    remove_bookmark: "Remove bookmark",
    review_bookmarks: "Review Bookmarks",
    flashcard_mode: "Flashcard Mode",
    list_mode: "List View",
    flip_card: "Flip Card",
    next_card: "Next Card",
    prev_card: "Previous Card",
    show_question: "View Question",
    show_explanation: "View Explanation & Answer",
    flashcard_instruction: "Click anywhere on the card to flip between the question and the detailed explanation.",
    flashcard_title: "Flashcard Review",
    correct_answer: "Correct Answer:",

    // Study Hub screen
    study_hub_title: "Study Hub",
    study_hub_subtitle: "Integrated Q&A Session",
    study_hub_ready: "Study Ready?",
    study_hub_ready_desc: "Generate an integrated Q&A set to study in the browser or download as a text file.",
    generate_study_set: "Generate Study Set",
    start_session: "Start Session",
    download_txt: "Download (.txt)",
    num_questions: "Number of Questions",
    text_display_size: "Text Display Size",
    q_count: "{count} Questions",
    font_sm: "Small",
    font_base: "Normal",
    font_lg: "Large",
    font_xl: "Extra Large",
    streaming_content: "AI is streaming content...",
    streaming_guide: "The AI is generating your study guide in real-time...",
    
    // Knowledge Check
    knowledge_check_tab: "Knowledge Check",
    study_guide_tab_hub: "Study Guide",
    weakest_category: "Weakest Area",
    priority_review: "Untested Area - Priority",
    critical_warning: "Critical Spot (Under 60%)",
    needs_work: "Needs Improvement (60%-80%)",
    mastery_achieved: "Mastery (Above 80%)",
    weak_areas_analysis: "Category Spot Analysis",
    generate_quick_check: "Generate Quick Check Question",
    quick_check_desc: "Answer a single custom question in your selected area to test your knowledge with instant AI feedback.",
    start_targeted_practice: "Start Targeted Practice",
    your_selection: "Your Selection",
    check_answer: "Check Answer",
    submitting: "Submitting...",
    correct: "Correct!",
    incorrect: "Incorrect",
    explanation: "Technical Explanation & Feedback",
    overall_accuracy: "Overall Accuracy:",
    questions_attempted: "Questions Attempted:",
    recommend_practice_desc: "We recommend focused practice in this category to reinforce key concepts.",

    // Study Guide (AI Study Guide block in Analytics)
    ai_study_guide: "AI Study Guide",
    ai_study_guide_desc: "Generate a customized technical overview for your study session.",
    topic: "Topic",
    detail_level: "Detail Level",
    generate_guide: "Generate Study Guide",
    guide_preview: "Study Guide Preview",
    all_topics: "All Topics",
    generating_guide: "Generating Study Guide...",

    // Quiz Interface
    sim_exam: "Exam Simulation",
    practice_mode: "Practice Mode",
    quiz_preparing: "Preparing question...",
    quiz_generating: "Generating question...",
    quiz_case_study: "Case Study / Scenario",
    quiz_check_answer: "Check Answer",
    quiz_next_question: "Next Question",
    quiz_finish_score: "Finish & Final Score",
    quiz_correct: "Correct! Well Done",
    quiz_incorrect: "Incorrect Answer",
    quiz_solved: "Official status: Item Solved.",
    quiz_review: "Official status: Review required.",
    quiz_read_aloud: "Listen",
    quiz_stop_aloud: "Stop",
    select_multi: "Select {count} answers:",
    selected_count: "{selected} of {count} selected",

    // Session Review screen
    review_ended_no_ans: "The exam session ended before any questions were answered.",
    review_title: "Exam Session Completed",
    performance_breakdown: "Performance Breakdown",
    by_category: "By Category",
    by_difficulty: "By Difficulty",
    review_your_answers: "Review Your Answers",
    skipped_status: "SKIPPED",

    // Performance ratings
    perf_master_title: "🏆 MASTER CLASS PERFORMANCE",
    perf_master_sub: "Absolutely exceptional! You have completely mastered these PL-300 topics.",
    perf_gold_title: "🥇 GOLD STANDARD PERFORMANCE",
    perf_gold_sub: "Incredible work! You are fully on track to ace your Microsoft PL-300 Exam.",
    perf_silver_title: "🥈 SILVER MEDAL PERFORMANCE",
    perf_silver_sub: "Great job! You passed the session. Keep refining your weak spots for a perfect score.",
    perf_track_title: "📈 ON THE RIGHT TRACK",
    perf_track_sub: "Good effort! Practice makes perfect. Study the incorrect responses to push higher.",
    perf_strength_title: "💪 STRENGTH & DEDICATION",
    perf_strength_sub: "Keep your head high! Every wrong answer is an opportunity to learn and grow stronger.",
    correct_count_label: "CORRECT:",
    total_count_label: "TOTAL:",

    // Performance Summary Modal
    session_complete: "Session Complete!",
    msg_excellent: "Excellent work! You're mastering the material.",
    msg_good: "Good job! Keep reviewing to solidify your knowledge.",
    msg_effort: "Good effort! Reviewing your answers will be a great learning opportunity.",
    btn_continue_review: "Continue to Review",

    // Practice Exam Downloader (Exam Generator)
    exam_generator: "Exam Generator",
    offline_practice_set: "Offline Practice Set",
    exam_gen_desc: "Generate a text file with 10 random PL-300 questions to study anywhere.",
    btn_gen_exam: "Generate Exam Content",
    include_answers: "Include Answers",
    listen_btn: "Listen",
    stop_btn: "Stop",
    formulating_questions: "Formulating questions...",
    streaming_exam: "AI is streaming the exam set...",
    close_generator: "Close Generator",
    
    // Study Roadmap
    roadmap_title: "Study Roadmap",
    roadmap_desc: "Master the 4 official Microsoft skill categories step-by-step to guarantee your success in the PL-300 exam.",
    roadmap_tab: "ROADMAP",
    roadmap_step_completed: "Step Completed",
    roadmap_all_mastered: "All topics in this category mastered!",
    roadmap_sub_topics_status: "{completed}/{total} Topics Completed",
    roadmap_total_progress: "Total Roadmap Progress",
    roadmap_practice_now: "Practice Category",
    roadmap_overall_header: "Your Learning Path",
  },
  es: {
    // App Header / General
    app_title: "Baboulas",
    app_title_lab: "Data Lab",
    app_powered_by: "Desarrollado con Gemini y AI Studio. Creado con amor para el aprendizaje.",
    logout: "Cerrar sesión",
    back_to_dashboard: "Volver al Panel",
    close: "Cerrar",
    loading: "Cargando...",
    error: "Error",
    processing: "Procesando...",
    reset: "Restablecer",

    // Auth screen
    welcome_back: "¡Te damos la bienvenida!",
    create_account: "Crea tu Cuenta",
    login_subtitle: "Inicia sesión para acceder a tu progreso.",
    signup_subtitle: "Regístrate para guardar tu progreso en cualquier dispositivo.",
    email: "Correo Electrónico",
    alias: "Nombre o Alias",
    alias_placeholder: "Tu nombre público",
    password: "Contraseña",
    hide_password: "Ocultar contraseña",
    show_password: "Mostrar contraseña",
    log_in_btn: "Iniciar Sesión",
    create_account_btn: "Crear Cuenta",
    need_account: "¿No tienes cuenta? Regístrate gratis",
    already_account: "¿Ya tienes cuenta? Inicia sesión",
    continue_guest: "Continuar como Invitado",
    or_continue_with: "O continuar con",

    // Dashboard navigation & hero
    train_tab: "ENTRENAR",
    analytics_tab: "MÉTRICAS",
    study_guide_tab: "GUÍA DE ESTUDIO",
    method_title: "EL MÉTODO BABOULAS",
    hero_title: "Impulsa tu preparación para la certificación PL-300 Power BI con entrenamientos de alto rendimiento.",
    official_portal: "Profesor Certificado por Microsoft (MCT)",
    optimized_focus: "Optimizado para Concentración",
    why_baboulas: "¿Por qué estudiar con el Método Baboulas?",
    why_baboulas_desc: "Diseñado para profesionales que buscan dominar el examen PL-300 de Microsoft Power BI en tiempo récord, con enfoque práctico y sin memorización vacía.",

    // Pillars
    pillar1_title: "Práctica Adaptativa",
    pillar1_desc: "La dificultad de las preguntas se adapta automáticamente a tu nivel en tiempo real. Entrena exactamente tus puntos débiles.",
    pillar1_tag: "Eficiencia Máxima",
    pillar2_title: "Feedback por IA",
    pillar2_desc: "Explicaciones técnicas ultra directas en 2-3 frases de Baboulas AI para comprender la teoría al instante tras cada pregunta.",
    pillar2_tag: "Comprensión Activa",
    pillar3_title: "Mapa de Calor",
    pillar3_desc: "Visualización instantánea de tu nivel de maestría en las 4 áreas clave del examen oficial PL-300 para asegurar tu aprobado.",
    pillar3_tag: "Enfoque de Éxito",
    pillar4_title: "Foco Offline",
    pillar4_desc: "Estudia sin el ruido de las pantallas. Genera guías listas para imprimir en un formato limpio optimizado para estudio en papel.",
    pillar4_tag: "Concentración Pura",

    // Practice Session form
    practice_session: "Sesión de Práctica",
    difficulty: "Dificultad",
    adaptive: "Adaptativa (Recomendada)",
    easy: "Fácil",
    medium: "Media",
    hard: "Difícil",
    category: "Categoría",
    all_categories: "Todas las Categorías",
    prep_data: "Prepare the data (Preparar datos)",
    model_data: "Model the data (Modelar datos)",
    viz_data: "Visualize and analyze the data (Visualizar y analizar)",
    deploy_assets: "Deploy and maintain assets (Desplegar y mantener)",
    timer: "Temporizador (minutos)",
    timer_15: "15 minutos",
    timer_10: "10 minutos",
    timer_5: "5 minutos",
    timer_unlimited: "Sin Límite",
    start_practice: "COMENZAR PRÁCTICA",

    // Exam simulation
    exam_sim: "Simulacro de Examen",
    exam_desc: "10 preguntas de alta dificultad, 10 minutos. Evalúa tu nivel real antes del día de tu examen oficial.",
    start_exam: "INICIAR SIMULACRO",

    // Right panel / Extra widgets
    bookmarked_questions_count: "Preguntas Guardadas ({count})",
    download_exam_txt: "Descargar Examen (.txt)",
    study_streak: "Racha de Estudio",
    your_evolution: "Tu Evolución",
    questions: "Preguntas",
    accuracy: "Precisión",
    study_hub: "Centro de Estudio",
    study_hub_desc: "Accede a guías de estudio listas para imprimir y repasar sin conexión de forma cómoda.",
    enter_hub: "Entrar al Centro",
    reset_data: "Restablecer Datos",
    reset_confirm: "¿Estás seguro de que deseas restablecer todo tu progreso? Esta acción no se puede deshacer y borrará tus estadísticas acumuladas.",

    // Readiness Gauge
    readiness_title: "Puntuación de Preparación",
    readiness_desc: "Calculado a partir de tu precisión y racha actuales.",
    readiness_low: "SIGUE ENTRENANDO",
    readiness_mid: "EN BUEN CAMINO",
    readiness_high: "LISTO PARA EL EXAMEN",

    // Calendar
    calendar_title: "Calendario de Estudio 2026",
    holiday_today: "Hoy",
    holiday_tomorrow: "Mañana",
    holiday_days: "En {diff} días",
    holiday_none: "No hay más días festivos este año.",
    holiday_national: "Nacional",
    holiday_regional: "Regional",
    holiday_local: "Local",

    // Bookmarks screen
    no_bookmarks: "Sin Preguntas Favoritas",
    no_bookmarks_desc: "Aún no has guardado ninguna pregunta. Puedes marcar preguntas como favoritas durante tus sesiones de práctica para tenerlas a mano.",
    your_bookmarks: "Tus Preguntas Guardadas",
    remove_bookmark: "Quitar marcador",
    review_bookmarks: "Repasar Favoritas",
    flashcard_mode: "Modo Fichas",
    list_mode: "Modo Lista",
    flip_card: "Girar Ficha",
    next_card: "Siguiente Ficha",
    prev_card: "Ficha Anterior",
    show_question: "Ver Pregunta",
    show_explanation: "Ver Explicación y Respuesta",
    flashcard_instruction: "Haz clic en cualquier parte de la ficha para girarla entre la pregunta y la explicación detallada.",
    flashcard_title: "Repaso con Fichas",
    correct_answer: "Respuesta Correcta:",

    // Study Hub screen
    study_hub_title: "Centro de Estudio",
    study_hub_subtitle: "Sesión de Preguntas y Respuestas Integradas",
    study_hub_ready: "¿Todo listo para estudiar?",
    study_hub_ready_desc: "Genera una guía interactiva con preguntas y respuestas integradas para estudiar aquí mismo o descargarla de forma cómoda.",
    generate_study_set: "Generar Guía de Estudio",
    start_session: "Iniciar Sesión",
    download_txt: "Descargar (.txt)",
    num_questions: "Número de Preguntas",
    text_display_size: "Tamaño del Texto",
    q_count: "{count} Preguntas",
    font_sm: "Pequeño",
    font_base: "Normal",
    font_lg: "Grande",
    font_xl: "Muy Grande",
    streaming_content: "La IA está generando tu guía de estudio en tiempo real...",
    streaming_guide: "La IA está generando tu guía de estudio en tiempo real...",

    // Knowledge Check
    knowledge_check_tab: "Evaluación Rápida",
    study_guide_tab_hub: "Guía de Estudio",
    weakest_category: "Punto más Débil",
    priority_review: "Área sin Evaluar - Prioridad",
    critical_warning: "Punto Crítico (Menos del 60%)",
    needs_work: "Requiere Práctica (60%-80%)",
    mastery_achieved: "Dominio (Más del 80%)",
    weak_areas_analysis: "Análisis de Puntos Clave",
    generate_quick_check: "Pregunta de Evaluación Rápida",
    quick_check_desc: "Responde una pregunta única personalizada en el área seleccionada para evaluar tus conocimientos con comentarios instantáneos de la IA.",
    start_targeted_practice: "Iniciar Práctica Focalizada",
    your_selection: "Tu Selección",
    check_answer: "Comprobar Respuesta",
    submitting: "Enviando...",
    correct: "¡Correcto!",
    incorrect: "Incorrecto",
    explanation: "Explicación Técnica y Comentarios",
    overall_accuracy: "Precisión General:",
    questions_attempted: "Preguntas Respondidas:",
    recommend_practice_desc: "Te recomendamos practicar en esta categoría específica para reforzar los conceptos clave.",

    // Study Guide (AI Study Guide block in Analytics)
    ai_study_guide: "Guía de Estudio IA",
    ai_study_guide_desc: "Genera una guía técnica personalizada para potenciar tu estudio.",
    topic: "Tema",
    detail_level: "Nivel de Detalle",
    generate_guide: "Generar Guía de Estudio",
    guide_preview: "Vista Previa de la Guía",
    all_topics: "Todos los Temas",
    generating_guide: "Generando Guía...",

    // Quiz Interface
    sim_exam: "Simulacro de Examen",
    practice_mode: "Modo de Práctica",
    quiz_preparing: "Preparando pregunta...",
    quiz_generating: "Generando pregunta...",
    quiz_case_study: "Caso de Estudio / Escenario",
    quiz_check_answer: "Comprobar Respuesta",
    quiz_next_question: "Siguiente Pregunta",
    quiz_finish_score: "Finalizar y Ver Puntuación",
    quiz_correct: "¡Correcto! Excelente trabajo",
    quiz_incorrect: "Respuesta Incorrecta",
    quiz_solved: "Estado oficial: Pregunta Resuelta.",
    quiz_review: "Estado oficial: Requiere revisión.",
    quiz_read_aloud: "Escuchar",
    quiz_stop_aloud: "Parar",
    select_multi: "Selecciona {count} respuestas:",
    selected_count: "{selected} de {count} seleccionadas",

    // Session Review screen
    review_ended_no_ans: "La sesión de examen terminó antes de que se respondieran preguntas.",
    review_title: "Sesión de Examen Completada",
    performance_breakdown: "Desglose de Rendimiento",
    by_category: "Por Categoría",
    by_difficulty: "Por Dificultad",
    review_your_answers: "Revisa tus Respuestas",
    skipped_status: "SALTADA",

    // Performance ratings
    perf_master_title: "🏆 RENDIMIENTO EXCEPCIONAL",
    perf_master_sub: "¡Absolutamente increíble! Has dominado por completo estos temas de PL-300.",
    perf_gold_title: "🥇 RENDIMIENTO DE ORO",
    perf_gold_sub: "¡Excelente trabajo! Estás totalmente en camino para arrasar en tu examen oficial PL-300.",
    perf_silver_title: "🥈 RENDIMIENTO DE PLATA",
    perf_silver_sub: "¡Buen trabajo! Has superado la sesión. Sigue puliendo los puntos débiles para lograr la máxima puntuación.",
    perf_track_title: "📈 EN EL CAMINO CORRECTO",
    perf_track_sub: "¡Buen esfuerzo! La práctica hace al maestro. Revisa tus fallos para subir de nivel.",
    perf_strength_title: "💪 FUERZA Y DEDICACIÓN",
    perf_strength_sub: "¡Mantén la frente en alto! Cada error es una oportunidad de oro para aprender y crecer.",
    correct_count_label: "CORRECTAS:",
    total_count_label: "TOTAL:",

    // Performance Summary Modal
    session_complete: "¡Sesión Completada!",
    msg_excellent: "¡Excelente trabajo! Estás dominando el material.",
    msg_good: "¡Buen trabajo! Sigue repasando para consolidar tus conocimientos.",
    msg_effort: "¡Buen esfuerzo! Repasar tus respuestas te ayudará a aprender más rápido.",
    btn_continue_review: "Continuar a la Revisión",

    // Practice Exam Downloader (Exam Generator)
    exam_generator: "Generador de Exámenes",
    offline_practice_set: "Práctica Fuera de Línea",
    exam_gen_desc: "Genera un archivo de texto con 10 preguntas aleatorias de PL-300 para estudiar donde quieras.",
    btn_gen_exam: "Generar Contenido del Examen",
    include_answers: "Incluir Respuestas",
    listen_btn: "Escuchar",
    stop_btn: "Parar",
    formulating_questions: "Formulando preguntas...",
    streaming_exam: "La IA está generando tu guía de estudio en tiempo real...",
    close_generator: "Cerrar Generador",
    
    // Study Roadmap
    roadmap_title: "Ruta de Estudio",
    roadmap_desc: "Domina las 4 áreas de habilidades oficiales de Microsoft paso a paso para garantizar tu éxito en el examen PL-300.",
    roadmap_tab: "RUTA DE ESTUDIO",
    roadmap_step_completed: "Paso Completado",
    roadmap_all_mastered: "¡Todos los temas de esta categoría completados!",
    roadmap_sub_topics_status: "{completed}/{total} Temas Completados",
    roadmap_total_progress: "Progreso de la Ruta de Aprendizaje",
    roadmap_practice_now: "Practicar Categoría",
    roadmap_overall_header: "Tu Ruta de Aprendizaje",
  }
};

type TranslationKey = keyof typeof translations.en;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, variables?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('pl300_language');
      if (saved === 'es' || saved === 'en') return saved;
    } catch {}
    try {
      if (navigator.language.startsWith('es')) return 'es';
    } catch {}
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('pl300_language', lang);
    } catch {}
  };

  const t = (key: TranslationKey, variables?: Record<string, string | number>): string => {
    const langDict = translations[language] || translations.en;
    let text = langDict[key] || translations.en[key] || String(key);
    
    if (variables) {
      Object.entries(variables).forEach(([vKey, vVal]) => {
        text = text.replace(`{${vKey}}`, String(vVal));
      });
    }
    
    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
