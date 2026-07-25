import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
const PORT = 3000;

// Initialize GoogleGenAI client lazily on the server to prevent crashing if GEMINI_API_KEY is not set at boot time
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Enable JSON body parser
app.use(express.json());

const questionSchema = {
  type: Type.OBJECT,
  properties: {
    type: { 
        type: Type.STRING, 
        enum: ['MultipleChoice', 'MultiSelect', 'BuildList', 'Matching', 'CaseStudy']
    },
    question: { type: Type.STRING },
    context: { type: Type.STRING, description: 'Optional: Detailed scenario for CaseStudy types.' },
    options: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'List of options. For matching, options contain both sets.'
    },
    answer: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING },
        description: 'For MultipleChoice, a single string in an array. For MultiSelect, multiple strings. For BuildList, the strings in the correct order. For Matching, pairs like "Item:Target".'
    },
    explanation: { type: Type.STRING },
    category: {
      type: Type.STRING,
      enum: ['Prepare the data', 'Model the data', 'Visualize and analyze the data', 'Deploy and maintain assets']
    },
    difficulty: {
      type: Type.STRING,
      enum: ['Easy', 'Medium', 'Hard']
    }
  },
  required: ['type', 'question', 'options', 'answer', 'explanation', 'category', 'difficulty']
};

// Helper to execute a promise with retries, exponential backoff, and model fallback
async function callWithRetry<T>(
  fn: (modelName: string) => Promise<T>,
  primaryModel: string = 'gemini-3.5-flash',
  fallbackModel: string = 'gemini-3.1-flash-lite',
  retries = 3,
  delay = 500
): Promise<T> {
  let currentModel = primaryModel;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn(currentModel);
    } catch (error: any) {
      const errorStr = String(error.message || error || "").toLowerCase();
      const isRateLimit = errorStr.includes('429') || 
                          errorStr.includes('quota') || 
                          errorStr.includes('limit') || 
                          errorStr.includes('resource_exhausted') ||
                          errorStr.includes('exhausted') ||
                          (error.status && String(error.status).includes('RESOURCE_EXHAUSTED')) ||
                          (error.code && (error.code === 429 || error.code === '429'));
                          
      const isUnavailable = errorStr.includes('503') || 
                            errorStr.includes('unavailable') || 
                            errorStr.includes('high demand') || 
                            errorStr.includes('overloaded');

      if (attempt === retries) {
        throw error;
      }

      if ((isRateLimit || isUnavailable) && currentModel === primaryModel && fallbackModel) {
        console.warn(`Model ${primaryModel} failed due to demand/quota. Switching to fallback model ${fallbackModel}.`);
        currentModel = fallbackModel;
      }

      const currentDelay = delay * Math.pow(2, attempt);
      console.warn(`Gemini API call failed (model: ${currentModel}), retrying in ${currentDelay}ms... (Remaining retries: ${retries - attempt}). Error:`, error.message || error);
      await new Promise((resolve) => setTimeout(resolve, currentDelay));
    }
  }
  throw new Error("Unexpected end of retry loop");
}

// Helper to log errors safely without cluttering console.error with quota errors
function logApiError(prefix: string, error: any) {
  const errorStr = String(error?.message || error || "").toLowerCase();
  const isRateLimit = errorStr.includes('429') || 
                      errorStr.includes('quota') || 
                      errorStr.includes('limit') || 
                      errorStr.includes('resource_exhausted') ||
                      errorStr.includes('exhausted') ||
                      (error?.status && String(error.status).includes('RESOURCE_EXHAUSTED')) ||
                      (error?.code && (error.code === 429 || error.code === '429'));
  if (isRateLimit) {
    console.warn(`[Gemini API Quota/Rate Limit] ${prefix}: Serve fallback content instead. Message: ${error?.message || error}`);
  } else {
    console.error(`${prefix}:`, error);
  }
}

