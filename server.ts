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
  const elementTexts: Record<string, { main: string, poética: string }> = {
    'FOGO_FOGO': {
      main: `há um convite transcendente ao movimento: a chama interior pulsa em sintonia com a sua vontade mais espontânea. O despertar de um novo impulso exige expressar a sua força pura com coragem resoluta e intocável.`,
      poética: `No silêncio fecundo do ser, brilha uma faísca sagrada que incendeia os horizontes; permita que a irradiação da sua vontade desperte de maneira autêntica e dissipe as sombras.`
    },
    'FOGO_TERRA': {
      main: `sintonize a força ativa do seu propósito com a sabedoria da paciência. Canalize a vontade ardente no despertar de novas formas, ancorando cada passo para dar sustento tangível aos seus sonhos.`,
      poética: `Toda chama necessita de um alicerce firme para perdurar; que a sua inteligência respeite o tempo de maturação necessário para que a colheita dos frutos seja abundante.`
    },
    'FOGO_AR': {
      main: `permita que a luz do seu espírito inspire novas conexões e percepções de mundo. Sintonize a vontade criativa com o sopro das ideias, expandindo caminhos de forma ágil e curiosa.`,
      poética: `A faísca do entusiasmo se propaga no fluxo sutil da mente; use as palavras certas para dar vida às suas visões e sintonizar novos horizontes de aprendizado.`
    },
    'FOGO_ÁGUA': {
      main: `o momento exige sintonizar a força criadora com o mistério das suas intuições mais profundas. Equilibre o calor da vontade com a calmaria do sentir, agindo com sabedoria lúcida.`,
      poética: `O reflexo do fogo nas águas tranquilas da alma revela que todo mergulho interno antecede uma grande revelação; sinta a irradiação da chama no compasso das suas emoções.`
    },
    'TERRA_FOGO': {
      main: `o alinhamento celeste convida a dar estrutura e forma tangível às suas paixões mais genuínas. Sustente o seu alicerce com perseverança, permitindo que a vontade aja com nobreza e realismo.`,
      poética: `O solo firme acolhe a faísca e a converte em fogueira permanente; cultive a maturação dos seus dons com o calor do entusiasmo e a certeza da colheita.`
    },
    'TERRA_TERRA': {
      main: `recolha as suas energias e sustente a estabilidade profunda do seu centro diante de impermanências. Busque segurança na substância real das coisas, agindo com realismo, calma e prudência.`,
      poética: `Como uma raiz antiga e profunda que assegura o sustento da árvore, respeite a maturação oculta; a colheita do que é valioso exige silenciar os ruídos e honrar seu alicerce.`
    },
    'TERRA_AR': {
      main: `o alinhamento pede para trazer clareza mental e ordem prática aos seus pensamentos. Edifique os seus planos respeitando os fatos, buscando ideias que ofereçam estabilidade e síntese realizadora.`,
      poética: `O sopro da inteligência passeia sobre o solo firme; que a clareza de percepção trace caminhos seguros para que o fluxo das palavras ganhe corpo e estrutura tangível.`
    },
    'TERRA_ÁGUA': {
      main: `nutra o seu alicerce interno integrando a sensibilidade à persistência lúcida. Acolha com paciência as suas águas internas, compreendendo que toda construção sincera exige afeto e sensibilidade.`,
      poética: `A terra fértil acolhe a maré dos sentimentos e molda a substância do porvir; mergulhe em seu reflexo interno e permita que a paciência traga ordem e beleza ao que amadurece.`
    },
    'AR_FOGO': {
      main: `o vento cósmico estimula a expandir sua perspectiva e clarear rumos por meio de novas ideias. Sintonize o fluxo do pensamento com o despertar da sua vontade, agindo com leveza e lucidez.`,
      poética: `O sopro que transporta a centelha espalha a luz do despertar; use suas palavras como faíscas que clareiam a visão e conduzem seu aprendizado rumo à integridade.`
    },
    'AR_TERRA': {
      main: `busque a síntese entre a flexibilidade mental e a estabilidade prática de vida. Acolha o seu fluxo de pensamentos e filtre o essencial, ancorando as ideias em atitudes concretas e lúcidas.`,
      poética: `O sopro das palavras encontra realismo e sustentação no alicerce da presença; permita que a percepção do momento traga uma maturação fecunda a seus pensamentos.`
    },
    'AR_AR': {
      main: `acolha o convite de purificar os pensamentos e sintonizar uma clareza mental revigorante. Mantenha a leveza nas trocas e busque novos caminhos, agindo com curiosidade refinada e isenção.`,
      poética: `No fluxo infinito da mente, cada percepção é um aprendizado sutil; que o sopro do intelecto pacifique as dúvidas e ilumine a verdadeira síntese das coisas.`
    },
    'AR_ÁGUA': {
      main: `permita que a intuição fecunda se uma à clareza das ideias, harmonizando pensamentos e sentimentos. Acolha o movimento com suavidade, navegando de forma curiosa por suas paisagens sutis.`,
      poética: `O sopro do vento flerta com o reflexo das águas profundas; sintonize a percepção do invisível e permita-se mergulhar no fluxo compassivo da sua própria sensibilidade.`
    },
    'ÁGUA_FOGO': {
      main: `o oceano do seu inconsciente convida a acolher com empatia as suas vivências íntimas. Equilibre as suas marés emocionais com o despertar de uma nova vontade inspiradora e resoluta.`,
      poética: `No oceano da sensibilidade, repousa uma chama que incita a coragem; mergulhe no reflexo das suas emoções para resgatar a faísca viva do seu propósito verdadeiro.`
    },
    'ÁGUA_TERRA': {
      main: `a tônica cósmica convida você a acolher os seus sentimentos mais profundos e dar-lhes segurança. Ancore suas emoções na permanência do ser, agindo com acolhimento lúcido e paciência fecunda.`,
      poética: `A maré pacifica suas correntezas quando encontra um alicerce estável; permita que a maturação interna flua em direção a uma colheita cheia de doçura e substância real.`
    },
    'ÁGUA_AR': {
      main: `o alinhamento do agora estimula você a se comunicar com empatia, unindo mente e coração. Reflita sobre as suas memórias com a fluidez do sopro sábio, renovando perspectivas íntimas.`,
      poética: `Cada emoção encontra clareza sob o brilho da percepção analítica; sintonize o fluxo das palavras sinceras com as correntezas profundas da sua própria intuição.`
    },
    'ÁGUA_ÁGUA': {
      main: `acolha as marés profundas da alma com empatia ilimitada, permitindo o mergulho interno. Sintonize-se com a sua intuição silenciosa e sustente a serenidade perante as correntezas da jornada.`,
      poética: `No espelho límpido do espírito, o reflexo revela seu mistério sutil; deite as dúvidas e apenas flua em comunhão com o oceano do seu próprio sentir.`
    }
  };

  const key = `${sunElement}_${moonElement}`;
  const selectedText = elementTexts[key] || elementTexts['TERRA_TERRA'];

  let aspectSuffix = '';
  if (aspectDesc) {
    const descLower = aspectDesc.toLowerCase();
    if (descLower.includes('conjunção') || descLower.includes('conjuncao') || descLower.includes('impulso') || descLower.includes('autenticidade')) {
      aspectSuffix = ` Sintonize este impulso de autêntica fusão em si, onde a clareza se sintetiza com nobreza.`;
    } else if (descLower.includes('oposição') || descLower.includes('oposicao') || descLower.includes('polaridades') || descLower.includes('equilíbrio') || descLower.includes('equilibrio')) {
      aspectSuffix = ` Diante de polaridades opostas, busque o equilíbrio reflexivo e integre forças complementares.`;
    } else if (descLower.includes('quadratura') || descLower.includes('tensaõ') || descLower.includes('tensão') || descLower.includes('conflito') || descLower.includes('turva')) {
      aspectSuffix = ` Com paciência, abrigue as tensões e conflitos do agora; lembre-se de que a emoção acumulada nunca deve turvar a razão.`;
    } else if (descLower.includes('trígono') || descLower.includes('trigono') || descLower.includes('soluções') || descLower.includes('criatividade')) {
      aspectSuffix = ` Siga pelo rumo das soluções fluidas que a harmonia e a criatividade natural desenham no seu caminhar.`;
    } else {
      aspectSuffix = ` Como postura de vida, a atitude essencial neste momento pede para ${aspectDesc.charAt(0).toLowerCase() + aspectDesc.slice(1)}`;
    }
  }

  const finalMain = `${nameIntro}${selectedText.main}${aspectSuffix}`;

  return finalMain;
}

