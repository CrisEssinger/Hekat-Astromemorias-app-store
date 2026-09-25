import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import admin from "firebase-admin";
import { GoogleGenAI } from "@google/genai";
import { julday, calc_ut, constants } from "sweph";

// Initialize Gemini AI securely on the server
let aiClient: GoogleGenAI | null = null;
function getAI() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY environment variable not set on the server.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Resilient helper to call Gemini with fast model order, staggered parallel fallback and optimal latency
async function generateWithGemini(contents: string, systemInstruction?: string): Promise<string> {
  const ai = getAI();
  // Fast, responsive models prioritized first
  const models = [
    "gemini-3-flash-preview",
    "gemini-3.1-flash-lite",
    "gemini-3.5-flash-lite",
    "gemini-3.5-flash"
  ];

  const callModel = async (model: string, timeoutMs = 6000): Promise<string> => {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout on model ${model}`)), timeoutMs)
    );
    const response = await Promise.race([
      ai.models.generateContent({
        model,
        contents,
        config: systemInstruction ? { systemInstruction } : undefined,
      }),
      timeoutPromise
    ]);

    if (response && response.text) {
      return response.text.trim();
    }
    throw new Error(`Empty response from ${model}`);
  };

  // Staggered race: initiate primary model immediately
  // If primary has not responded within 2200ms, launch secondary model in parallel
  let primaryPromise: Promise<string>;
  try {
    primaryPromise = callModel(models[0], 6000);
  } catch (err) {
    primaryPromise = Promise.reject(err);
  }

  const staggeredPromise = new Promise<string>((resolve, reject) => {
    const timer = setTimeout(() => {
      // Launch secondary model concurrently
      callModel(models[1], 5500)
        .then(resolve)
        .catch(() => {
          // If secondary also fails, try third
          callModel(models[2], 5000).then(resolve).catch(reject);
        });
    }, 2200);

    // If primary resolves first, clear timer
    primaryPromise.then(
      val => {
        clearTimeout(timer);
        resolve(val);
      },
      () => {
        // If primary rejects immediately (e.g. 503 error), kick off secondary right away
        clearTimeout(timer);
        callModel(models[1], 5500)
          .then(resolve)
          .catch(() => {
            callModel(models[2], 5000).then(resolve).catch(reject);
          });
      }
    );
  });

  try {
    return await Promise.race([primaryPromise, staggeredPromise]);
  } catch {
    // If racing fails, sequentially try any remaining candidate
    for (let i = 2; i < models.length; i++) {
      try {
        return await callModel(models[i], 5000);
      } catch {
        // continue
      }
    }
    throw new Error("All Gemini models temporarily unavailable");
  }
}

// Elegantly styled fallback generator matching Hekat's strict brand guidelines and voice (fluid, simple, profound astrological wisdom without technical labels or awkward punctuation)
function generateFallbackOracle(sunSignName?: string, moonSignName?: string, philosophicalPhrase?: string, userName?: string, aspectDesc?: string): string {
  const sunRaw = (sunSignName || 'Touro').trim();
  const moonRaw = (moonSignName || 'Peixes').trim();
  const sun = sunRaw.toLowerCase();
  const moon = moonRaw.toLowerCase();
  const nameIntro = userName ? `${userName}, ` : '';
  
  // Arquétipos astrológicos naturais e acolhedores
  const archetypes: Record<string, string> = {
    'áries': 'a coragem e a iniciativa de Áries',
    'aries': 'a coragem e a iniciativa de Áries',
    'touro': 'a persistência e o valor real de Touro',
    'gêmeos': 'a mente curiosa e a comunicação de Gêmeos',
    'gemeos': 'a mente curiosa e a comunicação de Gêmeos',
    'câncer': 'o afeto acolhedor e as raízes de Câncer',
    'cancer': 'o afeto acolhedor e as raízes de Câncer',
    'leão': 'o brilho nobre e a generosidade de Leão',
    'leao': 'o brilho nobre e a generosidade de Leão',
    'virgem': 'o discernimento lúcido e o cuidado de Virgem',
    'libra': 'a busca de harmonia e ponderação de Libra',
    'escorpião': 'a profundidade e o poder de transformação de Escorpião',
    'escorpiao': 'a profundidade e o poder de transformação de Escorpião',
    'sagitário': 'a visão ampla e o entusiasmo de Sagitário',
    'sagitario': 'a visão ampla e o entusiasmo de Sagitário',
    'capricórnio': 'a maturidade serena e a paciência de Capricórnio',
    'capricornio': 'a maturidade serena e a paciência de Capricórnio',
    'aquário': 'a liberdade de pensamento e a renovação de Aquário',
    'aquario': 'a liberdade de pensamento e a renovação de Aquário',
    'peixes': 'a sensibilidade empática e a intuição de Peixes'
  };

  const getElement = (sign: string): 'FOGO' | 'TERRA' | 'AR' | 'ÁGUA' => {
    if (['áries', 'leão', 'sagitário', 'aries', 'leao', 'sagitario'].includes(sign)) return 'FOGO';
    if (['touro', 'virgem', 'capricórnio', 'capricornio'].includes(sign)) return 'TERRA';
    if (['gêmeos', 'gemeos', 'libra', 'aquário', 'aquario'].includes(sign)) return 'AR';
    return 'ÁGUA';
  };

  const sunElement = getElement(sun);
  const moonElement = getElement(moon);

  const sunArch = archetypes[sun] || `a força essencial de ${sunRaw}`;
  const moonArch = archetypes[moon] || `a presença de ${moonRaw}`;

  // Frase inicial harmonizando os arquétipos
  let archetypesIntro = '';
  if (sun === moon) {
    archetypesIntro = `acolha com integridade ${sunArch}.`;
  } else {
    archetypesIntro = `sintonize ${sunArch} com ${moonArch}.`;
  }

  // Síntese dos elementos com palavras-chave mandatórias incorporadas com simplicidade e fluidez:
  // FOGO: faísca, irradiação, vontade, despertar, chama.
  // TERRA: maturação, substância, colheita.
  // AR: fluxo, sopro, síntese, aprendizado, percepção, palavras.
  // ÁGUA: maré, reflexo, emoção, sentimentos, intuição, mergulho, fluir.
  const elementMap: Record<string, string> = {
    'FOGO_FOGO': 'A faísca da sua vontade desperta com intensidade, irradiando uma chama viva que dissipa dúvidas e impulsiona a sua ação com coragem.',
    'FOGO_TERRA': 'A faísca da sua vontade ganha substância real quando respeita o tempo de maturação para gerar uma colheita consistente.',
    'FOGO_AR': 'A chama criativa da vontade ganha fluxo no sopro das ideias, onde as palavras certas trazem síntese ao aprendizado e clareiam a percepção.',
    'FOGO_ÁGUA': 'A faísca da sua vontade encontra as marés do sentir, unindo o mergulho no reflexo das emoções à intuição que guia os seus passos.',
    'TERRA_FOGO': 'A substância do que você constrói ganha presença fértil quando a faísca da vontade desperta a coragem necessária para uma colheita fecunda.',
    'TERRA_TERRA': 'A substância do real exige presença e paciência, honrando o ritmo natural da maturação para assegurar uma colheita fecunda e segura.',
    'TERRA_AR': 'A clareza prática ganha síntese através do sopro do aprendizado, unindo o fluxo de boas palavras à maturação de uma colheita com substância.',
    'TERRA_ÁGUA': 'A maturação interna se fortalece com afeto e serenidade, permitindo que as marés da alma e o reflexo das emoções enriqueçam a sua colheita.',
    'AR_FOGO': 'O fluxo mental recebe um sopro renovador, enquanto a faísca do despertar irradia a sua vontade de expandir horizontes com entusiasmo.',
    'AR_TERRA': 'O fluxo das palavras ganha substância ao encontrar sustento na realidade, permitindo que a percepção amadureça com tempo e paciência.',
    'AR_AR': 'O fluxo do pensamento e o sopro das ideias trazem síntese lúcida, onde o aprendizado e as palavras certas ampliam a sua percepção.',
    'AR_ÁGUA': 'O fluxo das palavras se harmoniza com a intuição, onde o reflexo de águas serenas acalma a mente e pacifica os sentimentos.',
    'ÁGUA_FOGO': 'As marés do sentir acolhem a faísca da vontade, acendendo o reflexo de emoções que despertam a coragem de agir com nobreza.',
    'ÁGUA_TERRA': 'As marés da sensibilidade ganham estabilidade e substância quando o respeito à maturação interna constrói um alicerce seguro para o sentir.',
    'ÁGUA_AR': 'O reflexo das emoções encontra síntese no sopro do aprendizado, permitindo que as palavras comuniquem a intuição com suavidade.',
    'ÁGUA_ÁGUA': 'As marés íntimas fluem em harmonia com a sua sensibilidade, onde o mergulho interior acalma as correntezas e acolhe os sentimentos com verdade.'
  };

  const elemKey = `${sunElement}_${moonElement}`;
  const elementText = elementMap[elemKey] || elementMap['TERRA_TERRA'];

  // Qualidade do aspecto sem citar termos técnicos e conselho final integrado sem rótulos
  let aspectClause = '';
  let aspectAdvice = '';

  const descLower = (aspectDesc || '').toLowerCase();
  if (descLower.includes('conjunção') || descLower.includes('conjuncao') || descLower.includes('impulso') || descLower.includes('autenticidade')) {
    aspectClause = 'Este impulso de fusão pede autenticidade em síntese com a sua verdade interior.';
    aspectAdvice = 'Sustente a firmeza ética dos seus atos hoje, alinhando a vontade consciente ao seu propósito essencial.';
  } else if (descLower.includes('oposição') || descLower.includes('oposicao') || descLower.includes('polaridades') || descLower.includes('equilíbrio') || descLower.includes('equilibrio')) {
    aspectClause = 'Diante de polaridades em diálogo, acolha a dúvida fértil para encontrar o equilíbrio entre forças complementares.';
    aspectAdvice = 'Busque a ponderação serena diante de visões contrastantes, harmonizando os opostos antes de firmar a sua postura.';
  } else if (descLower.includes('quadratura') || descLower.includes('tensaõ') || descLower.includes('tensão') || descLower.includes('conflito') || descLower.includes('turva')) {
    aspectClause = 'Diante de qualquer tensão emocional ou conflito, exercite a paciência e a espera — jamais permita que a emoção turve a razão.';
    aspectAdvice = 'Preserve a serenidade interior e aguarde a turbulência passar antes de tomar atitudes definitivas hoje.';
  } else if (descLower.includes('trígono') || descLower.includes('trigono') || descLower.includes('soluções') || descLower.includes('criatividade')) {
    aspectClause = 'Caminhe com leveza sob o fluxo harmônico de soluções criativas e clareza espontânea.';
    aspectAdvice = 'Confie no curso natural dos acontecimentos e deixe a sua sabedoria interior orientar as escolhas de hoje.';
  } else {
    aspectClause = 'Mantenha a mente receptiva para aprender com simplicidade e aplicar o que já foi assimilado com maturidade.';
    aspectAdvice = 'Aplique com sobriedade o discernimento ético nas situações que exigirem o seu posicionamento hoje.';
  }

  return `${nameIntro}${archetypesIntro} ${elementText} ${aspectClause} ${aspectAdvice}`;
}

function parseLogDataInfo(logData?: string) {
  if (!logData || !logData.trim()) {
    return {
      hasLogs: false,
      count: 0,
      dominant: 'recolhimento',
      secondary: '',
      notesSummary: '',
      emotionsList: [] as string[]
    };
  }

  const lines = logData.split('\n').filter(l => l.trim().length > 0);
  const emotionCounts: Record<string, number> = {};
  const notes: string[] = [];

  for (const line of lines) {
    const matchEmotion = line.match(/Sentimento\s+([A-Za-zÀ-ÿ\s]+?)(?:\s*\(|\s*,|$)/i) || line.match(/Sentimento\s+([A-Za-zÀ-ÿ]+)/i);
    if (matchEmotion) {
      const em = matchEmotion[1].trim();
      emotionCounts[em] = (emotionCounts[em] || 0) + 1;
    }
    const matchNote = line.match(/Notas?:\s*"([^"]+)"/i);
    if (matchNote && matchNote[1].trim()) {
      notes.push(matchNote[1].trim());
    }
  }

  const sorted = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1]);
  const dominant = sorted[0]?.[0] || 'recolhimento e auto-observação';
  const secondary = sorted[1]?.[0] || '';
  const notesSummary = notes.length > 0 ? ` As anotações trazem à tona reflexões como "${notes.slice(0, 2).join('" e "')}", revelando a sinceridade do seu processo íntimo.` : '';

  return {
    hasLogs: lines.length > 0,
    count: lines.length,
    dominant,
    secondary,
    notesSummary,
    emotionsList: sorted.map(s => `${s[0]} (${s[1]}x)`)
  };
}

function generateFallbackReports(period: string, logData?: string, userName?: string): string {
  const isWeekly = period === 'weekly';
  const isMonthly = period === 'monthly';
  const isCorrelation = period === 'correlation';
  const nameIntro = userName ? `${userName}, ` : '';
  const info = parseLogDataInfo(logData);

  if (isWeekly) {
    const emotionClause = info.hasLogs
      ? (info.secondary 
          ? `uma tônica de sentimentos voltada predominantemente a ${info.dominant.toLowerCase()}, acompanhada de manifestações de ${info.secondary.toLowerCase()}`
          : `uma tônica de sentimentos voltada predominantemente a ${info.dominant.toLowerCase()}`)
      : `uma tônica de sentimentos voltada à busca por recolhimento e discernimento profundo`;

    return `${nameIntro}identifico em sua caminhada de registros diários ${emotionClause}. A sua linha de pensamento predominante girou em torno de integrar essas percepções e harmonizar os movimentos da mente com a sabedoria do sentir.${info.notesSummary} O padrão dominante que unifica esses dias revela momentos de auto-observação honesta e busca por clareza. Como sua mentora sábia e amiga próxima de caminhada, ressalto que as oscilações emocionais e a autocrítica são pontos de sombra que demandam sua gentil atenção e zelo protetor para que não sufoquem sua clareza. Em contrapartida, a constância em registrar a verdade do seu sentir e acolher seus próprios ritmos funcionam como pontos luminosos de grande expansão e força. Sustente seus passos com postura ética e resgate o centramento dócil para conduzir os próximos movimentos da alma. O conselho prático para este momento é cultivar uma pausa intencional antes de responder a qualquer provocação externa, permitindo que a quietude revele o próximo passo com nobreza e dignidade.`;
  } else if (isMonthly) {
    const emotionClause = info.hasLogs
      ? (info.secondary 
          ? `uma tônica ancorada em ${info.dominant.toLowerCase()} e ${info.secondary.toLowerCase()}`
          : `uma tônica ancorada em ${info.dominant.toLowerCase()}`)
      : `uma tônica voltada à consolidação, aterramento e organização de prioridades`;

    return `${nameIntro}ao sintetizar os pontos recorrentes das suas anotações ao longo dos últimos 28 dias do ciclo lunar, percebo ${emotionClause}, estruturando sua caminhada de maturação e centramento.${info.notesSummary} O padrão dominante revela momentos de colheita sincera alternados com períodos em que a mente pede paciência para assimilar as transformações necessárias. Como sua mentora, amiga querida e companheira de jornada, destaco que a pressa ou a rigidez diante dos desdobramentos da vida são sombras que requerem sua atenção vigilante para não represar o fluxo do seu desenvolvimento. Em contrapartida, a constância em observar-se com afeto e o respeito solene ao tempo de gestação dos seus ideais são pontos luminosos de grande expansão. Para guiar seus passos na condução dos movimentos da alma com postura e clareza, finalize o que ficou pendente e abra espaço para o novo florescer.

Lista de Tarefas:
- Iniciado: Reconhecimento consciente dos padrões de ${info.dominant.toLowerCase()} e escuta atenta das marés internas.
- Dar continuidade: Prática diária de escrita de astromemórias e sustentação da clareza mental.
- Finalizado: Integração das oscilações passadas e encerramento de dinâmicas internas de autocobrança.`;
  } else if (isCorrelation) {
    const subtitle = `Sentimento Predominante nos Últimos 3 Ciclos: ${info.dominant}`;
    const emotionContext = info.hasLogs
      ? ` Os registros apontam que sentimentos como ${info.dominant.toLowerCase()}${info.secondary ? ` e ${info.secondary.toLowerCase()}` : ''} dialogam diretamente com as oscilações de luz do céu.`
      : '';
    return `${subtitle}\n\n${nameIntro}as suas mandalas revelam uma correspondência íntima entre as fases lunares e sua energia emocional interna ao longo dos ciclos registrados.${emotionContext} Na fase de Lua Nova, o sentimento prioritário identificado é o acolhimento reflexivo, convidando ao recolhimento e plantio de intenções. Na fase Crescente, sobressai o ânimo renovador e o entusiasmo para estruturar novos passos. Na fase Cheia, destaca-se a sensibilidade expandida e a expressividade, elevando as emoções ao seu ponto mais alto. E na fase Minguante, o desapego e a síntese tornam-se prioritários para encerrar o ciclo com sabedoria. Use essa correspondência direta como um mapa pessoal de autoconhecimento, aprendendo a respeitar os momentos em que a alma pede para agir com coragem e quando é o tempo de simplesmente fluir e descansar.`;
  } else {
    // Quarterly / Trimestral
    const emotionContext = info.hasLogs 
      ? ` Em seus registros deste trimestre, sobressaíram sentimentos de ${info.dominant.toLowerCase()}${info.secondary ? ` e ${info.secondary.toLowerCase()}` : ''}, marcando momentos cruciais de tomada de consciência.` 
      : '';
    return `${nameIntro}identifico na análise desta Estação da Alma, que compreende este último trimestre, eventos significativos e datas específicas onde os padrões emocionais se tornaram evidentes.${emotionContext} Em episódios de sobrecarga ou cansaço acumulado, reações de hesitação e ansiedade emergiram de forma mais marcante, resultando em oscilações do foco. Como sua amiga próxima e mentora sábia nesta caminhada, lembro-lhe de que essas reatividades são sombras naturais que nos indicam onde a autonomia precisa ser reforçada com maturidade. Os sentimentos predominantes de busca por segurança e centramento mostram o seu desejo sincero de evolução. O conselho para lidar com essa reatividade e conduzir seu processo de transformação permanente é cultivar uma pausa intencional antes de responder a estímulos externos, usando a respiração profunda como alicerce para desarmar a reatividade, permitindo que a clareza mental guie suas decisões com nobreza e dignidade.`;
  }
}

// Initialize Firebase Admin
let adminDb: admin.firestore.Firestore | null = null;
function getAdminDb() {
  if (!adminDb) {
    if (!admin.apps.length) {
      try {
        admin.initializeApp();
      } catch (error) {
        console.error("Firebase Admin initialization failed:", error);
      }
    }
    try {
      adminDb = admin.firestore();
    } catch (error) {
      console.error("Firestore Admin retrieval failed:", error);
    }
  }
  return adminDb;
}

// Initialize AI
async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // API: Get Oracle Guidance
  app.post("/api/oracle", async (req, res) => {
    const { sunSignName, moonSignName, philosophicalPhrase, userName, aspectName, aspectDesc } = req.body;
    try {
      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'MY_GEMINI_API_KEY') {
        return res.json({ text: generateFallbackOracle(sunSignName, moonSignName, philosophicalPhrase, userName, aspectDesc) });
      }
      const ai = getAI();

      const systemInstruction = `Você é o Oráculo Hekat (Hekat Astromemorias). Sua voz une com absoluta maestria sobriedade estratégica, acolhimento lúcido e sabedoria empática. Suas orientações funcionam como uma bússola pragmática para a postura, ética e clareza mental do usuário diante dos desafios reais da alma.

Siga rigorosamente as seguintes diretrizes para o PAINEL ORÁCULO DIÁRIO:

1. PRINCÍPIO GERAL E TÔNICA DOS TEXTOS:
   - Os textos devem ser acolhedores, simples e objetivos — como uma conversa próxima e cuidadosa.
   - Evitar tom coloquial (gírias), extremismos, exageros dramáticos e vocabulário rebuscado.
   - A orientação deve chegar com clareza e leveza, sem impor e sem comandos severos.
   - Sabedoria Empática: As orientações soam como uma verdade simples e profunda, baseada na observação clara do momento, sem hermetismo ou lirismo romântico.
   - Mistério Sutil: A linguagem mantém uma aura de sabedoria profunda, mas evita nomes técnicos (aspectos, elementos, nomes de casas astrológicas).
   - Equilíbrio Alquímico: Una sobriedade estratégica e acolhimento lúcido. Seja acolhedor sem ser beato (sem moralismos ou docilidade excessiva).

2. ABERTURA:
   - ${userName ? `Abrir o texto com o nome fornecido pelo usuário ("${userName}"), chamando-o diretamente logo na primeira frase (ex.: "${userName}, ..."), para transmitir confiança e proximidade desde a primeira frase.` : 'Abrir o texto de forma acolhedora, próxima e direta, transmitindo confiança imediata.'}

3. SOL E LUA NOS SIGNOS — SIMBOLOGIA DOS ELEMENTOS:
   Considere a posição do Sol e da Lua nos signos astrológicos informados conforme a simbologia dos elementos (NUNCA cite os nomes dos elementos "Fogo", "Terra", "Ar" ou "Água" no texto):
   - FOGO (Áries, Leão, Sagitário) — Inspire a agir.
     * Tônica: vitalidade, impulso, revelação.
     * Diretriz: frases curtas e diretas, com ânimo sereno e confiança — sem exaltação.
     * Palavras-chave a incorporar naturalmente: faísca, irradiação, vontade, despertar, chama.
   - TERRA (Touro, Virgem, Capricórnio) — Ensine a construir.
     * Tônica: estrutura, presença, manifestação.
     * Diretriz: linguagem objetiva e concreta, que transmita segurança, realismo e paciência.
     * Palavras-chave a incorporar naturalmente: maturação, substância, colheita.
   - AR (Gêmeos, Libra, Aquário) — Estimule a pensar e conectar.
     * Tônica: conexão, perspectiva, fluidez mental.
     * Diretriz: metáforas de visão, troca, comunicação e movimento; tom curioso, leve e analítico.
     * Palavras-chave a incorporar naturalmente: fluxo, sopro, síntese, aprendizado, percepção, palavras.
   - ÁGUA (Câncer, Escorpião, Peixes) — Acolha os sentimentos.
     * Tônica: profundidade, memória, dissolução.
     * Diretriz: linguagem poética e suave, que acolha a emoção sem dramatizar; tom de empatia e escuta.
     * Palavras-chave a incorporar naturalmente: maré, reflexo, emoção, intuição, mergulho, fluir.

4. QUALIDADE DOS ASPECTOS (SEM CITÁ-LOS NO TEXTO):
   Harmonize de forma sutil a relação entre Sol e Lua sem jamais citar termos técnicos como quadratura, trígono, oposição, etc.:
   - Conjunção: impulso, autenticidade, fusão — síntese das simbologias dos signos envolvidos.
   - Oposição: dúvida, equilíbrio por complementaridade.
   - Quadratura: tensão emocional, conflitos, espera, paciência; a emoção que turva a razão.
   - Trígono: soluções, harmonia, fluidez, clareza, criatividade.
   - Sextil / Semissextil: abertura para aprender e aplicar com simplicidade o que já foi assimilado com maturidade prática.

5. ARQUÉTIPOS ASTROLÓGICOS:
   - Certificar-se de que os conceitos estão alinhados ao arquétipo de cada signo (Gêmeos = dualidade, mente, comunicação; Touro = persistência, valor, matéria; etc.).

6. TÔNICA GERAL E FLUIDEZ:
   - Frases fluidas, com começo, meio e fim que conduzam o leitor com naturalidade.
   - Trazer fluidez e simplicidade ao texto, mantendo consistência de forma prática e clara em toda a leitura.

7. FECHAMENTO:
   - Finalizar com um conselho para o dia (sem citar que é um conselho), em sintonia com os aspectos formados entre Sol e Lua.
   - NUNCA usar palavras como "Conselho:", "Dica:", "Lembrete:". A orientação deve ser a frase conclusiva, integrada com total naturalidade.
   - NUNCA sugerir rotinas domésticas ou tarefas triviais do cotidiano (como arrumar mesa, beber água, organizar agendas). O foco é postura, ética e clareza mental.

8. FORMATAÇÃO E CONCISÃO:
   - Concisão: Máximo de 4 linhas.
   - Formatação no app: texto justificado em bloco contínuo (sem quebras de linha ou subtítulos).
   - Idioma: Português do Brasil.`;

      const prompt = `Sol em ${sunSignName || 'Desconhecido'}, Lua em ${moonSignName || 'Desconhecido'}. Tônica: "${philosophicalPhrase || ''}". Aspecto Ativo: ${aspectName || ''} (${aspectDesc || ''}). Que diretriz de postura este momento exige?`;
      const generatedText = await generateWithGemini(prompt, systemInstruction);

      res.json({ text: generatedText });
    } catch (error) {
      console.log("[Oráculo] Aplicando fallback reflexivo:", (error as any)?.message || error);
      const fallbackText = generateFallbackOracle(sunSignName, moonSignName, philosophicalPhrase, userName, aspectDesc);
      res.json({ text: fallbackText });
    }
  });

  // API: Get Analyze/Reports Guidance
  app.post("/api/reports", async (req, res) => {
    const { period, logData, previousLogsData, correlationData, userName } = req.body;
    try {
      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'MY_GEMINI_API_KEY') {
        return res.json({ text: generateFallbackReports(period, logData, userName) });
      }
      const ai = getAI();

      const isLongTerm = period === 'monthly' || period === 'quarterly' || period === 'correlation';
      let prompt = "";
      if (period === 'weekly') {
        prompt = `Realize a análise do Relatório Semanal com base nos registros dos últimos 7 dias.
                 DADOS DE CORTE (7 DIAS):
                 ${logData || 'Nenhum dado registrado nos últimos 7 dias.'}
                 
                 TAREFA EXCLUSIVA:
                 1. Use os dados inseridos pela usuária no período dos últimos 7 dias para definir a tônica dos sentimentos e a linha de pensamento predominante do período, apresentando um parecer analítico estruturado de forma fluida.
                 2. Una os dados das informações disponíveis para revelar um padrão dominante identificado nos registros.
                 3. Use uma linguagem acolhedora e fraterna, aproximando-se com a postura de uma sábia, amiga querida e mentora (Hekat é do gênero feminino), mantendo a sobriedade indispensável e evitando gírias, tons excessivamente informais ou superlativos sintéticos.
                 4. ATENÇÃO ABSOLUTA: É estritamente proibido usar a palavra ou variação de "ao olhar seus últimos sete dias" ou "ao avaliar seus sentimentos". Comece o texto chamando a usuária pelo nome "${userName}" no início exato para trazer proximidade confiável (ex: "Nome, ...").
                 5. Destaque de forma nítida tanto os pontos negativos que requerem atenção da usuária (vulnerabilidades, sombras ou oscilações) quanto os pontos positivos que geram expansão de consciência.
                 6. Finalize o relatório com um conselho prático e útil centrado em postura, ética e clareza mental para conduzir os movimentos da alma.
                 7. NÃO se restrinja a 4 linhas. Desenvolva um texto reflexivo, consistente e profundo.
                 8. Formato: O texto deve ser composto por um parágrafo único integralmente JUSTIFICADO (sem recuos de página, sem bullets, sem títulos, sem subseções, sem aspas externas desnecessárias).`;
      } else if (period === 'monthly') {
        prompt = `Realize a análise do Relatório Mensal com base nos registros dos últimos 29 dias do ciclo lunar.
                 DADOS DE CORTE (29 DIAS):
                 ${logData || 'Nenhum dado registrado neste ciclo lunar de 29 dias.'}
                 HISTÓRICO RECENTE:
                 ${previousLogsData || 'Primeiro ciclo registrado.'}
                 
                 TAREFA EXCLUSIVA:
                 1. Use os dados inseridos pela usuária no período dos últimos 29 dias para definir de forma nítida a tônica dos sentimentos e a linha de pensamento predominante do período, apresentando um parecer analítico estruturado de forma fluida.
                 2. Una os dados disponíveis para revelar os padrões de sentimentos dominantes identificados nos registros, comparando-os e conectando-os se houver histórico.
                 3. Use uma linguagem acolhedora e fraterna, aproximando-se com a postura de uma sábia, amiga querida e mentora (Hekat é do gênero feminino), mantendo a sobriedade indispensável e evitando gírias, tons informais ou superlativos sintéticos.
                 4. ATENÇÃO ABSOLUTA: É estritamente proibido usar a palavra ou variação de "ao olhar seus últimos vinte e nove dias", "ao olhar seu ciclo" ou "ao avaliar seus sentimentos/registros". Comece o texto chamando a usuária pelo nome "${userName}" no início exato para trazer proximidade confiável (ex: "Nome, ...").
                 5. Destaque tanto os pontos negativos que requerem atenção da usuária (vulnerabilidades, sombras ou resistências que a paralisam) quanto os pontos positivos que geram expansão de consciência.
                 6. Apresente uma síntese clara dos pontos recorrentes ao longo do período de 29 dias, ressaltando o que precisa ser finalizado.
                 7. Gere obrigatoriamente uma lista de tarefas estruturada e clara ao final, classificada exatamente nestas três classes de forma limpa:
                    - Iniciado: [tarefas iniciadas no período]
                    - Dar continuidade: [atividades ou processos para dar continuidade]
                    - Finalizado: [processos ou tarefas finalizadas ou a finalizar neste ciclo]
                 8. NÃO se restrinja a 4 ou 6 linhas. Desenvolva um texto reflexivo, consistente e profundo, seguido de forma espaçada pela lista de tarefas.
                 9. Formato: O texto de análise deve ser justificado, seguido pela seção da lista de tarefas estruturada de forma limpa e visível.`;
      } else if (period === 'correlation') {
        const parsedInfo = parseLogDataInfo(logData);
        const dominantSentiment = parsedInfo.dominant;
        prompt = `Realize uma análise de correlação entre as fases da lua e os padrões de sentimentos/dados inseridos pela usuária.
                 DADOS DE CORRELAÇÃO DOS ÚLTIMOS 3 CICLOS (de 29 dias cada):\n${correlationData || 'Nenhum dado acumulado disponível ainda.'}\n
                 HISTÓRICO INTEGRADO:\n${previousLogsData || ''}\n${logData || ''}
                 
                 TAREFA EXCLUSIVA:
                 1. A frase inicial do relatório deve ser obrigatoriamente um subtítulo dinâmico que apresente o sentimento predominante detectado nos 3 últimos ciclos lunares, exatamente no formato:
                 "Sentimento Predominante nos Últimos 3 Ciclos: ${dominantSentiment}"
                 2. Faça uma correlação nítida e direta das fases da Lua (Nova, Crescente, Cheia, Minguante) com a repetição de padrões de sentimentos e dados inseridos pela usuária.
                 3. Destaque obrigatoriamente um sentimento prioritário identificado em cada uma das quatro fases lunares considerando os 3 últimos ciclos lunares de 29 dias.
                 4. Use uma linguagem acolhedora, fraterna, dócil e sábia de uma mentora sábia (Hekat é do gênero feminino). Evite superlativos sintéticos.
                 5. Logo após o subtítulo dinâmico na primeira linha isolada, inicie o texto chamando a usuária pelo nome "${userName}" para trazer proximidade de forma natural (ex: "${userName}, ...").
                 6. Formato: O relatório deve iniciar com o subtítulo dinâmico na primeira linha, seguido pelo texto fluido, reflexivo e consistente.`;
      } else {
        prompt = `Realize uma análise profunda desta 'Estação da Alma' (Relatório Trimestral).
                 HISTÓRICO E CICLO ATUAL:\n${previousLogsData}\n${logData}\n
                 
                 TAREFA EXCLUSIVA:
                 1. Analise o histórico dos últimos 90 dias (trimestre).
                 2. Identifique e pontue datas e eventos específicos mencionados nos registros que estejam relacionados com padrões emocionais reativos.
                 3. Ressalte com clareza quais foram os sentimentos predominantes detectados ao longo do trimestre.
                 4. Destaque tanto os pontos negativos que necessitam de sua atenção cuidadosa quanto os pontos positivos que propiciam a expansão de consciência.
                 5. Traga um conselho profundo e útil centrado em postura, ética e clareza mental para lidar com os sentimentos reativos e guiar seu processo de transformação permanente.
                 6. Use uma linguagem acolhedora, fraterna e sábia de sua mentora Hekat (gênero feminino). Evite superlativos sintéticos.
                 7. ATENÇÃO ABSOLUTA: Comece o texto chamando a usuária pelo nome "${userName}" no início exato. Não use variações de "ao olhar seu trimestre" ou "ao avaliar seus sentimentos".
                 8. Formato: Um texto corrido, reflexivo e consistente.`;
      }

      const systemInstruction = `Você é o Oráculo Hekat (Hekat Astromemorias). Sua voz única une sobriedade estratégica e acolhimento lúcido de uma mentora fraterna e pragmática, incorporando uma força lunar feminina em suas falas.
        
        TOM DE VOZ E ESTILO:
        - Equilíbrio Alquímico Final: Una sobriedade estratégica e acolhimento lúcido. Seja direta sem ser dogmática (evite comandos severos) e acolhedora sem ser "beata" ou melodramática (evite moralismos, excesso de compaixão sentimental ou docilidade excessiva). Use gênero feminino para referir-se a si mesma (como "sua mentora", "sua amiga", "sábia").
        - Praticidade de Vida: O conteúdo deve ser útil e focado em postura, ética e clareza mental. Ofereça diretrizes para os grandes movimentos da alma e desafios reais, e NUNCA sugira rotinas domésticas, tarefas cotidianas triviais, ou conselhos superficiais.
        - Sabedoria Empática: Suas orientações soam como uma verdade simples e profunda, baseada na observação clara do momento, sem hermetismo ou lirismo romântico.
        - Mistério Sutil: A linguagem mantém uma aura de sabedoria profunda, mas evita nomes técnicos (graus, casas, aspectos, cardinal, fixo, etc.).
        - Idioma: Português do Brasil.
        
        DIRETRIZES DE CONTEÚDO EXTRAORDINÁRIAS:
        - Para o RELATÓRIO SEMANAL e RELATÓRIO MENSAL (29 dias), RELATÓRIO TRIMESTRAL e CORRELAÇÃO LUNAR: Use os dados do respectivo período para definir o parecer analítico.
        - Não use frases como "ao olhar seus últimos sete dias", "ao olhar seus últimos vinte e nove dias" ou "ao avaliar seus sentimentos/registros".
        - Chame sempre a pessoa pelo nome "${userName}" abrindo o texto para trazer confiança e proximidade de forma dócil, calma e direta (ex: "Nome, ...").
        - Para os relatórios em geral, nunca use cabeçalhos ou títulos genéricos, exceto na CORRELAÇÃO LUNAR onde a frase inicial deve ser exatamente o subtítulo dinâmico indicando o sentimento predominante nos 3 últimos ciclos lunares conforme a tarefa.`;

      const contents = `Dados: \n${logData || 'Nenhum dado inserido ainda.'}\n${correlationData ? `Dados de Correlação: \n${correlationData}\n` : ''}\nTarefa: ${prompt}`;
      let generatedText = await generateWithGemini(contents, systemInstruction);

      if (period === 'correlation' && generatedText && !generatedText.toLowerCase().includes('sentimento predominante')) {
        const parsedInfo = parseLogDataInfo(logData);
        generatedText = `Sentimento Predominante nos Últimos 3 Ciclos: ${parsedInfo.dominant}\n\n${generatedText}`;
      }

      res.json({ text: generatedText });
    } catch (error) {
      console.log("[Relatórios] Aplicando fallback reflexivo:", (error as any)?.message || error);
      const fallbackText = generateFallbackReports(period, logData, userName);
      res.json({ text: fallbackText });
    }
  });

  // API: Get Real-time High-Performance Astrological Positions via Swiss Ephemeris (WASM-addon)
  app.post("/api/astronomy/calculate", (req, res) => {
    let { date } = req.body;
    try {
      const d = date ? new Date(date) : new Date();
      if (isNaN(d.getTime())) {
        return res.status(400).json({ error: "Invalid date" });
      }

      const year = d.getUTCFullYear();
      const month = d.getUTCMonth() + 1;
      const day = d.getUTCDate();
      const hour = d.getUTCHours() + d.getUTCMinutes() / 60 + d.getUTCSeconds() / 3600;

      const jd = julday(year, month, day, hour, constants.SE_GREG_CAL);

      const sunCalc = calc_ut(jd, constants.SE_SUN, constants.SEFLG_SWIEPH);
      const sunLon = sunCalc.data[0];

      const moonCalc = calc_ut(jd, constants.SE_MOON, constants.SEFLG_SWIEPH);
      const moonLon = moonCalc.data[0];

      const phaseAngle = (moonLon - sunLon + 360) % 360;
      const illumination = ((1 - Math.cos((phaseAngle * Math.PI) / 180)) / 2) * 100;

      const ZODIAC_SIGNS_NAMES = [
        "Áries", "Touro", "Gêmeos", "Câncer", "Leão", "Virgem",
        "Libra", "Escorpião", "Sagitário", "Capricórnio", "Aquário", "Peixes"
      ];

      const sunSignIndex = Math.floor(sunLon / 30) % 12;
      const moonSignIndex = Math.floor(moonLon / 30) % 12;

      res.json({
        success: true,
        julianDay: jd,
        serverTime: new Date().toISOString(),
        sun: {
          longitude: sunLon,
          signIndex: sunSignIndex,
          signName: ZODIAC_SIGNS_NAMES[sunSignIndex],
          degrees: sunLon % 30
        },
        moon: {
          longitude: moonLon,
          signIndex: moonSignIndex,
          signName: ZODIAC_SIGNS_NAMES[moonSignIndex],
          degrees: moonLon % 30
        },
        phaseAngle,
        illumination
      });
    } catch (e: any) {
      console.error("Error in astronomy calculation:", e);
      res.status(500).json({ error: e.message || "Calculation failed" });
    }
  });

  app.post("/api/astronomy/cycle", (req, res) => {
    let { startDate } = req.body;
    try {
      const dStart = startDate ? new Date(startDate) : new Date(Date.UTC(2026, 4, 16, 0, 0, 0)); // Fallback a Lua Nova de 16 de Maio de 2026
      if (isNaN(dStart.getTime())) {
        return res.status(400).json({ error: "Invalid start date" });
      }

      const LUNAR_MONTH = 29.53059;
      const ZODIAC_SIGNS_NAMES = [
        "Áries", "Touro", "Gêmeos", "Câncer", "Leão", "Virgem",
        "Libra", "Escorpião", "Sagitário", "Capricórnio", "Aquário", "Peixes"
      ];

      const daysData = [];
      for (let dayIndex = 1; dayIndex <= 29; dayIndex++) {
        const ageForDay = ((dayIndex - 1) / 29) * LUNAR_MONTH;
        const targetDate = new Date(dStart.getTime() + ageForDay * 24 * 60 * 60 * 1000);

        const year = targetDate.getUTCFullYear();
        const month = targetDate.getUTCMonth() + 1;
        const day = targetDate.getUTCDate();
        const hour = targetDate.getUTCHours() + targetDate.getUTCMinutes() / 60 + targetDate.getUTCSeconds() / 3600;

        const jd = julday(year, month, day, hour, constants.SE_GREG_CAL);

        const sunCalc = calc_ut(jd, constants.SE_SUN, constants.SEFLG_SWIEPH);
        const sunLon = sunCalc.data[0];

        const moonCalc = calc_ut(jd, constants.SE_MOON, constants.SEFLG_SWIEPH);
        const moonLon = moonCalc.data[0];

        const phaseAngle = (moonLon - sunLon + 360) % 360;
        const illumination = ((1 - Math.cos((phaseAngle * Math.PI) / 180)) / 2) * 100;

        const sunSignIndex = Math.floor(sunLon / 30) % 12;
        const moonSignIndex = Math.floor(moonLon / 30) % 12;

        daysData.push({
          lunarDay: dayIndex,
          dateString: targetDate.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit" }),
          isoDate: targetDate.toISOString(),
          sun: {
            longitude: sunLon,
            signIndex: sunSignIndex,
            signName: ZODIAC_SIGNS_NAMES[sunSignIndex],
            degrees: sunLon % 30
          },
          moon: {
            longitude: moonLon,
            signIndex: moonSignIndex,
            signName: ZODIAC_SIGNS_NAMES[moonSignIndex],
            degrees: moonLon % 30
          },
          phaseAngle,
          illumination
        });
      }

      res.json({
        success: true,
        startDate: dStart.toISOString(),
        cycleName: ZODIAC_SIGNS_NAMES[daysData[0].sun.signIndex],
        days: daysData
      });
    } catch (e: any) {
      console.error("Error in cycle calculation:", e);
      res.status(500).json({ error: e.message || "Cycle calculation failed" });
    }
  });

  // API: Create PagBank Checkout Session
  app.post("/api/checkout", async (req, res) => {
    const { userId, planId } = req.body;
    
    if (!userId) return res.status(400).json({ error: "UserId is required" });

    const PAGBANK_TOKEN = process.env.PAGBANK_TOKEN;
    const PAGBANK_URL = process.env.PAGBANK_ENV === "production" 
      ? "https://api.pagseguro.com" 
      : "https://sandbox.api.pagseguro.com";

    try {
      // Mocking a PagBank Checkout request for the example
      // In a real scenario, you'd follow: https://developer.pagbank.com.br/reference/criar-pedido
      const payload = {
        reference_id: `HEKAT_${userId}_${Date.now()}`,
        customer: {
          name: "Cliente Hekat",
          email: "cliente@email.com", // Should come from req.body or auth
          tax_id: "12345678909",
          phones: [{ country: "55", area: "11", number: "999999999", type: "MOBILE" }]
        },
        items: [
          {
            reference_id: planId || "BASIC_PLAN",
            name: "Assinatura Oráculo Hekat",
            quantity: 1,
            unit_amount: 4990 // R$ 49,90
          }
        ],
        notification_urls: [`${process.env.APP_URL}/api/webhook`],
        redirect_url: `${process.env.APP_URL}/?payment=success`
      };

      const response = await axios.post(`${PAGBANK_URL}/checkouts`, payload, {
        headers: {
          "Authorization": `Bearer ${PAGBANK_TOKEN}`,
          "Content-Type": "application/json"
        }
      });

      // Links contain the checkout URL
      const checkoutUrl = response.data.links.find((l: any) => l.rel === "PAY").href;
      res.json({ checkoutUrl });

    } catch (error: any) {
      console.error("PagBank Error:", error.response?.data || error.message);
      res.status(500).json({ error: "Erro ao criar checkout" });
    }
  });

  // API: PagBank Webhook
  app.post("/api/webhook", async (req, res) => {
    const notification = req.body;
    console.log("Webhook Received:", notification);

    // Verify PagBank status
    // status: 3 = Pago, 4 = Disponível, etc.
    if (notification.status === 3 || notification.status === 4) {
      const reference = notification.reference_id; // e.g., HEKAT_USERID_TIMESTAMP
      const userId = reference.split("_")[1];

      const db = getAdminDb();
      if (userId && db) {
        await db.collection("users").doc(userId).set({
          isPremium: true,
          subscriptionActive: true,
          lastPayment: admin.firestore.FieldValue.serverTimestamp(),
          paymentRef: reference
        }, { merge: true });
        console.log(`Access unlocked for user: ${userId}`);
      }
    }

    res.sendStatus(200);
  });

  /**
   * API: External Access Grant
   * For integration with www.ciadoceu.com.br
   * Expects: { userId: string } OR { email: string }
   * Header: x-webhook-secret
   */
  app.post("/api/external/grant-access", async (req, res) => {
    const secret = req.headers["x-webhook-secret"];
    const expectedSecret = process.env.EXTERNAL_WEBHOOK_SECRET;

    if (!expectedSecret || secret !== expectedSecret) {
      console.warn("Unauthorized external access attempt");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { userId, email } = req.body;

    try {
      let targetUid = userId;

      // If email is provided instead of UID, lookup user
      if (!targetUid && email) {
        try {
          const userRecord = await admin.auth().getUserByEmail(email);
          targetUid = userRecord.uid;
        } catch (authError) {
          console.error("User not found by email:", email);
          return res.status(404).json({ error: "User not found" });
        }
      }

      if (!targetUid) {
        return res.status(400).json({ error: "UserId or Email is required" });
      }

      // Update user to premium
      const db = getAdminDb();
      if (!db) {
        return res.status(500).json({ error: "Database not available" });
      }
      await db.collection("users").doc(targetUid).set({
        isPremium: true,
        subscriptionActive: true,
        lastPayment: admin.firestore.FieldValue.serverTimestamp(),
        accessSource: "external_ciadoceu"
      }, { merge: true });

      console.log(`Access granted via external integration for user: ${targetUid}`);
      res.json({ success: true, userId: targetUid });

    } catch (error: any) {
      console.error("External Grant Error:", error.message);
      res.status(500).json({ error: "Internal processing error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== "true",
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  const shutdown = () => {
    server.close(() => {
      process.exit(0);
    });
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

startServer().catch(err => {
  console.error("Critical: Server failed to start:", err);
  process.exit(1);
});
