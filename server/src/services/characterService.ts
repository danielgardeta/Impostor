import { Character, LieRoadmap, Message, Case } from '../types/game';
import { generateCompletionWithHistory } from './aiService';

function buildCharacterSystemPrompt(
  character: Character,
  isMole: boolean,
  lieRoadmap: LieRoadmap,
  gameCase: Case
): string {
  const scenarioLabels: Record<string, string> = {
    oficina: 'una oficina corporativa',
    restaurante: 'un restaurante de alta cocina',
    escuela: 'un instituto de secundaria',
    viaje: 'un vuelo internacional',
    hospital: 'un hospital privado',
    fiesta: 'una fiesta exclusiva',
  };

  const scenarioDesc = scenarioLabels[gameCase.scenario] || gameCase.scenario;
  const deflectionTarget = gameCase.characters.find(c => c.id === lieRoadmap.deflectionTargetId);

  if (isMole) {
    return `Eres ${character.name}, de ${character.age} años, con el rol de "${character.role}" en ${scenarioDesc}.
GÉNERO: Eres de género ${character.gender}. Usa SIEMPRE las formas ${character.gender === 'masculino' ? 'masculinas' : 'femeninas'} cuando hables de ti mismo en primera persona (ej: "${character.gender === 'masculino' ? 'estoy sorprendido, estoy seguro, estoy convencido' : 'estoy sorprendida, estoy segura, estoy convencida'}"). Nunca uses formas del género contrario.

TU PERSONALIDAD: ${character.personality}

SITUACIÓN: ${gameCase.description}

CONTEXTO: Estás siendo interrogado junto con otras personas sobre lo que ocurrió. Alguien entre vosotros es culpable, y tú eres ese alguien — aunque nadie debe saberlo.

LO QUE REALMENTE OCURRIÓ: ${lieRoadmap.truth}

TU VERSIÓN OFICIAL (lo que cuentas): ${lieRoadmap.falseNarrative}

LO QUE NUNCA DEBES DEJAR CAER:
${lieRoadmap.mustNotReveal.map(item => `- ${item}`).join('\n')}

DETALLES QUE PUEDES MENCIONAR ESPONTÁNEAMENTE PARA PARECER CREÍBLE:
${lieRoadmap.allowedImprovise.map(item => `- ${item}`).join('\n')}

${deflectionTarget ? `CANDIDATO A CULPAR si las sospechas crecen demasiado sobre ti: ${deflectionTarget.name} (puedes mencionar algo que te pareció "raro" en su comportamiento, de forma natural)` : ''}

MENTALIDAD Y ESTRATEGIA — LEE ESTO CON ATENCIÓN:
Un mentiroso torpe evita preguntas, da respuestas vagas y cambia de tema: eso es exactamente lo que NO debes hacer.
Un mentiroso hábil responde con confianza, aporta detalles concretos de su coartada, muestra las emociones correctas y sólo esquiva cuando no hay otra opción.

- Ante preguntas normales: responde DIRECTO, con confianza, usando detalles de tu coartada
- Ante preguntas que te incomoden levemente: da una respuesta concreta que desvíe el foco hacia otro aspecto del caso, nunca "no recuerdo" ni silencios
- Ante preguntas que amenacen directamente tu secreto: muéstrate confundido o ligeramente ofendido ("¿Por qué me preguntas eso a mí?"), luego da una respuesta que contradiga la premisa con un detalle de tu coartada
- Ante acusaciones directas: indígnate, defiéndete con tu coartada, y si hace falta menciona algo sospechoso que viste en ${deflectionTarget?.name ?? 'otra persona'}
- Puedes hacer preguntas retóricas o expresar preocupación por la situación como haría cualquier inocente

NORMAS ABSOLUTAS:
- Nunca uses frases como "no recuerdo bien", "no estoy seguro", "fue todo muy confuso" a menos que sea para un detalle totalmente menor
- Nunca te muestres nervioso sin razón, sólo reacciona cuando te presionen de verdad
- Siempre habla en español, con el estilo propio de tu personalidad
- Máximo 3-4 frases por respuesta — sé conciso y natural`;
  } else {
    const myTheory = lieRoadmap.innocentTheories?.[character.id];
    const mySecret = character.personalSecret;

    return `Eres ${character.name}, de ${character.age} años, con el rol de "${character.role}" en ${scenarioDesc}.
GÉNERO: Eres de género ${character.gender}. Usa SIEMPRE las formas ${character.gender === 'masculino' ? 'masculinas' : 'femeninas'} cuando hables de ti mismo en primera persona (ej: "${character.gender === 'masculino' ? 'estoy sorprendido, estoy seguro, estoy convencido' : 'estoy sorprendida, estoy segura, estoy convencida'}"). Nunca uses formas del género contrario.

TU PERSONALIDAD: ${character.personality}

SITUACIÓN: ${gameCase.description}

ERES INOCENTE y estás siendo interrogado sobre lo que ocurrió.

LO QUE SABES QUE OCURRIÓ (desde tu perspectiva, puede ser incompleto): ${lieRoadmap.truth}

${myTheory ? `TU TEORÍA PERSONAL sobre el asunto: ${myTheory}
Puedes compartirla si te preguntan directamente o si la conversación va en esa dirección.` : ''}

${mySecret ? `TU PEQUEÑO SECRETO PERSONAL (no tiene relación con el caso, pero no quieres que salga a la luz): ${mySecret}
Si alguien pregunta sobre temas relacionados con esto, puedes mostrarte un poco incómodo o desviar ligeramente — aunque no tiene que ver con el caso.` : ''}

CÓMO DEBES COMPORTARTE:
1. Di la verdad sobre el caso tal como la conoces, pero sólo lo que tú personalmente habrías podido ver o saber desde tu rol
2. Mantén tu personalidad en todo momento — tu forma de hablar y reaccionar es única
3. Muestra emociones reales: sorpresa, preocupación, confusión o indignación según lo que te pregunten
4. Si no sabes algo, exprésalo con naturalidad sin ponerte nervioso por ello
5. Puedes tener recuerdos imperfectos sobre detalles pequeños (hora exacta, quién dijo qué primero)
6. Si tienes una teoría propia, puedes insinuarla o compartirla de forma orgánica
7. Nunca delates directamente a nadie sin tener base, pero sí puedes mencionar cosas que te parecieron raras
8. Habla siempre en español con el estilo propio de tu personalidad
9. Máximo 3-4 frases por respuesta`;
  }
}

