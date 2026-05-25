import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import admin from "firebase-admin";
import { GoogleGenAI } from "@google/genai";

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
  const sun = sunSignName || 'Sol';
  const moon = moonSignName || 'Lua';
  const tônica = philosophicalPhrase ? `"${philosophicalPhrase}"` : 'da quietude e do autocuidado';
  const nameIntro = userName ? `${userName}, ` : '';
  const aspectSuffix = aspectDesc ? ` Como postura de vida, a atitude essencial neste momento pede para ${aspectDesc.charAt(0).toLowerCase() + aspectDesc.slice(1)}` : '';

  const messages = [
    `${nameIntro}há um convite profundo ao estado de presença plena agora. A orientação é sintonizar-se com a força viva de iniciar novos ciclos, dando o primeiro passo com coragem pura, como uma semente de luz que rompe a terra em silêncio absoluto.${aspectSuffix}`,
    `${nameIntro}aqui, na quietude de hoje, a tônica de eixos como ${tônica} convida você a silenciar os ruídos do mundo de fora. A orientação é ancorar seu centro na permanência pacífica do agora: sustente sua presença de forma firme e estável diante de qualquer impermanência.${aspectSuffix}`,
    `${nameIntro}acolha os momentos de transição da mente com a flexibilidade da água que sabe contornar cada pedra sem perder o rumo. A orientação é fluir nas mudanças da jornada, adaptando seu coração com suavidade e leveza.${aspectSuffix}`,
    `Que bom ter você aqui${userName ? `, ${userName}` : ''}. Sintonizando a tônica de ${tônica}, a orientação é acolher as coisas exatamente como elas se manifestam. A verdadeira estabilidade vem de ser como a montanha: firme, desperta e totalmente em paz.${aspectSuffix}`
  ];

  const hashString = `${sun}-${moon}-${tônica}`;
  let hash = 0;
  for (let i = 0; i < hashString.length; i++) {
    hash = (hash << 5) - hash + hashString.charCodeAt(i);
    hash |= 0; 
  }
  const index = Math.abs(hash) % messages.length;
  return messages[index];
}

