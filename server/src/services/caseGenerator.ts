import { v4 as uuidv4 } from 'uuid';
import { Case, Character, LieRoadmap, Difficulty, Scenario, GameMode } from '../types/game';
import { generateCompletion } from './aiService';

const scenarioLabels: Record<Scenario, string> = {
  oficina: 'una oficina corporativa',
  restaurante: 'un restaurante de alta cocina',
  escuela: 'un instituto de secundaria',
  viaje: 'un vuelo internacional',
  hospital: 'un hospital privado',
  fiesta: 'una fiesta exclusiva',
};

const difficultyInstructions: Record<Difficulty, string> = {
  bisoño: `
    El topo comete errores evidentes: contradice fechas o lugares claramente si se le pregunta directamente,
    usa frases vagas sospechosas como "no recuerdo bien", y su narrativa tiene agujeros obvios.
    Las pistas son directas y fáciles de detectar en 4-6 preguntas.
  `,
  detective: `
    El topo es bastante convincente pero tiene inconsistencias menores en los detalles.
    Contradice detalles secundarios (hora exacta, con quién estaba) si se le presiona.
    Las pistas requieren preguntas cruzadas entre personajes para detectar.
  `,
  inquisidor: `
    El topo tiene una coartada sólida y solo falla ante preguntas muy específicas y técnicas.
    Mantiene coherencia general pero hay un detalle técnico o factual que no cuadra si se investiga.
    Detectar al topo requiere usar bien el presupuesto de preguntas.
  `,
  maestro: `
    El topo es casi perfecto. Tiene una coartada impecable con detalles convincentes.
    Solo se puede desenmascarar con una confrontación directa entre dos personajes específicos
    o con la pregunta exacta sobre el punto de quiebre de su coartada.
    La mentira es sofisticada y el topo puede desviar hábilmente.
  `,
};

function buildCaseGenerationPrompt(
  difficulty: Difficulty,
  scenario: Scenario,
  seed?: string
): string {
  const scenarioDesc = scenarioLabels[scenario];
  const difficultyDesc = difficultyInstructions[difficulty];
  const seedNote = seed ? `Semilla para consistencia: ${seed}` : '';

  return `Eres el director de un juego de detectives noir llamado MOLE. Debes generar un caso completo.
El escenario es ${scenarioDesc}.
${seedNote}

DIFICULTAD: ${difficulty.toUpperCase()}
${difficultyDesc}

Genera un caso completo en JSON con exactamente esta estructura. Devuelve SOLO el JSON, sin markdown, sin explicaciones:

{
  "title": "Título atmosférico noir de 3-6 palabras en español",
  "description": "2-3 frases de atmósfera noir que describen la situación general del escenario. Crea tensión y misterio. Escrito en presente. NO menciones el nombre de ningún personaje — describe el ambiente, no a las personas.",
  "characters": [
    {
      "id": "char_1",
      "name": "Nombre completo español",
      "age": número entre 25-55,
      "role": "Rol/trabajo en el escenario (ej: Directora de Marketing)",
      "personality": "Descripción de personalidad en 8-12 palabras (ej: Meticulosa, controladora, desconfía de todos excepto ella misma)",
      "avatar": "Una letra mayúscula (la inicial del nombre)",
      "gender": "masculino o femenino según el nombre del personaje",
      "isMole": false,
      "personalSecret": "Un secreto personal menor que este personaje oculta y que NO tiene relación directa con el crimen principal. Debe ser creíble y hacer que el personaje parezca ligeramente evasivo en ciertos temas."
    },
    {
      "id": "char_2",
      "name": "Nombre completo español",
      "age": número entre 25-55,
      "role": "Rol/trabajo diferente al anterior",
      "personality": "Descripción de personalidad diferente",
      "avatar": "Inicial del nombre",
      "gender": "masculino o femenino según el nombre del personaje",
      "isMole": true,
      "personalSecret": null
    },
    {
      "id": "char_3",
      "name": "Nombre completo español",
      "age": número entre 25-55,
      "role": "Rol/trabajo diferente",
      "personality": "Descripción de personalidad diferente",
      "avatar": "Inicial del nombre",
      "gender": "masculino o femenino según el nombre del personaje",
      "isMole": false,
      "personalSecret": "Un secreto personal menor diferente al de los otros personajes."
    },
    {
      "id": "char_4",
      "name": "Nombre completo español",
      "age": número entre 25-55,
      "role": "Rol/trabajo diferente",
      "personality": "Descripción de personalidad diferente",
      "avatar": "Inicial del nombre",
      "gender": "masculino o femenino según el nombre del personaje",
      "isMole": false,
      "personalSecret": "Un secreto personal menor diferente al de los otros personajes."
    }
  ],
  "lieRoadmap": {
    "truth": "Lo que realmente ocurrió. 2-4 frases detalladas. Este es el hecho que el topo está ocultando.",
    "moleId": "char_2",
    "hiddenFact": "El hecho específico y concreto que el topo oculta. 1-2 frases.",
    "falseNarrative": "La historia alternativa que el topo cuenta. Debe ser plausible y convincente, con detalles concretos que parezcan creíbles. 2-3 frases.",
    "allowedImprovise": [
      "Detalle concreto y específico que el topo puede añadir para parecer más creíble (no vago, sino preciso)",
      "Otro detalle que refuerza su coartada con naturalidad",
      "Reacción emocional o impresión que el topo puede expresar como si fuera inocente"
    ],
    "mustNotReveal": [
      "Dato muy concreto que, si se menciona, delata al topo inmediatamente",
      "Otro detalle técnico o factual que contradice su coartada",
      "Conexión específica entre el topo y lo ocurrido"
    ],
    "breakingPoint": "La pregunta muy concreta, o la confrontación entre dos personajes específicos, que destruye la coartada del topo. Debe requerir cruzar información de múltiples respuestas o hacer la pregunta exacta.",
    "deflectionTargetId": "El id (char_1, char_3 o char_4) del personaje inocente al que el topo puede intentar desviar las sospechas de forma creíble",
    "innocentTheories": {
      "char_1": "La teoría personal de este personaje inocente sobre lo que ocurrió. Puede ser parcialmente incorrecta pero plausible.",
      "char_3": "La teoría personal de este personaje inocente. Debe diferir de la de char_1.",
      "char_4": "La teoría personal de este personaje inocente. Diferente a las anteriores."
    }
  }
}

IMPORTANTE:
- El personaje con "isMole: true" DEBE ser char_2 en este ejemplo pero elige cualquier id de char_1 a char_4
- El "deflectionTargetId" en lieRoadmap debe ser el id de uno de los personajes INOCENTES (no el topo), que tenga algún motivo aparente para ser sospechoso
- Los secretos personales (personalSecret) de los inocentes deben hacer que parezcan ligeramente evasivos en algún tema — esto crea ambigüedad y dificulta detectar al topo
- Las teorías de los inocentes (innocentTheories) deben ser distintas entre sí y algunas pueden señalar al topo o a otros inocentes equivocadamente
- Asegúrate de que los 4 personajes tengan personalidades MUY distintas y estilos de habla diferentes
- La historia debe tener lógica interna consistente
- El escenario "${scenario}" debe ser central en la trama
- Crea personajes memorables con nombres españoles auténticos
- La verdad debe ser intrigante pero no inverosímil
- La coartada del topo debe ser CONVINCENTE y detallada, no obvia
- El campo "description" NO debe contener nombres de personajes — es atmosférico, no acusatorio`;
}