function generateFallbackReports(period: string, logData?: string, userName?: string): string {
  const isWeekly = period === 'weekly';
  const isMonthly = period === 'monthly';
  const isCorrelation = period === 'correlation';
  const nameIntro = userName ? `${userName}, ` : '';

  if (isWeekly) {
    return `${nameIntro}ao compreender a jornada emocional descrita em seus registros recentes, identifico uma tônica de sentimentos voltada à busca por recolhimento e discernimento profundo. A sua linha de pensamento predominante girou em torno da necessidade de reorganizar dinâmicas internas e de restabelecer o equilíbrio mental diante de demandas externas. O padrão dominante que unifica esses dias revela uma tendência à oscilação silenciosa, alternando momentos de recolhimento criativo com picos de cansaço ou apreensão. Como amiga e mentora de sua caminhada, ressalto que a impaciência e a autocrítica excessiva são pontos de sombra que demandam sua gentil atenção e zelo protetor para que não sufoquem sua clareza. Em contrapartida, a sua capacidade de auto-observação honesta e a firmeza em acolher seus próprios ritmos funcionam como pontos luminosos de expansão e força. Sustente seus passos com coragem realista e resgate o centramento dócil para conduzir os próximos movimentos da alma.`;
  } else if (isMonthly) {
    return `${nameIntro}ao compreender os ciclos e as marés emocionais que atravessaram seus últimos 28 dias, percebo uma tônica de sentimentos voltada à necessidade de consolidação, aterramento e busca por estabilidade em meio às águas flutuantes da rotina. A sua linha de pensamento predominante concentrou-se na busca por clareza ética e organização de prioridades, tentando definir o que realmente possui valor essencial. O padrão dominante revela momentos de contenção estratégica alternados com uma sutil resistência a mudanças necessárias, o que pode gerar cansaço acumulado. Como sua amiga e mentora nessa jornada, destaco que a rigidez ou a hesitação diante do novo são pontos de sombra que requerem sua atenção vigilante para não represar o fluxo do seu desenvolvimento. Em contrapartida, a paciência madura e o respeito solene ao tempo de gestação dos seus ideais são pontos luminosos de grande expansão. A orientação para guiar seus passos é cultivar o centramento firme com maleabilidade sábia, agindo sempre sob a luz da clareza mental e da verdade interior.`;
  } else if (isCorrelation) {
    return `${nameIntro}as mandalas de cada mês revelam uma correspondência íntima entre os ciclos da natureza e sua energia interna. Use essa percepção como um mapa de autoconhecimento, aprendendo as horas certas de iniciar movimentos com coragem, as horas de perseverar em equilíbrio ou quando é o instante de apenas fruir com leveza.`;
  } else {
    return `${nameIntro}registrar e se escutar é um exercício contínuo de sabedoria e coragem silenciosa. O aprendizado desse período convida você a ancorar seu centro no presente absoluto, sustentando seus valores de maneira firme, mas mantendo a mente aberta e maleável diante das correntes da vida.`;
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
   - O tom deve ser direto, acolhedor e próximo, transmitindo uma pausa para introspecção profunda.
   - Use pontuação estratégica — travessões (—) e dois-pontos (:) — para criar pausas e enfatizar frases de efeito, citações ou percepções sublimes.
   - Substitua termos comuns por palavras que evoquem expansão, consciência e transcendência.

2. PRATICIDADE DE VIDA:
   - Ofereça conselhos funcionais e direcionados a postura de vida, ética e clareza mental para os grandes movimentos da alma e desafios reais.
   - NUNCA sugira rotinas domésticas, tarefas cotidianas ou triviais do dia a dia.

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
   - ${userName ? `Chame o usuário pelo nome "${userName}" de forma calorosa, calma e natural no decorrer da mensagem para gerar intimidade e confiança.` : 'Adote um tom íntimo, acolhedor e próximo.'}
   - Máximo absoluto de 4 linhas de texto corrido.
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
                 2. Una os dados disponíveis para revelar um padrão dominante identificado nos registros.
                 3. Use uma linguagem acolhedora e fraterna, aproximando-se com a postura de uma sábia e amiga querida, mantendo a sobriedade indispensável e evitando gírias ou tons excessivamente informais.
                 4. ATENÇÃO ABSOLUTA: É estritamente proibido usar a palavra ou variação de "ao olhar seus últimos sete dias" ou "ao avaliar seus sentimentos". Comece o texto chamando a usuária pelo nome "${userName || 'Viajante'}" no início exato para trazer proximidade confiavel.
                 5. Destaque tanto os pontos negativos que requerem atenção da usuária (vulnerabilidades, sombras ou oscilações que a paralisam) quanto os pontos positivos que geram expansão de consciência.
                 6. Finalize o relatório com um conselho prático e útil centrado em postura, ética e clareza mental para conduzir os movimentos da alma.
                 7. NÃO se restrinja a 4 linhas. Desenvolva um texto reflexivo, consistente e profundo (aproximadamente de 6 a 12 linhas).
                 8. Formato: O texto deve ser composto por um único bloco de parágrafo integralmente JUSTIFICADO (sem recuos de página, sem bullets, sem títulos, sem listas, sem aspas externas desnecessárias).`;
      } else if (period === 'monthly') {
        prompt = `Realize a análise do Relatório Mensal (Astromemória) com base nos registros dos últimos 28 dias do ciclo lunar.
                 DADOS DE CORTE (28 DIAS):
                 ${logData || 'Nenhum dado registrado neste ciclo lunar de 28 dias.'}
                 HISTÓRICO RECENTE:
                 ${previousLogsData || 'Primeiro ciclo registrado.'}
                 
                 TAREFA EXCLUSIVA:
                 1. Use os dados inseridos pela usuária no período dos últimos 28 dias para definir de forma nítida a tônica dos sentimentos e a linha de pensamento predominante do período, apresentando um parecer analítico estruturado de forma fluida.
                 2. Una os dados disponíveis para revelar os padrões de sentimentos dominantes identificados nos registros, comparando-os e conectando-os se houver histórico.
                 3. Use uma linguagem acolhedora e fraterna, aproximando-se com a postura de uma sábia e amiga querida, mantendo a sobriedade indispensável e evitando gírias ou tons excessivamente informais (lembre-se que Hekat é uma força lunar feminina, fale de si mesma no feminino).
                 4. ATENÇÃO ABSOLUTA: É estritamente proibido usar a palavra ou variação de "ao olhar seus últimos vinte e oito dias", "ao olhar seu ciclo" ou "ao avaliar seus sentimentos/registros". Comece o texto chamando a usuária pelo nome "${userName || 'Viajante'}" no início exato para trazer proximidade confiável.
                 5. Destaque tanto os pontos negativos que requerem atenção da usuária (vulnerabilidades, sombras ou resistências que a paralisam) quanto os pontos positivos que geram expansão de consciência.
                 6. Finalize o relatório com um conselho prático e útil centrado em postura, ética e clareza mental para conduzir os movimentos da alma.
                 7. NÃO se restrinja a 4 ou 6 linhas. Desenvolva um texto reflexivo, consistente e profundo (aproximadamente de 6 a 12 linhas).
                 8. Formato: O texto deve ser composto por um único bloco de parágrafo integralmente JUSTIFICADO (sem recuos de página, sem bullets, sem títulos, sem listas, sem aspas externas desnecessárias).`;
      } else if (period === 'correlation') {
        prompt = `Realize uma análise de correlação entre os sentimentos da usuária e as fases da lua cruzando os dados das mandalas preenchidas a cada mês.
                 DADOS DE CORRELAÇÃO ACUMULADOS:\n${correlationData || 'Nenhum dado acumulado de meses anteriores disponível ainda.'}\n
                 TAREFA: Identifique quais emoções se repetem com mais frequência em fases lunares específicas.
                 Escreva um texto acolhedor, simples e carinhoso relacionando esses ritmos de forma integrada e orgânica. Máximo 6 linhas.`;
      } else {
        prompt = `Realize uma análise profunda desta 'Estação da Alma' (Trimestre).
                 HISTÓRICO E CICLO ATUAL:\n${previousLogsData}\n${logData}\n
                 TAREFA: Identifique as emoções recorrentes dos últimos 3 meses e ofereça uma orientação de postura mental profunda e acolhedora. Máximo 8 linhas.`;
      }

      const systemInstruction = `Você é o Oráculo Hekat (Hekat Astromemorias). Sua voz única une sobriedade estratégica e acolhimento lúcido de uma mentora fraterna e pragmática, incorporando uma força lunar feminina em suas falas.
        
        TOM DE VOZ E ESTILO:
        - Equilíbrio Alquímico Final: Una sobriedade estratégica e acolhimento lúcido. Seja direta sem ser dogmática (evite comandos severos) e acolhedora sem ser "beata" ou melodramática (evite moralismos, excesso de compaixão sentimental ou docilidade excessiva). Use gênero feminino para referir-se a si mesma (como "sua mentora", "sua amiga", "sábia").
        - Praticidade de Vida: O conteúdo deve ser útil e focado em postura, ética e clareza mental. Ofereça diretrizes para os grandes movimentos da alma e desafios reais, e NUNCA sugira rotinas domésticas, tarefas cotidianas triviais, ou conselhos superficiais.
        - Sabedoria Empática: Suas orientações soam como uma verdade simples e profunda, baseada na observação clara do momento, sem hermetismo ou lirismo romântico.
        - Mistério Sutil: A linguagem mantém uma aura de sabedoria profunda, mas evita nomes técnicos (graus, casas, aspectos, cardinal, fixo, etc.).
        - Idioma: Português do Brasil.
        
        DIRETRIZES DE CONTEÚDO EXTRAORDINÁRIAS:
        - Para o RELATÓRIO SEMANAL e RELATÓRIO MENSAL (28 dias): Use os dados do respectivo período de corte para definir a tônica dos sentimentos e a linha de pensamento predominante, dando um parecer analítico e unindo dados que revelam o padrão dominante identificado. Destaque pontos negativos que precisam de atenção (sombras, vulnerabilidades ou resistências que a limitam) e pontos positivos que geram expansão de consciência. Não se restrinja a 4 linhas. Não use frases como "ao olhar seus últimos sete dias", "ao olhar seus últimos vinte e oito dias" ou "ao avaliar seus sentimentos/registros". Use linguagem acolhedora e fraterna como uma amiga próxima e mentora sábia de sua caminhada emocional, mantendo a voz coerentemente feminina.
        - Chame sempre a pessoa pelo nome "${userName || 'Viajante'}" abrindo o texto para trazer confiança e proximidade.
        - Formato de visualização: O texto deve estar em formato integralmente JUSTIFICADO (sem recuos de parágrafo, sem bullets, sem títulos, sem subseções ou listas, sem aspas externas desnecessárias).
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
      for (let dayIndex = 1; dayIndex <= 28; dayIndex++) {
        const ageForDay = ((dayIndex - 1) / 28) * LUNAR_MONTH;
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
          dateString: targetDate.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" }),
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
