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

// Elegantly styled fallback generator matching Hekat's strict brand guidelines and voice (simple, profound, Zen and astrological wisdom without technical jargon or positional declarations)
function generateFallbackOracle(sunSignName?: string, moonSignName?: string, philosophicalPhrase?: string, userName?: string, aspectDesc?: string): string {
  const sun = sunSignName || 'Touro';
  const moon = moonSignName || 'Peixes';
  const nameIntro = userName ? `${userName}, ` : '';
  
  // Detectar Elementos
  const getElement = (sign: string): 'FOGO' | 'TERRA' | 'AR' | 'ÁGUA' => {
    const s = sign.toLowerCase();
    if (['áries', 'leão', 'sagitário', 'aries', 'leao', 'sagitario'].includes(s)) return 'FOGO';
    if (['touro', 'virgem', 'capricórnio', 'capricornio'].includes(s)) return 'TERRA';
    if (['gêmeos', 'gemeos', 'libra', 'aquário', 'aquario'].includes(s)) return 'AR';
    return 'ÁGUA'; // Câncer, Escorpião, Peixes
  };

  const sunElement = getElement(sun);
  const moonElement = getElement(moon);

  // Palavras-chave obrigatórias a incorporar sutilmente
  // FOGO: faísca, irradiação, vontade, despertar, chama.
  // TERRA: alicerce, tangível, maturação, substância, colheita.
  // AR: fluxo, sopro, síntese, aprendizado, percepção, palavras.
  // ÁGUA: maré, reflexo, emoção, sentimentos, intuição, mergulho, fluir.

  // Direções/Mensagens base por combinação de Elemento do Sol e Elemento da Lua
  const elementTexts: Record<string, { main: string, advice: string }> = {
    'FOGO_FOGO': {
      main: `há uma faísca viva no agora — a sua vontade de realizar desperta com força total: permita que a irradiação da sua força se revele com entusiasmo.`,
      advice: `Dê o primeiro passo hoje mesmo em direção ao seu objetivo real.`
    },
    'FOGO_TERRA': {
      main: `sintonize a sua vontade de agir com um alicerce estável — o tempo exige paciência e presença para que a colheita seja cheia de substância real.`,
      advice: `Estruture os seus planos com metas simples e tarefas concretas.`
    },
    'FOGO_AR': {
      main: `use a sua chama criativa para dar fluxo às ideias — o sopro do aprendizado e as palavras certas trazem clareza de percepção aos seus caminhos.`,
      advice: `Converse com alguém de confiança para expandir as suas perspectivas.`
    },
    'FOGO_ÁGUA': {
      main: `sintonize o calor da sua vontade com as marés profundas do sentir — mergulhe em sua intuição silenciosa para guiar as ações com empatia.`,
      advice: `Silencie os ruídos externos para ouvir as respostas do coração.`
    },
    'TERRA_FOGO': {
      main: `dê corpo tangível ao seu alicerce diário — a faísca do entusiasmo desperta o momento certo de agir com coragem, presença e realismo.`,
      advice: `Use a sua energia concentrada para iniciar aquela tarefa adiada.`
    },
    'TERRA_TERRA': {
      main: `honre a substância do real e a maturação de cada processo — o seu solo firme exige tempo e paciência para gerar uma colheita valiosa.`,
      advice: `Evite a pressa desnecessária e concentre-se em concluir o que começou.`
    },
    'TERRA_AR': {
      main: `traga clareza prática e síntese aos pensamentos — o fluxo dócil do aprendizado ajuda a estruturar o seu alicerce com ideias realizadoras.`,
      advice: `Escreva as suas prioridades do dia e organize a sua agenda.`
    },
    'TERRA_ÁGUA': {
      main: `nutra o seu alicerce com afeto e sensibilidade — o reflexo das suas águas revela que o amadurecimento tangível exige paciência dócil.`,
      advice: `Acolha os seus sentimentos e respeite o ritmo do seu corpo.`
    },
    'AR_FOGO': {
      main: `o fluxo mental traz um sopro de ânimo renovador — o despertar da sua vontade impulsiona novos caminhos com leveza, visão e entusiasmo.`,
      advice: `Tome uma decisão simples que traga mais movimento à sua vida.`
    },
    'AR_TERRA': {
      main: `sintonize o fluxo das palavras com a estabilidade de vida — a clareza de percepção encontra sustento seguro no seu alicerce de rotina.`,
      advice: `Simplifique as suas obrigações diárias e descarte o que é supérfluo.`
    },
    'AR_AR': {
      main: `purifique as ideias e dê fluxo aos seus pensamentos — o sopro da curiosidade traz clareza de percepção e leveza para as suas palavras.`,
      advice: `Estude um assunto novo ou organize as suas leituras pendentes.`
    },
    'AR_ÁGUA': {
      main: `una o fluxo das palavras à intuição profunda do sentir — a percepção do invisível clareia as memórias e acalma os seus sentimentos.`,
      advice: `Escreva ou converse abertamente sobre o que está sentindo.`
    },
    'ÁGUA_FOGO': {
      main: `acolha as marés do seu coração com empatia — o reflexo das suas emoções desperta a faísca da vontade para agir com afeto e coragem.`,
      advice: `Siga a sua intuição e faça algo que alegre a sua alma.`
    },
    'ÁGUA_TERRA': {
      main: `traga segurança e estabilidade às suas marés emocionais — o respeito à maturação interna constrói um alicerce firme na caminhada.`,
      advice: `Respire fundo, sinta o seu corpo e acalme a mente com simplicidade.`
    },
    'ÁGUA_AR': {
      main: `comunique as suas intuições de forma simples e dócil — o sopro do aprendizado traz síntese para compreender o reflexo das suas emoções.`,
      advice: `Reserve dez minutos para registrar as suas reflexões em um diário.`
    },
    'ÁGUA_ÁGUA': {
      main: `flua com leveza em suas marés de sensibilidade — o mergulho interno acalma as correntezas íntimas e revela o mistério do seu próprio sentir.`,
      advice: `Fique alguns minutos em silêncio para cultivar a sua paz interior.`
    }
  };

  const key = `${sunElement}_${moonElement}`;
  const selectedText = elementTexts[key] || elementTexts['TERRA_TERRA'];

  let aspectText = '';
  if (aspectDesc) {
    const descLower = aspectDesc.toLowerCase();
    if (descLower.includes('conjunção') || descLower.includes('conjuncao') || descLower.includes('impulso') || descLower.includes('autenticidade')) {
      aspectText = ` — nobreza e fusão: viva com autêntico impulso este momento em que a clareza se sintetiza com verdade.`;
    } else if (descLower.includes('oposição') || descLower.includes('oposicao') || descLower.includes('polaridades') || descLower.includes('equilíbrio') || descLower.includes('equilibrio')) {
      aspectText = ` — polaridades opostas: busque a dúvida reflexiva para equilibrar e integrar forças complementares na jornada.`;
    } else if (descLower.includes('quadratura') || descLower.includes('tensaõ') || descLower.includes('tensão') || descLower.includes('conflito') || descLower.includes('turva')) {
      aspectText = ` — paciência diante da tensão: abrigue os conflitos emocionais com calma, lembrando que a emoção acumulada nunca deve turvar a razão.`;
    } else if (descLower.includes('trígono') || descLower.includes('trigono') || descLower.includes('soluções') || descLower.includes('criatividade')) {
      aspectText = ` — harmonia e fluxo criativo: caminhe sob a luz das soluções fluidas e da clareza abundante.`;
    } else {
      aspectText = ` — sabedoria prática: esteja aberto para aprender e aplicar com simplicidade o que já foi assimilado.`;
    }
  }

  const finalMain = `${nameIntro}${selectedText.main}${aspectText} Conselho prático: ${selectedText.advice}`;
  return finalMain;
}