export async function generateCase(
  difficulty: Difficulty,
  scenario: Scenario,
  mode: GameMode,
  date?: string
): Promise<Case> {
  const seed = mode === 'daily' ? (date || new Date().toISOString().split('T')[0]) : undefined;

  const prompt = buildCaseGenerationPrompt(difficulty, scenario, seed);

  let rawJson: string;
  try {
    rawJson = await generateCompletion(
      'Eres un experto diseñador de juegos de detectives con estilo noir. Generas casos de juego complejos y emocionantes en formato JSON perfectamente válido.',
      prompt,
      false
    );
  } catch (error) {
    throw new Error(`Failed to generate case from AI: ${error}`);
  }

  // Clean the response - remove any markdown code blocks if present
  let cleanJson = rawJson.trim();
  if (cleanJson.startsWith('```')) {
    cleanJson = cleanJson.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  }

  let caseData: {
    title: string;
    description: string;
    characters: Character[];
    lieRoadmap: LieRoadmap;
  };

  try {
    caseData = JSON.parse(cleanJson);
  } catch (parseError) {
    console.error('Failed to parse AI response as JSON:', cleanJson.substring(0, 500));
    throw new Error('AI generated invalid JSON for case');
  }

  // Validate required fields
  if (!caseData.title || !caseData.description || !caseData.characters || !caseData.lieRoadmap) {
    throw new Error('AI response missing required fields');
  }

  if (!Array.isArray(caseData.characters) || caseData.characters.length !== 4) {
    throw new Error('AI response must have exactly 4 characters');
  }

  const moleExists = caseData.characters.some(c => c.isMole === true);
  if (!moleExists) {
    throw new Error('AI response must have exactly one mole character');
  }

  const moleChar = caseData.characters.find(c => c.isMole === true);
  if (moleChar && moleChar.id !== caseData.lieRoadmap.moleId) {
    caseData.lieRoadmap.moleId = moleChar.id;
  }

  // Ensure deflectionTargetId points to an innocent character
  const innocentIds = caseData.characters.filter(c => !c.isMole).map(c => c.id);
  if (!innocentIds.includes(caseData.lieRoadmap.deflectionTargetId)) {
    caseData.lieRoadmap.deflectionTargetId = innocentIds[0];
  }

  // Ensure innocentTheories only has entries for innocent characters
  if (!caseData.lieRoadmap.innocentTheories) {
    caseData.lieRoadmap.innocentTheories = {};
  }
  for (const id of Object.keys(caseData.lieRoadmap.innocentTheories)) {
    if (!innocentIds.includes(id)) {
      delete caseData.lieRoadmap.innocentTheories[id];
    }
  }

  // Clear personalSecret from the mole character
  if (moleChar) {
    moleChar.personalSecret = undefined;
  }

  // Remove character names from the description to avoid spoiling the mole
  const characterNames = caseData.characters.flatMap(c => c.name.split(' '));
  let safeDescription = caseData.description;
  for (const namePart of characterNames) {
    if (namePart.length > 2) {
      safeDescription = safeDescription.replace(new RegExp(`\\b${namePart}\\b`, 'gi'), '***');
    }
  }
  caseData.description = safeDescription;

  const caseId = seed ? `daily_${seed}` : uuidv4();

  const generatedCase: Case = {
    id: caseId,
    date: seed,
    scenario,
    difficulty,
    title: caseData.title,
    description: caseData.description,
    characters: caseData.characters,
    lieRoadmap: caseData.lieRoadmap,
  };

  return generatedCase;
}

export function stripMoleInfo(characters: Character[]): Character[] {
  return characters.map(({ isMole, ...rest }) => rest);
}