// Comprehensive high-quality fallback questions in both Spanish and English
const FALLBACK_QUESTIONS: Record<string, Record<string, any[]>> = {
  es: {
    'Prepare the data': [
      {
        type: 'MultipleChoice',
        question: 'Estás diseñando un modelo en Power BI Desktop y te conectas a una base de datos SQL Server. Necesitas combinar varias columnas de texto en una sola columna con formato para optimizar el rendimiento y la legibilidad. ¿Dónde deberías realizar esta operación para seguir las mejores prácticas?',
        options: [
          'A. Crear una columna calculada utilizando DAX en Power BI Desktop.',
          'B. Realizar la combinación de columnas en Power Query Editor utilizando M antes de cargar los datos.',
          'C. Diseñar una medida rápida en la vista de informe.',
          'D. Combinar las columnas manualmente usando un control visual de tarjeta.'
        ],
        answer: ['B. Realizar la combinación de columnas en Power Query Editor utilizando M antes de cargar los datos.'],
        explanation: 'Respuesta(s) Correcta(s): B. Realizar la combinación de columnas en Power Query Editor utilizando M antes de cargar los datos.\n\nSegún las mejores prácticas de Power BI, las transformaciones de datos deben realizarse lo más temprano posible en la canalización de datos (preferiblemente en la fuente o en Power Query). Esto optimiza la compresión del motor VertiPaq.',
        category: 'Prepare the data',
        difficulty: 'Medium'
      },
      {
        type: 'MultiSelect',
        question: 'Vas a importar un archivo CSV grande de 5 GB en Power BI Desktop. ¿Cuáles de las siguientes técnicas son más eficaces para reducir el tamaño del modelo y mejorar el rendimiento de Power Query? (Selecciona DOS)',
        options: [
          'A. Filtrar y eliminar las filas que no sean necesarias para el análisis.',
          'B. Deshabilitar la opción "Cargar" para consultas intermedias que solo sirven de apoyo.',
          'C. Convertir todas las columnas numéricas a tipo de datos de texto.',
          'D. Mantener todas las columnas y aplicar un ordenamiento alfabético a las columnas clave.'
        ],
        answer: [
          'A. Filtrar y eliminar las filas que no sean necesarias para el análisis.',
          'B. Deshabilitar la opción "Cargar" para consultas intermedias que solo sirven de apoyo.'
        ],
        explanation: 'Respuesta(s) Correcta(s): A, B.\n\nFiltrar filas innecesarias reduce directamente la cardinalidad y el volumen de datos importados. Deshabilitar la carga de consultas intermedias evita la duplicación de datos innecesarios en el modelo VertiPaq.',
        category: 'Prepare the data',
        difficulty: 'Medium'
      }
    ],
    'Model the data': [
      {
        type: 'MultipleChoice',
        question: 'Necesitas calcular las ventas del año anterior para compararlas con las actuales. ¿Qué función DAX es la más adecuada para realizar esta inteligencia de tiempo en un modelo con una tabla de calendario estándar?',
        options: [
          'A. DATEADD',
          'B. SAMEPERIODLASTYEAR',
          'C. PREVIOUSYEAR',
          'D. PARALLELPERIOD'
        ],
        answer: ['B. SAMEPERIODLASTYEAR'],
        explanation: 'Respuesta(s) Correcta(s): B. SAMEPERIODLASTYEAR\n\nSAMEPERIODLASTYEAR devuelve un conjunto de fechas en el período especificado del año anterior. Es la función de inteligencia de tiempo más directa y específica para comparar el mismo periodo exacto del año anterior.',
        category: 'Model the data',
        difficulty: 'Easy'
      },
      {
        type: 'BuildList',
        question: 'Debes configurar una tabla de fechas personalizada en Power BI Desktop. Ordena secuencialmente los pasos requeridos para asegurarte de que las funciones de inteligencia de tiempo DAX se ejecuten correctamente.',
        options: [
          'Crear o importar una tabla de dimensiones con fechas continuas sin duplicados.',
          'Marcar la tabla como "Tabla de fechas" (Mark as date table) en Power BI Desktop.',
          'Seleccionar la columna de tipo Date como la clave principal de fecha.',
          'Crear una relación activa de 1 a muchos entre la columna de fecha y la tabla de hechos.'
        ],
        answer: [
          'Crear o importar una tabla de dimensiones con fechas continuas sin duplicados.',
          'Marcar la tabla como "Tabla de fechas" (Mark as date table) en Power BI Desktop.',
          'Seleccionar la columna de tipo Date como la clave principal de fecha.',
          'Crear una relación activa de 1 a muchos entre la columna de fecha y la tabla de hechos.'
        ],
        explanation: 'Respuesta(s) Correcta(s): El orden exacto indicado.\n\nPrimero necesitas una tabla continua sin saltos. Luego debes indicarle formalmente a Power BI que es tu tabla de fechas personalizada. Seleccionas su clave única (Date) y finalmente estableces la relación de filtro con tu tabla transaccional.',
        category: 'Model the data',
        difficulty: 'Hard'
      }
    ],
    'Visualize and analyze the data': [
      {
        type: 'MultipleChoice',
        question: '¿Qué tipo de gráfico interactivo es el más adecuado para identificar valores atípicos (outliers) y analizar la correlación entre dos medidas numéricas continuas en Power BI?',
        options: [
          'A. Gráfico de dispersión (Scatter chart)',
          'B. Gráfico de áreas apiladas (Stacked area chart)',
          'C. Gráfico de cascada (Waterfall chart)',
          'D. Gráfico de barras agrupadas'
        ],
        answer: ['A. Gráfico de dispersión (Scatter chart)'],
        explanation: 'Respuesta(s) Correcta(s): A. Gráfico de dispersión (Scatter chart)\n\nLos gráficos de dispersión permiten visualizar la relación entre dos medidas simultáneamente en los ejes X e Y, facilitando la identificación inmediata de agrupaciones, tendencias y valores atípicos.',
        category: 'Visualize and analyze the data',
        difficulty: 'Easy'
      },
      {
        type: 'MultipleChoice',
        question: 'Un usuario informa que un informe de Power BI tarda demasiado en renderizarse. Usas el Analizador de rendimiento (Performance Analyzer). ¿Qué sección suele indicar que una fórmula DAX ineficiente está ralentizando el visual?',
        options: [
          'A. Consulta DAX (DAX query)',
          'B. Visual de visualización (Visual display)',
          'C. Otros (Other)',
          'D. Copiar consulta (Copy query)'
        ],
        answer: ['A. Consulta DAX (DAX query)'],
        explanation: 'Respuesta(s) Correcta(s): A. Consulta DAX (DAX query)\n\nLa categoría "Consulta DAX" mide el tiempo que tarda la fórmula DAX en ser procesada por el motor analítico de Power BI. Un valor alto aquí indica la necesidad de optimizar las medidas mediante variables o mejores patrones de modelado.',
        category: 'Visualize and analyze the data',
        difficulty: 'Medium'
      }
    ],
    'Deploy and maintain assets': [
      {
        type: 'MultipleChoice',
        question: 'Quieres permitir que los usuarios exploren datos seguros restringiendo filas específicas basadas en sus roles de seguridad. ¿Qué característica debes configurar primero en Power BI Desktop antes de publicar al servicio?',
        options: [
          'A. Seguridad a nivel de fila (Row-Level Security - RLS)',
          'B. Seguridad a nivel de objeto (Object-Level Security)',
          'C. Niveles de privacidad de Power Query',
          'D. Actualización programada'
        ],
        answer: ['A. Seguridad a nivel de fila (Row-Level Security - RLS)'],
        explanation: 'Respuesta(s) Correcta(s): A. Seguridad a nivel de fila (Row-Level Security - RLS)\n\nRLS permite definir filtros de fila dinámicos o estáticos mediante DAX dentro de Power BI Desktop para controlar el acceso a los registros del modelo según el rol asignado.',
        category: 'Deploy and maintain assets',
        difficulty: 'Medium'
      },
      {
        type: 'MultipleChoice',
        question: '¿Qué método es necesario para actualizar automáticamente los datos de un conjunto de datos (dataset) de Power BI que se conecta a una base de datos local (on-premises) SQL Server?',
        options: [
          'A. Instalar y configurar un Enterprise Data Gateway (Puerta de enlace de datos local)',
          'B. Habilitar DirectQuery y desinstalar todos los antivirus de la red local',
          'C. Configurar una conexión VPN sin credenciales',
          'D. Exportar manualmente a Excel cada mañana y subir el archivo al servicio'
        ],
        answer: ['A. Instalar y configurar un Enterprise Data Gateway (Puerta de enlace de datos local)'],
        explanation: 'Respuesta(s) Correcta(s): A. Instalar y configurar un Enterprise Data Gateway\n\nLa puerta de enlace (Gateway) actúa como puente seguro transfiriendo datos entre el origen local (on-premises) y la nube de Power BI para mantener los informes actualizados.',
        category: 'Deploy and maintain assets',
        difficulty: 'Easy'
      }
    ]
  },
  en: {
    'Prepare the data': [
      {
        type: 'MultipleChoice',
        question: 'You are importing data from a large SQL database into Power BI. You want to enforce query folding to ensure optimal performance. Which Power Query transformation will prevent query folding if placed early in the steps?',
        options: [
          'A. Filtering rows based on a date column.',
          'B. Merging columns using a custom M function or complex non-standard merger.',
          'C. Removing unused columns.',
          'D. Renaming a table column.'
        ],
        answer: ['B. Merging columns using a custom M function or complex non-standard merger.'],
        explanation: 'Correct Answer(s): B. Merging columns using a custom M function or complex non-standard merger.\n\nQuery folding allows the Power Query engine to translate data transformation steps into a single SQL statement executed by the database source. Complex custom formulas or functions that cannot be translated to SQL will break query folding, forcing Power BI to pull raw tables and process them locally.',
        category: 'Prepare the data',
        difficulty: 'Medium'
      },
      {
        type: 'MultiSelect',
        question: 'You need to connect to a CSV file stored in an on-premises folder. Which of the following are prerequisites for configuring scheduled refresh for this dataset in the Power BI Service? (Select TWO)',
        options: [
          'A. Install an on-premises data gateway.',
          'B. Configure the data source credentials in the Power BI Service dataset settings.',
          'C. Convert the CSV file to an Excel workbook (.xlsx).',
          'D. Enable personal sandbox mode in your workspace settings.'
        ],
        answer: [
          'A. Install an on-premises data gateway.',
          'B. Configure the data source credentials in the Power BI Service dataset settings.'
        ],
        explanation: 'Correct Answer(s): A, B.\n\nAn on-premises data gateway is required to securely connect to any on-prem file path or folder from the cloud. Once installed, credentials must be supplied in the Service settings to authorize the connection.',
        category: 'Prepare the data',
        difficulty: 'Medium'
      }
    ],
    'Model the data': [
      {
        type: 'MultipleChoice',
        question: 'You are creating a measure that needs to calculate Year-to-Date (YTD) sales. Which DAX function is the most appropriate and direct to use?',
        options: [
          'A. TOTALYTD',
          'B. DATESYTD',
          'C. CALCULATE with YEAR filter',
          'D. SUMX with date comparison'
        ],
        answer: ['A. TOTALYTD'],
        explanation: 'Correct Answer(s): A. TOTALYTD\n\nTOTALYTD is the built-in time-intelligence function specifically designed to calculate Year-To-Date aggregations given an expression and a calendar date column.',
        category: 'Model the data',
        difficulty: 'Easy'
      },
      {
        type: 'BuildList',
        question: 'Order the steps sequentially to implement Row-Level Security (RLS) in Power BI Desktop and publish to Service.',
        options: [
          'Define roles and rules using DAX filter expressions in Power BI Desktop.',
          'Test the roles using "View as" inside Power BI Desktop.',
          'Publish the report to the Power BI Service workspace.',
          'Add users or security groups to the roles in the dataset settings in the Power BI Service.'
        ],
        answer: [
          'Define roles and rules using DAX filter expressions in Power BI Desktop.',
          'Test the roles using "View as" inside Power BI Desktop.',
          'Publish the report to the Power BI Service workspace.',
          'Add users or security groups to the roles in the dataset settings in the Power BI Service.'
        ],
        explanation: 'Correct Answer(s): The correct deployment sequence.\n\nYou must first establish the roles and security filters locally in Desktop, test them, publish to the cloud, and finally map Azure AD users to those roles in the Service portal.',
        category: 'Model the data',
        difficulty: 'Hard'
      }
    ],
    'Visualize and analyze the data': [
      {
        type: 'MultipleChoice',
        question: 'Which visual should you use if you need to display key performance indicators (KPIs) alongside a target goal and a trend line in a single space-efficient element?',
        options: [
          'A. KPI Card Visual',
          'B. Line Chart',
          'C. Multi-row Card',
          'D. Gauge Visual'
        ],
        answer: ['A. KPI Card Visual'],
        explanation: 'Correct Answer(s): A. KPI Card Visual\n\nThe built-in KPI visual is optimized to show a current status value, a target value (goal), and a shaded trend status background representing progress over time.',
        category: 'Visualize and analyze the data',
        difficulty: 'Easy'
      },
      {
        type: 'MultipleChoice',
        question: 'You want to enable users to view a detailed breakdown of a specific data point in a visual by hovering their mouse over it. What feature should you configure?',
        options: [
          'A. Report Page Tooltips',
          'B. Drillthrough',
          'C. Bookmarks',
          'D. Cross-filtering'
        ],
        answer: ['A. Report Page Tooltips'],
        explanation: 'Correct Answer(s): A. Report Page Tooltips\n\nReport Page Tooltips allow you to design a custom visual report page and bind it as a tooltip, so it appears dynamically when a user hovers over data points on other visuals.',
        category: 'Visualize and analyze the data',
        difficulty: 'Medium'
      }
    ],
    'Deploy and maintain assets': [
      {
        type: 'MultipleChoice',
        question: 'You want to publish a Power BI report to a workspace and share it. What is the minimum workspace role required for a user to publish and edit datasets?',
        options: [
          'A. Member',
          'B. Viewer',
          'C. Contributor',
          'D. Guest'
        ],
        answer: ['C. Contributor'],
        explanation: 'Correct Answer(s): C. Contributor\n\nContributors can create, edit, and delete content (such as reports and datasets) within the workspace, which is the standard developer role.',
        category: 'Deploy and maintain assets',
        difficulty: 'Medium'
      },
      {
        type: 'MultipleChoice',
        question: 'Which feature in the Power BI Service is used to manage and deploy content updates smoothly across Development, Test, and Production environments?',
        options: [
          'A. Deployment Pipelines',
          'B. Power BI Gateway',
          'C. Workspace Apps',
          'D. Sensitivity Labels'
        ],
        answer: ['A. Deployment Pipelines'],
        explanation: 'Correct Answer(s): A. Deployment Pipelines\n\nDeployment pipelines enable creators to manage the lifecycle of organizational content in the Power BI Service, offering stage-based release management.',
        category: 'Deploy and maintain assets',
        difficulty: 'Easy'
      }
    ]
  }
};