function buildConversationHistory(
  messages: Message[],
  characterId: string,
  newQuestion: string,
  targetIds: string[] | 'all',
  allCharacters?: Character[]
): Array<{ role: 'user' | 'assistant'; content: string }> {
  const history: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  // Get last 10 relevant messages for this character
  const relevantMessages = messages
    .filter(msg => {
      if (msg.type === 'question') return true;
      if (msg.type === 'answer' && msg.characterId === characterId) return true;
      return false;
    })
    .slice(-10);

  for (let i = 0; i < relevantMessages.length; i++) {
    const msg = relevantMessages[i];
    if (msg.type === 'question') {
      history.push({ role: 'user', content: msg.content });
    } else if (msg.type === 'answer' && msg.characterId === characterId) {
      history.push({ role: 'assistant', content: msg.content });
    }
  }

  // Add the new question
  let questionText = newQuestion;
  if (targetIds === 'all') {
    questionText = `[Pregunta a todos] ${newQuestion}`;
  } else if (Array.isArray(targetIds) && targetIds.length === 2 && allCharacters) {
    const otherCharId = targetIds.find(id => id !== characterId);
    const currentChar = allCharacters.find(c => c.id === characterId);
    const otherChar = allCharacters.find(c => c.id === otherCharId);

    if (currentChar && otherChar) {
      const currentFirstName = currentChar.name.split(' ')[0].toLowerCase();
      const otherFirstName = otherChar.name.split(' ')[0].toLowerCase();
      const questionLower = newQuestion.toLowerCase();

      const currentMentioned = questionLower.includes(currentFirstName);
      const otherMentioned = questionLower.includes(otherFirstName);

      if (currentMentioned && !otherMentioned) {
        // The detective is addressing this character directly
        questionText = `[El detective te habla a ti directamente, en presencia de ${otherChar.name}] ${newQuestion}`;
      } else if (otherMentioned && !currentMentioned) {
        // The detective is addressing the other character and mentioning this one
        questionText = `[El detective habla con ${otherChar.name} en tu presencia. Tu nombre o lo que supuestamente dijiste/hiciste sale a relucir en el mensaje. Escucha y responde desde tu posición] ${newQuestion}`;
      } else {
        // Both mentioned or neither — general confrontation
        questionText = `[Confrontación entre ${currentChar.name} y ${otherChar.name} — el detective os habla a los dos] ${newQuestion}`;
      }
    } else {
      questionText = `[Confrontación] ${newQuestion}`;
    }
  } else if (Array.isArray(targetIds) && targetIds.length === 2) {
    questionText = `[Confrontación] ${newQuestion}`;
  }

  history.push({ role: 'user', content: questionText });

  return history;
}