function generateFallbackReports(period: string, logData?: string, userName?: string): string {
  const isWeekly = period === 'weekly';
  const isMonthly = period === 'monthly';
  const isCorrelation = period === 'correlation';
  const nameIntro = userName ? `${userName}, ` : '';

  if (isWeekly) {
    return `${nameIntro}ao avaliar seus sentimentos nos últimos dias, vemos como você navegou por suas marés internas. A orientação para os próximos dias é cultivar a presença calma e o desapego das expectativas exageradas. Seja forte para dar novos passos ou recuar, agindo de acordo com a sabedoria de cada instante.`;
  } else if (isMonthly) {
    return `${nameIntro}observar como suas emoções mudaram ao longo das fases mostra que sua sensibilidade é um guia constante. A reflexão deste ciclo convida você a aceitar as transições com a flexibilidade de quem acolhe o vento, compreendendo que o recolhimento e o desabrochar são faces da mesma impermanência.`;
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

      const systemInstruction = `Você é o Oráculo Hekat (Hekat Astromemorias).
        TOM: Simples, acolhedor e próximo, mas com profundidade real. Sua voz deve ser calorosa, trazendo uma pausa clara para sintonizar a mente e o coração. Evite termos rebuscados ou herméticos (como "ética do silêncio", "sobriedade estratégica", "precipitação", "dignidade"), mas passe longe de conselhos excessivamente simplistas ou infantis ("tente respirar fundo", "faça um chá", "tire o dia para descansar").
        REFERÊNCIA FILOSÓFICA & POSTURA: Utilize ensinamentos do Zen Budismo (presença, atenção plena ao aqui e agora, aceitação da impermanência, desapego das expectativas e clareza de quietude essencial) como base inspiradora para as orientações e atitudes de vida sugeridas.
        CONHECIMENTO ASTROLÓGICO: Mantenha a profunda sintonia do zodíaco e a sabedoria da simbologia de cada signo (Sol e Lua). Integre na orientação a essência profunda dos ritmos do zodíaco, mas de forma sutil, sem NUNCA citar as nomenclaturas técnicas:
          - Noção de INICIAÇÃO (abrir caminhos, agir com prontidão e coragem, dar o primeiro passo, plantar novas intenções).
          - Noção de SUSTENTAÇÃO (conservar a estabilidade, resistir pacientemente, focar na permanência do centro equilibrado).
          - Noção de FLUIDEZ (maleabilidade, adaptação às transições e flutuações, flexibilidade, facilidade em contornar obstáculos).
        SIMBOLOGIA DO ASPECTO ATIVO DO DIA:
        - Insira de forma obrigatória, sutil, inteligente e natural na orientação de postura a seguinte simbologia para o aspecto de hoje, mas sem NUNCA citar o nome técnico do aspecto ("${aspectName || ''}"): "${aspectDesc || ''}".
        CONTEÚDO ESSENCIAL:
        Toda resposta deve obrigatoriamente trazer:
        1. Uma breve REFLEXÃO sincera e lúcida sobre o clima celeste ou emocional atual, ajudando a compreender as energias presentes.
        2. Uma ORIENTAÇÃO clara e firme de postura de vida, baseada na sabedoria Zen e na sintonia zodiacal (junto da simbologia acima), para guiar os passos no dia a dia. Nunca sugira tarefas domésticas ou rotinas cotidianas.
        REGRAS:
        - Una profundidade, simplicidade, clareza mental e acolhimento em uma verdade profunda de vida.
        - NUNCA declare literalmente as posições de Sol e Lua (como "com o Sol em Touro e a Lua em Áries", "seu Sol em..." ou "posição do sol e lua..."). Sintonize a energia implícita dos astros e signos na reflexão e orientação de forma sutil, sem citar onde eles se localizam no céu ou o nome de nenhum aspecto astrológico.
        - Entre direto com o texto, de forma direta e sem rodeios. NUNCA coloque cabeçalhos, títulos ou introduções descritivas como marcas de listas ou parágrafos nomeados.
        ${userName ? `- Chame a pessoa usuária pelo nome "${userName}" de forma calma e natural no decorrer do texto.` : ''}
        - Nunca use termos astrológicos técnicos (como casas, graus, ou cardinal, fixo, mutável, sextil, conjunção, quadratura, trígono, oposição).
        - Máximo de 4 linhas.
        - Português do Brasil.`;

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
        prompt = `Analise os últimos registros e forneça um relatório semanal conciso focando em tendências e um conselho místico de postura. Máximo 4 linhas.`;
      } else if (period === 'monthly') {
        prompt = `Realize uma síntese deste ciclo lunar (Astromemória). 
                 DADOS ATUAIS:\n${logData || 'Nenhum dado atual.'}\n
                 HISTÓRICO RECENTE:\n${previousLogsData || 'Primeiro ciclo registrado.'}\n
                 TAREFA: Compare o ciclo atual com o histórico. Identifique estados emocionais que se repetem (padrões). 
                 Sintetize como esses padrões moldam a realidade da usuária, dando continuidade à avaliação do mês passado. Máximo 6 linhas.`;
      } else if (period === 'correlation') {
        prompt = `Realize uma análise de correlação entre os sentimentos da usuária e as fases da lua cruzando os dados das mandalas preenchidas a cada mês.
                 DADOS DE CORRELAÇÃO ACUMULADOS:\n${correlationData || 'Nenhum dado acumulado de meses anteriores disponível ainda.'}\n
                 TAREFA: Identifique quais emoções se repetem com mais frequência em fases lunares específicas (por exemplo, quais sentimentos predominam na Lua Nova, Cheia, Crescente ou Minguante ao longo das mandalas mensais sucessivas).
                 Escreva um texto acolhedor, simples e carinhoso relacionando esses ritmos, mostrando de um jeito leve como seu corpo e emoções conversam com a lua ao longo do tempo. Máximo 6 linhas.`;
      } else {
        prompt = `Realize uma análise profunda desta 'Estação da Alma' (Trimestre).
                  HISTÓRICO E CICLO ATUAL:\n${previousLogsData}\n${logData}\n
                  TAREFA: Identifique as emoções recorrentes dos últimos 3 meses e ofereça uma orientação de postura mental profunda e acolhedora. Máximo 8 linhas.`;
      }

      const systemInstruction = `Você é o Analista Hekat de Hekat Astromemorias. O app é um diário de sentimentos para ajudar a pessoa a se acolher, entender e acompanhar seus sentimentos com carinho e simplicidade.
        TOM: Simples, acolhedor, próximo e compreensivo, mas com sabedoria real. Sua voz deve ser calorosa e amiga, ajudando a entender as próprias fases de humor com suavidade e sem julgamentos. Evite termos difíceis ou discursos rebuscados (como "sintetizar flutuações", "sobriedade", "resiliência", "bússola de vida", "ética"), mas também afaste-se de conselhos infantis ou superficiais ("tire o dia para tomar um chá", "fique tranquila", "descanse").
        REFERÊNCIA FILOSÓFICA & REFLEXÃO: Conecte as análises e reflexões de sentimentos à filosofia do Zen Budismo (observação sem julgamentos das marés internas, paciência compassiva, a impermanência natural do humor e o centramento silencioso no estado de presença desperta).
        CONHECIMENTO ASTROLÓGICO: Traga a sabedoria da sintonia celeste da lua e do zodíaco. Evidencie na orientação de postura os ritmos zodiacais sem NUNCA usar seus nomes ou classificações formais:
          - A dinâmica de INICIAR ativamente, o primeiro passo, a criação de novas intenções conscientes.
          - A dinâmica de SUSTENTAR e solidificar com firmeza de propósito, resistindo em equilíbrio.
          - A dinâmica de FLUIDEZ, maleabilidade nas mudanças diárias, capacidade de adaptação leve e desprendida.
        CONTEÚDO DA ANÁLISE:
        Sua análise deve conter:
        1. Uma REFLEXÃO nítida e acolhedora correlacionando os sentimentos registrados com os ritmos e ciclos da lua. Evidencie pontos de repetição ou vulnerabilidades demonstradas com base no fluxo natural.
        2. Uma ORIENTAÇÃO direta e focada em postura mental, equilíbrio emocional ou atitude de vida inteligente para lidar melhor com as marés internas, inspirada na sabedoria Zen de presença dócil e perseverança, sem sugerir tarefas domésticas ou rotinas cotidianas.
        
        REGRAS ESPECÍFICAS:
        ${isLongTerm 
          ? "- Identifique com clareza e termos simples os states de humor recorrentes.\n          - Lembre o usuário de que o recolhimento ou a expansão são partes do fluxo natural.\n          - Forneça orientações amigáveis e sensatas para sustentar a calma interna." 
          : "- Máximo de 4 linhas de forma bem simples, carinhosa, precisa e direta."}
        
        REGRAS GERAIS:
        - Use um linguajar próximo, amigável e sábio.
        - NUNCA introduza a análise com cabeçalhos ou títulos (como "Análise Semanal:", "Análise de Ciclo Lunar:", "Sintonia das Fases:", "Estação da Alma:"). Comece o texto de reflexão de forma direta, sem introduções protocolares.
        - NUNCA declare a posição literal do sol e da lua no céu (como "Sol em X e Lua em Y"). Fale apenas do fluxo geral e do ritmo natural das marés internas de forma integrada e orgânica.
        ${userName ? `- Chame a pessoa pelo nome "${userName}" de forma calma e natural no decorrer do texto.` : ''}
        - Nunca use termos técnicos de astrologia (como casas, graus, aspectos, cardinal, fixo, mutável).
        - Português do Brasil.`;

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