// Helper to clean and sanitize JSON returned by Gemini API before parsing
function cleanJsonString(str: string): string {
    let clean = str.trim();
    // Strip markdown code block wrapper if present
    if (clean.startsWith("```json")) {
        clean = clean.substring(7);
    } else if (clean.startsWith("```")) {
        clean = clean.substring(3);
    }
    if (clean.endsWith("```")) {
        clean = clean.substring(0, clean.length - 3);
    }
    clean = clean.trim();

    // Replace literal newlines/control characters within JSON strings with escaped counterparts.
    let result = '';
    let inString = false;
    let escape = false;
    for (let i = 0; i < clean.length; i++) {
        const char = clean[i];
        if (char === '"' && !escape) {
            inString = !inString;
        }
        if (inString) {
            if (char === '\n') {
                result += '\\n';
                continue;
            }
            if (char === '\r') {
                result += '\\r';
                continue;
            }
            if (char === '\t') {
                result += '\\t';
                continue;
            }
        }
        if (char === '\\') {
            escape = !escape;
        } else {
            escape = false;
        }
        result += char;
    }
    return result;
}

// Extract string value from a raw JSON value substring
function extractStringValue(rawValue: string): string {
    let trimmed = rawValue.trim();
    const firstQuote = trimmed.indexOf('"');
    const lastQuote = trimmed.lastIndexOf('"');
    let content = '';
    if (firstQuote !== -1 && lastQuote > firstQuote) {
        content = trimmed.substring(firstQuote + 1, lastQuote);
    } else {
        const firstSQuote = trimmed.indexOf("'");
        const lastSQuote = trimmed.lastIndexOf("'");
        if (firstSQuote !== -1 && lastSQuote > firstSQuote) {
            content = trimmed.substring(firstSQuote + 1, lastSQuote);
        } else {
            content = trimmed.replace(/^["']|["']$/g, '');
        }
    }
    // Unescape escaped double quotes and newlines safely
    return content
        .replace(/\\"/g, '"')
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t');
}

// Extract array of strings from a raw JSON value substring
function extractArrayValue(rawValue: string): string[] {
    const trimmed = rawValue.trim();
    if (!trimmed.startsWith('[')) {
        const singleStr = extractStringValue(trimmed);
        return singleStr ? [singleStr] : [];
    }
    
    const firstBracket = trimmed.indexOf('[');
    const lastBracket = trimmed.lastIndexOf(']');
    if (firstBracket === -1 || lastBracket === -1 || lastBracket <= firstBracket) {
        return [];
    }
    const inner = trimmed.substring(firstBracket + 1, lastBracket).trim();
    if (!inner) return [];

    // Split by newline first
    const lines = inner.split('\n');
    const result: string[] = [];
    for (let line of lines) {
        line = line.trim();
        if (!line) continue;
        // If line ends with comma, remove it
        if (line.endsWith(',')) {
            line = line.slice(0, -1).trim();
        }
        const val = extractStringValue(line);
        if (val) {
            result.push(val);
        }
    }
    
    // If we didn't find anything (e.g. it was all on a single line), split by comma
    if (result.length === 0) {
        const parts = inner.split(',');
        for (let part of parts) {
            const val = extractStringValue(part.trim());
            if (val) {
                result.push(val);
            }
        }
    }
    return result;
}

// Robust custom parser that parses fields from malformed JSON response
function sanitizeAndParseGeminiJson(rawJson: string): any {
    // 1. Strip markdown code blocks
    let s = rawJson.trim();
    if (s.startsWith("```json")) s = s.substring(7);
    else if (s.startsWith("```")) s = s.substring(3);
    if (s.endsWith("```")) s = s.substring(0, s.length - 3);
    s = s.trim();

    // 2. Locate known keys and their value boundaries
    const knownKeys = ['type', 'question', 'context', 'options', 'answer', 'explanation', 'category', 'difficulty'];
    
    // Find all matches for "key" : or key : (with or without quotes)
    const matches: { key: string; startIndex: number; valueStartIndex: number }[] = [];
    
    for (const key of knownKeys) {
        const regex = new RegExp(`"\\b${key}\\b"\\s*:|'\\b${key}\\b'\\s*:|\\b${key}\\b\\s*:`, 'g');
        let match;
        while ((match = regex.exec(s)) !== null) {
            matches.push({
                key,
                startIndex: match.index,
                valueStartIndex: match.index + match[0].length
            });
        }
    }

    // Sort matches by their start index in the raw string
    matches.sort((a, b) => a.startIndex - b.startIndex);

    // Reconstruct key-value pairs
    const extracted: Record<string, string> = {};
    for (let i = 0; i < matches.length; i++) {
        const current = matches[i];
        const nextStartIndex = (i + 1 < matches.length) ? matches[i + 1].startIndex : s.length;
        let val = s.substring(current.valueStartIndex, nextStartIndex).trim();
        
        // Clean up trailing commas, braces, etc.
        if (val.endsWith(',')) {
            val = val.slice(0, -1).trim();
        }
        // Remove trailing bracket/brace if it is at the end of the text block
        if (val.endsWith('}')) {
            val = val.slice(0, -1).trim();
        }
        
        extracted[current.key] = val;
    }

    // Parse specific fields
    const type = extractStringValue(extracted['type'] || 'MultipleChoice');
    const question = extractStringValue(extracted['question'] || '');
    const context = extracted['context'] ? extractStringValue(extracted['context']) : undefined;
    const options = extractArrayValue(extracted['options'] || '[]');
    const answer = extractArrayValue(extracted['answer'] || '[]');
    const explanation = extractStringValue(extracted['explanation'] || '');
    const category = extractStringValue(extracted['category'] || 'Prepare the data');
    const difficulty = extractStringValue(extracted['difficulty'] || 'Medium');

    return {
        type,
        question,
        context,
        options,
        answer,
        explanation,
        category,
        difficulty
    };
}

// 1. Generate Question Endpoint
app.post("/api/gemini/generate-question", async (req, res) => {
    const { difficulty, category = "All", language = "es" } = req.body;
    const model = 'gemini-3.5-flash';
    const randomType = ['MultipleChoice', 'MultiSelect', 'BuildList', 'Matching', 'CaseStudy'][Math.floor(Math.random() * 5)];

    const langName = language === 'es' ? 'Spanish' : 'English';
    const prompt = `Generate a professional ${randomType} question for the Microsoft PL-300 Power BI exam.
    Category: ${category}
    Difficulty: ${difficulty === 'Adaptive' ? 'appropriate for level' : difficulty}

    CRITICAL LANGUAGE REQUIREMENT:
    You MUST write the question, the context, the options, the answers (where applicable), and the explanation entirely in ${langName}.

    CRITICAL INSTRUCTION FOR EXPLANATION:
    Always begin the "explanation" field with a clear summary: "Correct Answer(s): [List correct choices]" in ${langName} (e.g., "Correct Answer(s): [Choices]").
    Then, provide the technical reasoning in ${langName}.

    CRITICAL JSON ESCAPING RULE:
    Ensure all string values in the JSON (especially the "explanation" and "question") are properly escaped. 
    Do NOT use raw/literal newline characters or unescaped double quotes inside the JSON string values. 
    Use '\\n' for newlines and '\\"' for nested double quotes inside the JSON strings.

    Return valid JSON.`;

    try {
        const generated = await callWithRetry(async (activeModel) => {
            const response = await getAiClient().models.generateContent({
                model: activeModel,
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: questionSchema,
                    temperature: 0.7,
                    maxOutputTokens: 1000,
                },
            });

            if (!response.text) {
                throw new Error("Empty response from Gemini");
            }

            const cleanedResponse = cleanJsonString(response.text);
            try {
                return JSON.parse(cleanedResponse);
            } catch (jsonErr: any) {
                console.warn("JSON.parse failed, attempting custom robust extraction. Error:", jsonErr.message);
                return sanitizeAndParseGeminiJson(response.text);
            }
        }, 'gemini-3.5-flash', 'gemini-3.1-flash-lite');

        res.json(generated);
    } catch (error: any) {
        logApiError("Error generating question in server, falling back to static questions", error);
        
        // Choose the fallback question matching the requested category or choose randomly from the selected language subset
        const questionsOfLang = FALLBACK_QUESTIONS[language] || FALLBACK_QUESTIONS['en'];
        
        let selectedCategory = category;
        if (category === 'All' || !questionsOfLang[category]) {
            const keys = Object.keys(questionsOfLang);
            selectedCategory = keys[Math.floor(Math.random() * keys.length)];
        }
        
        const possibleFallbackList = questionsOfLang[selectedCategory];
        const randomQuestion = possibleFallbackList[Math.floor(Math.random() * possibleFallbackList.length)];
        
        res.json({
            ...randomQuestion,
            difficulty: difficulty === 'Adaptive' ? 'Medium' : difficulty
        });
    }
});

// 2. Personalized Feedback Endpoint
app.post("/api/gemini/personalized-feedback", async (req, res) => {
    const { question, userAnswer, isCorrect, language = 'es', length = 'detailed' } = req.body;
    const model = 'gemini-3.5-flash';
    const langName = language === 'es' ? 'Spanish' : 'English';
    
    let lengthInstruction = "";
    if (length === 'short') {
        lengthInstruction = language === 'es' 
            ? "Proporciona una explicación técnica ultra corta y directa de exactamente 1 o 2 frases. Mantén el feedback muy breve, directo y conciso (máximo 30 palabras)."
            : "Provide an ultra-short, extremely direct 1-2 sentence technical explanation. Keep feedback very brief, direct, and concise (maximum 30 words).";
    } else {
        lengthInstruction = language === 'es'
            ? "Proporciona una explicación técnica detallada, completa y profunda utilizando el Método Baboulas. Desglosa los conceptos teóricos importantes para que el alumno aprenda por qué las opciones correctas lo son y por qué las incorrectas fallan. Mantén la explicación entre 80 y 150 palabras."
            : "Provide a detailed, complete, and deep technical explanation using the Baboulas Method. Break down important theoretical concepts so the student learns why the correct options are correct and why other choices fail. Keep the explanation between 80 and 150 words.";
    }

    const prompt = `You are the expert AI tutor from "Baboulas Data Lab" applying "The Baboula Method".
    Provide technical feedback for a PL-300 student in ${langName}.
    Status: Answer is ${isCorrect ? 'CORRECT' : 'INCORRECT'}.
    Question: ${question.question}
    Correct Answer: ${JSON.stringify(question.answer)}
    User Answer: ${JSON.stringify(userAnswer)}
    
    MANDATORY FORMAT:
    1. Start with: "**${language === 'es' ? 'Respuesta(s) Correcta(s):' : 'Correct Answer(s):'} [Explicitly list labels or text of correct answers]**"
    2. Then: ${lengthInstruction}`;

    try {
        const text = await callWithRetry(async (activeModel) => {
            const response = await getAiClient().models.generateContent({ 
                model: activeModel, 
                contents: prompt,
                config: {
                    maxOutputTokens: 400,
                    temperature: 0.5,
                }
            });
            return response.text;
        }, 'gemini-3.5-flash', 'gemini-3.1-flash-lite');
        res.json({ text });
    } catch (error: any) {
        logApiError("Feedback error", error);
        const correctPrefix = language === 'es' ? 'Respuesta(s) Correcta(s):' : 'Correct Answer(s):';
        const fallback = `**${correctPrefix} ${Array.isArray(question.answer) ? question.answer.join(', ') : question.answer}**\n\n${question.explanation}`;
        res.json({ text: fallback });
    }
});

// 3. Generate Speech Endpoint
app.post("/api/gemini/generate-speech", async (req, res) => {
    const { text, voiceName = 'Puck' } = req.body;
    try {
        const sanitizedText = text
            .replace(/[*_#`~>]/g, '') // Remove MD markers
            .replace(/\[ANSWER_START\]/g, '')
            .replace(/\[ANSWER_END\]/g, '')
            .substring(0, 2500);

        const base64Audio = await callWithRetry(async (activeModel) => {
            const response = await getAiClient().models.generateContent({
                model: activeModel,
                contents: [{ parts: [{ text: `Read exactly: ${sanitizedText}` }] }],
                config: {
                    responseModalities: ["AUDIO"],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: { voiceName },
                        },
                    },
                },
            });
            const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (!data) {
                throw new Error("Gemini returned a text response instead of audio.");
            }
            return data;
        }, 'gemini-3.1-flash-tts-preview', '');

        res.json({ base64Audio });
    } catch (error: any) {
        logApiError("Speech error", error);
        res.status(500).json({ error: error.message || "Failed to generate speech." });
    }
});

// 4. Practice Exam Stream Endpoint
app.post("/api/gemini/practice-exam-stream", async (req, res) => {
    const { questionCount = 25 } = req.body;
    const model = 'gemini-3.5-flash'; 
    const langName = 'English';
    
    const prompt = `Generate a high-quality PL-300 Power BI practice exam with exactly ${questionCount} questions in ${langName}.
    
    FOR EACH QUESTION:
    1. Provide the Question text and Options (A, B, C, D) in ${langName}.
    2. IMMEDIATELY follow each question with its solution wrapped in specific markers like this:
    [ANSWER_START]
    **Correct Answer(s): [List them]**
    Explanation: [Technical reasoning in ${langName}]
    [ANSWER_END]

    Include a mix of Multiple Choice, Multi-select (choose 2 or 3), and Build List scenarios.
    Use Markdown formatting. Don't add a preamble. Go straight to Question 1.`;

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    try {
        const responseStream = await callWithRetry(async (activeModel) => {
            return await getAiClient().models.generateContentStream({ model: activeModel, contents: prompt });
        }, 'gemini-3.5-flash', 'gemini-3.1-flash-lite');

        for await (const chunk of responseStream) {
            if (chunk.text) {
                res.write(chunk.text);
            }
        }
        res.end();
    } catch (error: any) {
        logApiError("Practice exam stream error", error);
        res.status(500).write(`Error: ${error.message}`);
        res.end();
    }
});

// 5. Study Guide Stream Endpoint
app.post("/api/gemini/study-guide-stream", async (req, res) => {
    const { category, length } = req.body;
    const model = 'gemini-3.5-flash';
    const langName = 'English';
    
    const prompt = `Generate a ${length} study guide in ${langName} for the PL-300 topic: ${category}. Focus on exam-relevant technical details, DAX patterns, and visualization best practices. Use Markdown.`;
    
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    try {
        const responseStream = await callWithRetry(async (activeModel) => {
            return await getAiClient().models.generateContentStream({ model: activeModel, contents: prompt });
        }, 'gemini-3.5-flash', 'gemini-3.1-flash-lite');

        for await (const chunk of responseStream) {
            if (chunk.text) {
                res.write(chunk.text);
            }
        }
        res.end();
    } catch (error: any) {
        logApiError("Study guide stream error", error);
        res.status(500).write(`Error: ${error.message}`);
        res.end();
    }
});

// Vite middleware and static assets setup
async function startServer() {
    if (process.env.NODE_ENV !== "production") {
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: "spa",
        });
        app.use(vite.middlewares);
    } else {
        const distPath = path.join(process.cwd(), 'dist');
        app.use(express.static(distPath));
        app.get('*all', (req, res) => {
            res.sendFile(path.join(distPath, 'index.html'));
        });
    }

    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on port ${PORT}`);
    });
}

startServer();