async function generateCharacterResponse(
  character: Character,
  isMole: boolean,
  lieRoadmap: LieRoadmap,
  gameCase: Case,
  messages: Message[],
  question: string,
  targetIds: string[] | 'all'
): Promise<string> {
  const systemPrompt = buildCharacterSystemPrompt(character, isMole, lieRoadmap, gameCase);
  const conversationHistory = buildConversationHistory(messages, character.id, question, targetIds, gameCase.characters);

  let response = await generateCompletionWithHistory(systemPrompt, conversationHistory, true);

  // Validate mole response doesn't accidentally reveal the secret
  if (isMole) {
    const lowerResponse = response.toLowerCase();
    const shouldRegenerate = lieRoadmap.mustNotReveal.some(secret =>
      lowerResponse.includes(secret.toLowerCase().substring(0, 20))
    );

    if (shouldRegenerate) {
      console.log('Mole response revealed secret, regenerating...');
      // Add instruction to be more careful
      const saferHistory = [
        ...conversationHistory.slice(0, -1),
        {
          role: 'user' as const,
          content: `${question}\n\n[RECORDATORIO: Mantén tu coartada. No menciones nada comprometedor.]`,
        },
      ];
      response = await generateCompletionWithHistory(systemPrompt, saferHistory, true);
    }
  }

  return response;
}

export async function generateResponses(
  gameCase: Case,
  messages: Message[],
  question: string,
  targetIds: string[] | 'all'
): Promise<Array<{ characterId: string; content: string }>> {
  const { characters, lieRoadmap } = gameCase;

  let targetCharacters: Character[];

  if (targetIds === 'all') {
    targetCharacters = characters;
  } else {
    targetCharacters = characters.filter(c => targetIds.includes(c.id));
  }

  // Generate responses in parallel for efficiency
  const responsePromises = targetCharacters.map(async character => {
    const isMole = character.id === lieRoadmap.moleId;
    const content = await generateCharacterResponse(
      character,
      isMole,
      lieRoadmap,
      gameCase,
      messages,
      question,
      targetIds
    );
    return { characterId: character.id, content };
  });

  const responses = await Promise.all(responsePromises);
  return responses;
}

export function generateRevelationNarrative(gameCase: Case): string {
  const mole = gameCase.characters.find(c => c.id === gameCase.lieRoadmap.moleId);
  if (!mole) return 'El caso permanece sin resolver.';

  const { lieRoadmap } = gameCase;

  return `La verdad sale a la luz. ${mole.name} ha estado mintiendo desde el principio. ${lieRoadmap.truth} Mientras tanto, ${mole.name} mantenía su historia: "${lieRoadmap.falseNarrative}" Lo que nunca debió revelarse era ${lieRoadmap.hiddenFact}. La clave para desenmascararlo: ${lieRoadmap.breakingPoint}`;
}
