var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_dotenv = __toESM(require("dotenv"), 1);
var import_express = __toESM(require("express"), 1);
var import_vite = require("vite");
var import_path = __toESM(require("path"), 1);
var import_axios = __toESM(require("axios"), 1);
var import_firebase_admin = __toESM(require("firebase-admin"), 1);
var import_genai = require("@google/genai");
import_dotenv.default.config();
var aiClient = null;
function getAI() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY environment variable not set on the server.");
    }
    aiClient = new import_genai.GoogleGenAI({
      apiKey: apiKey || "",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return aiClient;
}
function generateFallbackOracle(sunSignName, moonSignName, philosophicalPhrase, userName, aspectDesc) {
  const sun = sunSignName || "Sol";
  const moon = moonSignName || "Lua";
  const t\u00F4nica = philosophicalPhrase ? `"${philosophicalPhrase}"` : "da quietude e do autocuidado";
  const nameIntro = userName ? `${userName}, ` : "";
  const aspectSuffix = aspectDesc ? ` Como postura de vida, a atitude essencial neste momento pede para ${aspectDesc.charAt(0).toLowerCase() + aspectDesc.slice(1)}` : "";
  const messages = [
    `${nameIntro}h\xE1 um convite profundo ao estado de presen\xE7a plena agora. A orienta\xE7\xE3o \xE9 sintonizar-se com a for\xE7a viva de iniciar novos ciclos, dando o primeiro passo com coragem pura, como uma semente de luz que rompe a terra em sil\xEAncio absoluto.${aspectSuffix}`,
    `${nameIntro}aqui, na quietude de hoje, a t\xF4nica de eixos como ${t\u00F4nica} convida voc\xEA a silenciar os ru\xEDdos do mundo de fora. A orienta\xE7\xE3o \xE9 ancorar seu centro na perman\xEAncia pac\xEDfica do agora: sustente sua presen\xE7a de forma firme e est\xE1vel diante de qualquer imperman\xEAncia.${aspectSuffix}`,
    `${nameIntro}acolha os momentos de transi\xE7\xE3o da mente com a flexibilidade da \xE1gua que sabe contornar cada pedra sem perder o rumo. A orienta\xE7\xE3o \xE9 fluir nas mudan\xE7as da jornada, adaptando seu cora\xE7\xE3o com suavidade e leveza.${aspectSuffix}`,
    `Que bom ter voc\xEA aqui${userName ? `, ${userName}` : ""}. Sintonizando a t\xF4nica de ${t\u00F4nica}, a orienta\xE7\xE3o \xE9 acolher as coisas exatamente como elas se manifestam. A verdadeira estabilidade vem de ser como a montanha: firme, desperta e totalmente em paz.${aspectSuffix}`
  ];
  const hashString = `${sun}-${moon}-${t\u00F4nica}`;
  let hash = 0;
  for (let i = 0; i < hashString.length; i++) {
    hash = (hash << 5) - hash + hashString.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % messages.length;
  return messages[index];
}
function generateFallbackReports(period, logData, userName) {
  const isWeekly = period === "weekly";
  const isMonthly = period === "monthly";
  const isCorrelation = period === "correlation";
  const nameIntro = userName ? `${userName}, ` : "";
  if (isWeekly) {
    return `${nameIntro}ao avaliar seus sentimentos nos \xFAltimos dias, vemos como voc\xEA navegou por suas mar\xE9s internas. A orienta\xE7\xE3o para os pr\xF3ximos dias \xE9 cultivar a presen\xE7a calma e o desapego das expectativas exageradas. Seja forte para dar novos passos ou recuar, agindo de acordo com a sabedoria de cada instante.`;
  } else if (isMonthly) {
    return `${nameIntro}observar como suas emo\xE7\xF5es mudaram ao longo das fases mostra que sua sensibilidade \xE9 um guia constante. A reflex\xE3o deste ciclo convida voc\xEA a aceitar as transi\xE7\xF5es com a flexibilidade de quem acolhe o vento, compreendendo que o recolhimento e o desabrochar s\xE3o faces da mesma imperman\xEAncia.`;
  } else if (isCorrelation) {
    return `${nameIntro}as mandalas de cada m\xEAs revelam uma correspond\xEAncia \xEDntima entre os ciclos da natureza e sua energia interna. Use essa percep\xE7\xE3o como um mapa de autoconhecimento, aprendendo as horas certas de iniciar movimentos com coragem, as horas de perseverar em equil\xEDbrio ou quando \xE9 o instante de apenas fruir com leveza.`;
  } else {
    return `${nameIntro}registrar e se escutar \xE9 um exerc\xEDcio cont\xEDnuo de sabedoria e coragem silenciosa. O aprendizado desse per\xEDodo convida voc\xEA a ancorar seu centro no presente absoluto, sustentando seus valores de maneira firme, mas mantendo a mente aberta e male\xE1vel diante das correntes da vida.`;
  }
}
var adminDb = null;
function getAdminDb() {
  if (!adminDb) {
    if (!import_firebase_admin.default.apps.length) {
      try {
        import_firebase_admin.default.initializeApp();
      } catch (error) {
        console.error("Firebase Admin initialization failed:", error);
      }
    }
    try {
      adminDb = import_firebase_admin.default.firestore();
    } catch (error) {
      console.error("Firestore Admin retrieval failed:", error);
    }
  }
  return adminDb;
}
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json());
  app.post("/api/oracle", async (req, res) => {
    const { sunSignName, moonSignName, philosophicalPhrase, userName, aspectName, aspectDesc } = req.body;
    try {
      const ai = getAI();
      if (!process.env.GEMINI_API_KEY) {
        console.warn("GEMINI_API_KEY environment variable not set. Using elegant Hekat fallback guidance.");
        return res.json({ text: generateFallbackOracle(sunSignName, moonSignName, philosophicalPhrase, userName, aspectDesc) });
      }
      const systemInstruction = `Voc\xEA \xE9 o Or\xE1culo Hekat (Hekat Astromemorias).
        TOM: Simples, acolhedor e pr\xF3ximo, mas com profundidade real. Sua voz deve ser calorosa, trazendo uma pausa clara para sintonizar a mente e o cora\xE7\xE3o. Evite termos rebuscados ou herm\xE9ticos (como "\xE9tica do sil\xEAncio", "sobriedade estrat\xE9gica", "precipita\xE7\xE3o", "dignidade"), mas passe longe de conselhos excessivamente simplistas ou infantis ("tente respirar fundo", "fa\xE7a um ch\xE1", "tire o dia para descansar").
        REFER\xCANCIA FILOS\xD3FICA & POSTURA: Utilize ensinamentos do Zen Budismo (presen\xE7a, aten\xE7\xE3o plena ao aqui e agora, aceita\xE7\xE3o da imperman\xEAncia, desapego das expectativas e clareza de quietude essencial) como base inspiradora para as orienta\xE7\xF5es e atitudes de vida sugeridas.
        CONHECIMENTO ASTROL\xD3GICO: Mantenha a profunda sintonia do zod\xEDaco e a sabedoria da simbologia de cada signo (Sol e Lua). Integre na orienta\xE7\xE3o a ess\xEAncia profunda dos ritmos do zod\xEDaco, mas de forma sutil, sem NUNCA citar as nomenclaturas t\xE9cnicas:
          - No\xE7\xE3o de INICIA\xC7\xC3O (abrir caminhos, agir com prontid\xE3o e coragem, dar o primeiro passo, plantar novas inten\xE7\xF5es).
          - No\xE7\xE3o de SUSTENTA\xC7\xC3O (conservar a estabilidade, resistir pacientemente, focar na perman\xEAncia do centro equilibrado).
          - No\xE7\xE3o de FLUIDEZ (maleabilidade, adapta\xE7\xE3o \xE0s transi\xE7\xF5es e flutua\xE7\xF5es, flexibilidade, facilidade em contornar obst\xE1culos).
        SIMBOLOGIA DO ASPECTO ATIVO DO DIA:
        - Insira de forma obrigat\xF3ria, sutil, inteligente e natural na orienta\xE7\xE3o de postura a seguinte simbologia para o aspecto de hoje, mas sem NUNCA citar o nome t\xE9cnico do aspecto ("${aspectName || ""}"): "${aspectDesc || ""}".
        CONTE\xDADO ESSENCIAL:
        Toda resposta deve obrigatoriamente trazer:
        1. Uma breve REFLEX\xC3O sincera e l\xFAcida sobre o clima celeste ou emocional atual, ajudando a compreender as energias presentes.
        2. Uma ORIENTA\xC7\xC3O clara e firme de postura de vida, baseada na sabedoria Zen e na sintonia zodiacal (junto da simbologia acima), para guiar os passos no dia a dia. Nunca sugira tarefas dom\xE9sticas ou rotinas cotidianas.
        REGRAS:
        - Una profundidade, simplicidade, clareza mental e acolhimento em uma verdade profunda de vida.
        - NUNCA declare literalmente as posi\xE7\xF5es de Sol e Lua (como "com o Sol em Touro e a Lua em \xC1ries", "seu Sol em..." ou "posi\xE7\xE3o do sol e lua..."). Sintonize a energia impl\xEDcita dos astros e signos na reflex\xE3o e orienta\xE7\xE3o de forma sutil, sem citar onde eles se localizam no c\xE9u ou o nome de nenhum aspecto astrol\xF3gico.
        - Entre direto com o texto, de forma direta e sem rodeios. NUNCA coloque cabe\xE7alhos, t\xEDtulos ou introdu\xE7\xF5es descritivas como marcas de listas ou par\xE1grafos nomeados.
        ${userName ? `- Chame a pessoa usu\xE1ria pelo nome "${userName}" de forma calma e natural no decorrer do texto.` : ""}
        - Nunca use termos astrol\xF3gicos t\xE9cnicos (como casas, graus, ou cardinal, fixo, mut\xE1vel, sextil, conjun\xE7\xE3o, quadratura, tr\xEDgono, oposi\xE7\xE3o).
        - M\xE1ximo de 4 linhas.
        - Portugu\xEAs do Brasil.`;
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Sol em ${sunSignName || "Desconhecido"}, Lua em ${moonSignName || "Desconhecido"}. T\xF4nica: "${philosophicalPhrase || ""}". Aspecto Ativo: ${aspectName || ""} (${aspectDesc || ""}). Que diretriz de postura este momento exige?`,
        config: {
          systemInstruction
        }
      });
      res.json({ text: response.text });
    } catch (error) {
      const fallbackText = generateFallbackOracle(sunSignName, moonSignName, philosophicalPhrase, userName, aspectDesc);
      res.json({ text: fallbackText });
    }
  });
  app.post("/api/reports", async (req, res) => {
    const { period, logData, previousLogsData, correlationData, userName } = req.body;
    try {
      const ai = getAI();
      if (!process.env.GEMINI_API_KEY) {
        console.warn("GEMINI_API_KEY environment variable not set. Using elegant Hekat fallback analytical guidance.");
        return res.json({ text: generateFallbackReports(period, logData, userName) });
      }
      const isLongTerm = period === "monthly" || period === "quarterly" || period === "correlation";
      let prompt = "";
      if (period === "weekly") {
        prompt = `Analise os \xFAltimos registros e forne\xE7a um relat\xF3rio semanal conciso focando em tend\xEAncias e um conselho m\xEDstico de postura. M\xE1ximo 4 linhas.`;
      } else if (period === "monthly") {
        prompt = `Realize uma s\xEDntese deste ciclo lunar (Astromem\xF3ria). 
                 DADOS ATUAIS:
${logData || "Nenhum dado atual."}

                 HIST\xD3RICO RECENTE:
${previousLogsData || "Primeiro ciclo registrado."}

                 TAREFA: Compare o ciclo atual com o hist\xF3rico. Identifique estados emocionais que se repetem (padr\xF5es). 
                 Sintetize como esses padr\xF5es moldam a realidade da usu\xE1ria, dando continuidade \xE0 avalia\xE7\xE3o do m\xEAs passado. M\xE1ximo 6 linhas.`;
      } else if (period === "correlation") {
        prompt = `Realize uma an\xE1lise de correla\xE7\xE3o entre os sentimentos da usu\xE1ria e as fases da lua cruzando os dados das mandalas preenchidas a cada m\xEAs.
                 DADOS DE CORRELA\xC7\xC3O ACUMULADOS:
${correlationData || "Nenhum dado acumulado de meses anteriores dispon\xEDvel ainda."}

                 TAREFA: Identifique quais emo\xE7\xF5es se repetem com mais frequ\xEAncia em fases lunares espec\xEDficas (por exemplo, quais sentimentos predominam na Lua Nova, Cheia, Crescente ou Minguante ao longo das mandalas mensais sucessivas).
                 Escreva um texto acolhedor, simples e carinhoso relacionando esses ritmos, mostrando de um jeito leve como seu corpo e emo\xE7\xF5es conversam com a lua ao longo do tempo. M\xE1ximo 6 linhas.`;
      } else {
        prompt = `Realize uma an\xE1lise profunda desta 'Esta\xE7\xE3o da Alma' (Trimestre).
                  HIST\xD3RICO E CICLO ATUAL:
${previousLogsData}
${logData}

                  TAREFA: Identifique as emo\xE7\xF5es recorrentes dos \xFAltimos 3 meses e ofere\xE7a uma orienta\xE7\xE3o de postura mental profunda e acolhedora. M\xE1ximo 8 linhas.`;
      }
      const systemInstruction = `Voc\xEA \xE9 o Analista Hekat de Hekat Astromemorias. O app \xE9 um di\xE1rio de sentimentos para ajudar a pessoa a se acolher, entender e acompanhar seus sentimentos com carinho e simplicidade.
        TOM: Simples, acolhedor, pr\xF3ximo e compreensivo, mas com sabedoria real. Sua voz deve ser calorosa e amiga, ajudando a entender as pr\xF3prias fases de humor com suavidade e sem julgamentos. Evite termos dif\xEDceis ou discursos rebuscados (como "sintetizar flutua\xE7\xF5es", "sobriedade", "resili\xEAncia", "b\xFAssola de vida", "\xE9tica"), mas tamb\xE9m afaste-se de conselhos infantis ou superficiais ("tire o dia para tomar um ch\xE1", "fique tranquila", "descanse").
        REFER\xCANCIA FILOS\xD3FICA & REFLEX\xC3O: Conecte as an\xE1lises e reflex\xF5es de sentimentos \xE0 filosofia do Zen Budismo (observa\xE7\xE3o sem julgamentos das mar\xE9s internas, paci\xEAncia compassiva, a imperman\xEAncia natural do humor e o centramento silencioso no estado de presen\xE7a desperta).
        CONHECIMENTO ASTROL\xD3GICO: Traga a sabedoria da sintonia celeste da lua e do zod\xEDaco. Evidencie na orienta\xE7\xE3o de postura os ritmos zodiacais sem NUNCA usar seus nomes ou classifica\xE7\xF5es formais:
          - A din\xE2mica de INICIAR ativamente, o primeiro passo, a cria\xE7\xE3o de novas inten\xE7\xF5es conscientes.
          - A din\xE2mica de SUSTENTAR e solidificar com firmeza de prop\xF3sito, resistindo em equil\xEDbrio.
          - A din\xE2mica de FLUIDEZ, maleabilidade nas mudan\xE7as di\xE1rias, capacidade de adapta\xE7\xE3o leve e desprendida.
        CONTE\xDADO DA AN\xC1LISE:
        Sua an\xE1lise deve conter:
        1. Uma REFLEX\xC3O n\xEDtida e acolhedora correlacionando os sentimentos registrados com os ritmos e ciclos da lua. Evidencie pontos de repeti\xE7\xE3o ou vulnerabilidades demonstradas com base no fluxo natural.
        2. Uma ORIENTA\xC7\xC3O direta e focada em postura mental, equil\xEDbrio emocional ou atitude de vida inteligente para lidar melhor com as mar\xE9s internas, inspirada na sabedoria Zen de presen\xE7a d\xF3cil e perseveran\xE7a, sem sugerir tarefas dom\xE9sticas ou rotinas cotidianas.
        
        REGRAS ESPEC\xCDFICAS:
        ${isLongTerm ? "- Identifique com clareza e termos simples os states de humor recorrentes.\n          - Lembre o usu\xE1rio de que o recolhimento ou a expans\xE3o s\xE3o partes do fluxo natural.\n          - Forne\xE7a orienta\xE7\xF5es amig\xE1veis e sensatas para sustentar a calma interna." : "- M\xE1ximo de 4 linhas de forma bem simples, carinhosa, precisa e direta."}
        
        REGRAS GERAIS:
        - Use um linguajar pr\xF3ximo, amig\xE1vel e s\xE1bio.
        - NUNCA introduza a an\xE1lise com cabe\xE7alhos ou t\xEDtulos (como "An\xE1lise Semanal:", "An\xE1lise de Ciclo Lunar:", "Sintonia das Fases:", "Esta\xE7\xE3o da Alma:"). Comece o texto de reflex\xE3o de forma direta, sem introdu\xE7\xF5es protocolares.
        - NUNCA declare a posi\xE7\xE3o literal do sol e da lua no c\xE9u (como "Sol em X e Lua em Y"). Fale apenas do fluxo geral e do ritmo natural das mar\xE9s internas de forma integrada e org\xE2nica.
        ${userName ? `- Chame a pessoa pelo nome "${userName}" de forma calma e natural no decorrer do texto.` : ""}
        - Nunca use termos t\xE9cnicos de astrologia (como casas, graus, aspectos, cardinal, fixo, mut\xE1vel).
        - Portugu\xEAs do Brasil.`;
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Dados: 
${logData || "Nenhum dado inserido ainda."}
${correlationData ? `Dados de Correla\xE7\xE3o: 
${correlationData}
` : ""}
Tarefa: ${prompt}`,
        config: {
          systemInstruction
        }
      });
      res.json({ text: response.text });
    } catch (error) {
      const fallbackText = generateFallbackReports(period, logData, userName);
      res.json({ text: fallbackText });
    }
  });
  app.post("/api/checkout", async (req, res) => {
    const { userId, planId } = req.body;
    if (!userId) return res.status(400).json({ error: "UserId is required" });
    const PAGBANK_TOKEN = process.env.PAGBANK_TOKEN;
    const PAGBANK_URL = process.env.PAGBANK_ENV === "production" ? "https://api.pagseguro.com" : "https://sandbox.api.pagseguro.com";
    try {
      const payload = {
        reference_id: `HEKAT_${userId}_${Date.now()}`,
        customer: {
          name: "Cliente Hekat",
          email: "cliente@email.com",
          // Should come from req.body or auth
          tax_id: "12345678909",
          phones: [{ country: "55", area: "11", number: "999999999", type: "MOBILE" }]
        },
        items: [
          {
            reference_id: planId || "BASIC_PLAN",
            name: "Assinatura Or\xE1culo Hekat",
            quantity: 1,
            unit_amount: 4990
            // R$ 49,90
          }
        ],
        notification_urls: [`${process.env.APP_URL}/api/webhook`],
        redirect_url: `${process.env.APP_URL}/?payment=success`
      };
      const response = await import_axios.default.post(`${PAGBANK_URL}/checkouts`, payload, {
        headers: {
          "Authorization": `Bearer ${PAGBANK_TOKEN}`,
          "Content-Type": "application/json"
        }
      });
      const checkoutUrl = response.data.links.find((l) => l.rel === "PAY").href;
      res.json({ checkoutUrl });
    } catch (error) {
      console.error("PagBank Error:", error.response?.data || error.message);
      res.status(500).json({ error: "Erro ao criar checkout" });
    }
  });
  app.post("/api/webhook", async (req, res) => {
    const notification = req.body;
    console.log("Webhook Received:", notification);
    if (notification.status === 3 || notification.status === 4) {
      const reference = notification.reference_id;
      const userId = reference.split("_")[1];
      const db = getAdminDb();
      if (userId && db) {
        await db.collection("users").doc(userId).set({
          isPremium: true,
          subscriptionActive: true,
          lastPayment: import_firebase_admin.default.firestore.FieldValue.serverTimestamp(),
          paymentRef: reference
        }, { merge: true });
        console.log(`Access unlocked for user: ${userId}`);
      }
    }
    res.sendStatus(200);
  });
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
      if (!targetUid && email) {
        try {
          const userRecord = await import_firebase_admin.default.auth().getUserByEmail(email);
          targetUid = userRecord.uid;
        } catch (authError) {
          console.error("User not found by email:", email);
          return res.status(404).json({ error: "User not found" });
        }
      }
      if (!targetUid) {
        return res.status(400).json({ error: "UserId or Email is required" });
      }
      const db = getAdminDb();
      if (!db) {
        return res.status(500).json({ error: "Database not available" });
      }
      await db.collection("users").doc(targetUid).set({
        isPremium: true,
        subscriptionActive: true,
        lastPayment: import_firebase_admin.default.firestore.FieldValue.serverTimestamp(),
        accessSource: "external_ciadoceu"
      }, { merge: true });
      console.log(`Access granted via external integration for user: ${targetUid}`);
      res.json({ success: true, userId: targetUid });
    } catch (error) {
      console.error("External Grant Error:", error.message);
      res.status(500).json({ error: "Internal processing error" });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("Critical: Server failed to start:", err);
  process.exit(1);
});
//# sourceMappingURL=server.cjs.map