function generateFallbackReports(period: string, logData?: string, userName?: string): string {
  const isWeekly = period === 'weekly';
  const isMonthly = period === 'monthly';
  const isCorrelation = period === 'correlation';
  const nameIntro = userName ? `${userName}, ` : 'Viajante, ';

  if (isWeekly) {
    return `${nameIntro}identifico em sua caminhada de registros recentes uma tônica de sentimentos voltada à busca por recolhimento e discernimento profundo. A sua linha de pensamento predominante girou em torno da necessidade de reorganizar dinâmicas internas e de restabelecer o equilíbrio mental diante de demandas externas. O padrão dominante que unifica esses dias revela uma tendência à oscilação silenciosa, alternando momentos de recolhimento criativo com picos de cansaço ou apreensão. Como sua mentora sábia e amiga próxima de caminhada, ressalto que a impaciência e a autocrítica excessiva são pontos de sombra que demandam sua gentil atenção e zelo protetor para que não sufoquem sua clareza. Em contrapartida, a sua capacidade de auto-observação honesta e a firmeza em acolher seus próprios ritmos funcionam como pontos luminosos de expansão e força. Sustente seus passos com coragem realista e resgate o centramento dócil para conduzir os próximos movimentos da alma. O conselho prático para este momento é cultivar uma pausa intencional antes de responder a estímulos externos, permitindo que a quietude revele o próximo passo com nobreza e dignidade.`;
  } else if (isMonthly) {
    return `${nameIntro}ao sintetizar os pontos recorrentes das suas anotações ao longo dos últimos 29 dias do ciclo lunar, percebo uma tônica voltada à consolidação, aterramento e organização de prioridades, buscando compreender o que possui valor perene. O padrão dominante revela momentos de contenção estratégica alternados com uma sutil resistência a mudanças necessárias, o que pode gerar cansaço acumulado. Como sua mentora, amiga querida e companheira de jornada, destaco que a rigidez ou a hesitação diante do novo são pontos de sombra que requerem sua atenção vigilante para não represar o fluxo do seu desenvolvimento. Em contrapartida, a paciência dócil e o respeito solene ao tempo de gestação dos seus ideais são pontos luminosos de grande expansão. Para guiar seus passos na condução dos movimentos da alma com postura e clareza, é essencial finalizar o que ficou pendente e abrir espaço para o novo.

Lista de Tarefas:
- Iniciado: Mapeamento dos ritmos internos e reconhecimento de oscilações emocionais.
- Dar continuidade: Prática diária de auto-observação e escrita de registros de clareza.
- Finalizado: Integração das marés do ciclo anterior e encerramento de dinâmicas internas desgastantes.`;
  } else if (isCorrelation) {
    return `${nameIntro}as suas mandalas revelam uma correspondência íntima entre as fases lunares e sua energia emocional interna ao longo dos últimos três ciclos de 29 dias. Na fase de Lua Nova, o sentimento prioritário identificado é o acolhimento reflexivo, convidando ao recolhimento e plantio de intenções. Na fase Crescente, sobressai o ânimo renovador e o entusiasmo para estruturar novos passos. Na fase Cheia, destaca-se a sensibilidade expandida e a expressividade, elevando as emoções ao seu ponto mais alto. E na fase Minguante, o desapego e a síntese tornam-se prioritários para encerrar o ciclo com sabedoria. Use essa correspondência direta como um mapa pessoal de autoconhecimento, aprendendo a respeitar os momentos em que a alma pede para agir com coragem e quando é o tempo de simplesmente fluir e descansar.`;
  } else {
    // Quarterly / Trimestral
    return `${nameIntro}identifico na análise desta Estação da Alma, que compreende este último trimestre, eventos significativos e datas específicas onde os padrões emocionais reativos se tornaram evidentes. Em episódios de sobrecarga ou cansaço acumulado, sentimentos de ansiedade e frustração emergiram de forma mais marcante, resultando em oscilações bruscas e dispersão do foco. Como sua amiga próxima e mentora sábia nesta caminhada, lembro-lhe de que essas reatividades são sombras naturais que nos indicam onde a autonomia precisa ser reforçada com maturidade. Os sentimentos predominantes de busca por segurança e centramento mostram o seu desejo sincero de evolução. O conselho para lidar com essa reatividade e conduzir seu processo de transformação permanente é cultivar uma pausa intencional antes de responder a estímulos externos, usando a respiração profunda como alicerce para desarmar a reatividade, permitindo que a clareza mental guie suas decisões com nobreza e dignidade.`;
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

  // API: Get Oracle Guidance
  app.post("/api/oracle", async (req, res) => {
    const { sunSignName, moonSignName, philosophicalPhrase, userName, aspectName, aspectDesc } = req.body;
    try {
      const ai = getAI();
      if (!process.env.GEMINI_API_KEY) {
        console.warn("GEMINI_API_KEY environment variable not set. Using elegant Hekat fallback guidance.");
        return res.json({ text: generateFallbackOracle(sunSignName, moonSignName, philosophicalPhrase, userName, aspectDesc) });
      }

      const systemInstruction = `Você é o Oráculo Hekat (Hekat Astromemorias). Sua voz une de modo absoluto sobriedade estratégica, acolhimento lúcido e sabedoria empática. Suas orientações funcionam como uma bússola pragmática para a postura, ética e clareza mental do usuário diante de desafios reais da alma.

Siga rigorosamente as diretrizes e regras a seguir:

1. TOM DE VOZ E ESTILO (EQUILÍBRIO ALQUÍMICO):
   - Evite comandos severos ou dogmáticos; evite moralismos ou condescendência beata.
   - O tom deve ser direto, informal, acolhedor e próximo, transmitindo uma pausa para introspecção profunda de forma dócil, acessível e clara.
   - Use pontuação estratégica — travessões (—) e dois-pontos (:) — para criar pausas e enfatizar frases de efeito, citações ou percepções sublimes.
   - Use uma linguagem simples, fluida e clara para um leigo, de fácil compreensão e extremamente direta. Evite termos rebuscados, conceitos de difícil acesso ou linguagem complexa. Mantenha a profundidade e a sabedoria empática sem hermetismo.

2. PRATICIDADE DE VIDA:
   - Ofereça conselhos funcionais e direcionados a postura de vida, ética e clareza mental para os grandes movimentos da alma e desafios reais.
   - NUNCA sugira rotinas domésticas, tarefas cotidianas ou triviais do dia a dia.
   - Finalize o texto com um conselho prático e útil (ex: "Conselho prático: ...").

3. DINÂMICA DOS ELEMENTOS (Símbolos Astrológicos do Sol e da Lua):
   - Identifique os elementos correspondentes aos signos do Sol e da Lua informados e module a tônica da mensagem combinando suas essências de acordo com as diretrizes específicas abaixo (NUNCA mencione os nomes dos elementos "Fogo", "Terra", "Ar" ou "Água" em si, apenas use sua simbologia e diretrizes descritas):
     * FOGO (Áries, Leão, Sagitário): Inspire a agir. 
       - Tônica: Vitalidade, Impulso e Revelação.
       - Simbologia: A centelha da criação, o calor que expande e a luz que dissipa a dúvida.
       - Diretrizes: Use verbos de ação e frases curtas e impactantes. Promova coragem e entusiasmo.
       - Palavras-chave obrigatórias a incorporar sutilmente: faísca, irradiação, vontade, despertar, chama.
     * TERRA (Touro, Virgem, Capricórnio): Ensine a construir.
       - Tônica: Estrutura, Presença e Manifestação.
       - Simbologia: O solo que sustenta, a raiz que aprofunda e o tempo que matura a forma.
       - Diretrizes: Linguagem sensorial e objetiva. Transmita segurança, realismo e paciência.
       - Palavras-chave obrigatórias a incorporar sutilmente: alicerce, tangível, maturação, substância, colheita.
     * AR (Gêmeos, Libra, Aquário): Estimule a pensar e a conectar.
       - Tônica: Conexão, Perspectiva e Fluidez Mental.
       - Simbologia: O sopro que transporta a informação, o espaço entre as coisas e a clareza mental.
       - Diretrizes: Use metáforas sobre visão, troca, comunicação e movimento. O tom deve ser curioso, leve e analítico.
       - Palavras-chave obrigatórias a incorporar sutilmente: fluxo, sopro, síntese, aprendizado, percepção, palavras.
     * ÁGUA (Câncer, Escorpião, Peixes): Convide a sentir.
       - Tônica: Profundidade, Memória e Dissolução.
       - Simbologia: O oceano do inconsciente, sentimentos, a correnteza que molda a pedra e o espelho que reflete a alma.
       - Diretrizes: Linguagem poética, subjetiva e envolvente. O tom deve evocar empatia, intuição e mistério.
       - Palavras-chave obrigatórias a incorporar sutilmente: maré, reflexo, emoção, sentimentos, intuição, mergulho, fluir.

4. QUALIDADE SUTIL DOS ASPECTOS:
   - Integre de maneira orgânica e imperceptível (sem nunca citar os nomes técnicos dos aspectos como "Conjunção", "Oposição", "Quadratura", "Trígono" ou "Sextil") o significado espiritual do aspecto astrológico ativo no dia:
     * Se Conjunção: Traga no texto a energia de impulso, autenticidade e fusão em síntese das qualidades dos signos.
     * Se Oposição: Traga no texto a dinâmica de dúvida reflexiva, equilíbrio das polaridades opostas e complementariedade.
     * Se Quadratura: Traga no texto a dinâmica de tensão emocional, conflitos internos, a paciência e a espera (lembre-se: a emoção turva a razão).
     * Se Trígono: Traga no texto a sensação de soluções fluidas, harmonia, clareza e criatividade natural abundante.
     * Se Sextil: Traga no texto a atitude de abertura para aprender e aplicar o que foi assimilado com sabedoria prática.

5. DIRETRIZES DE REVISÃO E FORMATO:
   - Certifique-se de que os conceitos estão perfeitamente alinhados aos arquétipos dos signos (ex.: Gêmeos evoca dualidade, mente e comunicação; Touro evoca persistência, valor e matéria; etc.).
   - Traga consistência ao texto de forma simples e prática.
   - ${userName ? `Use o nome do usuário "${userName}" abrindo o texto de forma dócil, calma e direta para trazer confiança e proximidade de forma natural (ex: "${userName}, ...").` : 'Adote um tom íntimo, acolhedor e próximo.'}
   - Máximo absoluto de 4 linhas de texto corrido.
   - O texto deve ser composto por um único bloco de parágrafo corrido, sem bullets ou aspas externas desnecessárias.
   - Nunca inclua cabeçalhos, títulos ou prefixos.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Sol em ${sunSignName || 'Desconhecido'}, Lua em ${moonSignName || 'Desconhecido'}. Tônica: "${philosophicalPhrase || ''}". Aspecto Ativo: ${aspectName || ''} (${aspectDesc || ''}). Que diretriz de postura este momento exige?`,
        config: {
          systemInstruction,
        }
      });

      res.json({ text: response.text });
    } catch (error) {
      // Quietly use the elegant fallback to handle offline/quota limits gracefully without polluting logs
      const fallbackText = generateFallbackOracle(sunSignName, moonSignName, philosophicalPhrase, userName, aspectDesc);
      res.json({ text: fallbackText });
    }
  });

  // API: Get Analyze/Reports Guidance
  app.post("/api/reports", async (req, res) => {
    const { period, logData, previousLogsData, correlationData, userName } = req.body;
    try {
      const ai = getAI();
      if (!process.env.GEMINI_API_KEY) {
        console.warn("GEMINI_API_KEY environment variable not set. Using elegant Hekat fallback analytical guidance.");
        return res.json({ text: generateFallbackReports(period, logData, userName) });
      }

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
                 4. ATENÇÃO ABSOLUTA: É estritamente proibido usar a palavra ou variação de "ao olhar seus últimos sete dias" ou "ao avaliar seus sentimentos". Comece o texto chamando a usuária pelo nome "${userName || 'Viajante'}" no início exato para trazer proximidade confiável (ex: "Nome, ...").
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
                 4. ATENÇÃO ABSOLUTA: É estritamente proibido usar a palavra ou variação de "ao olhar seus últimos vinte e nove dias", "ao olhar seu ciclo" ou "ao avaliar seus sentimentos/registros". Comece o texto chamando a usuária pelo nome "${userName || 'Viajante'}" no início exato para trazer proximidade confiável (ex: "Nome, ...").
                 5. Destaque tanto os pontos negativos que requerem atenção da usuária (vulnerabilidades, sombras ou resistências que a paralisam) quanto os pontos positivos que geram expansão de consciência.
                 6. Apresente uma síntese clara dos pontos recorrentes ao longo do período de 29 dias, ressaltando o que precisa ser finalizado.
                 7. Gere obrigatoriamente uma lista de tarefas estruturada e clara ao final, classificada exatamente nestas três classes de forma limpa:
                    - Iniciado: [tarefas iniciadas no período]
                    - Dar continuidade: [atividades ou processos para dar continuidade]
                    - Finalizado: [processos ou tarefas finalizadas ou a finalizar neste ciclo]
                 8. NÃO se restrinja a 4 ou 6 linhas. Desenvolva um texto reflexivo, consistente e profundo, seguido de forma espaçada pela lista de tarefas.
                 9. Formato: O texto de análise deve ser justificado, seguido pela seção da lista de tarefas estruturada de forma limpa e visível.`;
      } else if (period === 'correlation') {
        prompt = `Realize uma análise de correlação entre as fases da lua e os padrões de sentimentos/dados inseridos pela usuária.
                 DADOS DE CORRELAÇÃO DOS ÚLTIMOS 3 CICLOS (de 29 dias cada):\n${correlationData || 'Nenhum dado acumulado disponível ainda.'}\n
                 HISTÓRICO INTEGRADO:\n${previousLogsData || ''}\n${logData || ''}
                 
                 TAREFA EXCLUSIVA:
                 1. Faça uma correlação nítida e direta das fases da Lua (Nova, Crescente, Cheia, Minguante) com a repetição de padrões de sentimentos e dados inseridos pela usuária.
                 2. Destaque obrigatoriamente um sentimento prioritário identificado em cada uma das quatro fases lunares considerando os 3 últimos ciclos lunares de 29 dias.
                 3. Use uma linguagem acolhedora, fraterna, dócil e sábia de uma mentora sábia (Hekat é do gênero feminino). Evite superlativos sintéticos.
                 4. ATENÇÃO ABSOLUTA: Comece o texto chamando a usuária pelo nome "${userName || 'Viajante'}" no início exato para trazer proximidade de forma natural (ex: "Nome, ...").
                 5. Formato: Um texto corrido, integrado e orgânico de forma fluida.`;
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
                 7. ATENÇÃO ABSOLUTA: Comece o texto chamando a usuária pelo nome "${userName || 'Viajante'}" no início exato. Não use variações de "ao olhar seu trimestre" ou "ao avaliar seus sentimentos".
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
        - Chame sempre a pessoa pelo nome "${userName || 'Viajante'}" abrindo o texto para trazer confiança e proximidade de forma dócil, calma e direta (ex: "Nome, ...").
        - Nunca use cabeçalhos ou títulos introduzindo os relatórios. Comece de forma direta, madura e limpa.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Dados: \n${logData || 'Nenhum dado inserido ainda.'}\n${correlationData ? `Dados de Correlação: \n${correlationData}\n` : ''}\nTarefa: ${prompt}`,
        config: {
          systemInstruction,
        }
      });

      res.json({ text: response.text });
    } catch (error) {
      // Quietly use the elegant fallback to handle offline/quota limits gracefully without polluting logs
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
      server: { middlewareMode: true },
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Critical: Server failed to start:", err);
  process.exit(1);
});
