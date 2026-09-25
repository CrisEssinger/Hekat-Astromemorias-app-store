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
var import_sweph = require("sweph");
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
async function generateWithGemini(contents, systemInstruction) {
  const ai = getAI();
  const models = [
    "gemini-3-flash-preview",
    "gemini-3.1-flash-lite",
    "gemini-3.5-flash-lite",
    "gemini-3.5-flash"
  ];
  const callModel = async (model, timeoutMs = 6e3) => {
    const timeoutPromise = new Promise(
      (_, reject) => setTimeout(() => reject(new Error(`Timeout on model ${model}`)), timeoutMs)
    );
    const response = await Promise.race([
      ai.models.generateContent({
        model,
        contents,
        config: systemInstruction ? { systemInstruction } : void 0
      }),
      timeoutPromise
    ]);
    if (response && response.text) {
      return response.text.trim();
    }
    throw new Error(`Empty response from ${model}`);
  };
  let primaryPromise;
  try {
    primaryPromise = callModel(models[0], 6e3);
  } catch (err) {
    primaryPromise = Promise.reject(err);
  }
  const staggeredPromise = new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      callModel(models[1], 5500).then(resolve).catch(() => {
        callModel(models[2], 5e3).then(resolve).catch(reject);
      });
    }, 2200);
    primaryPromise.then(
      (val) => {
        clearTimeout(timer);
        resolve(val);
      },
      () => {
        clearTimeout(timer);
        callModel(models[1], 5500).then(resolve).catch(() => {
          callModel(models[2], 5e3).then(resolve).catch(reject);
        });
      }
    );
  });
  try {
    return await Promise.race([primaryPromise, staggeredPromise]);
  } catch {
    for (let i = 2; i < models.length; i++) {
      try {
        return await callModel(models[i], 5e3);
      } catch {
      }
    }
    throw new Error("All Gemini models temporarily unavailable");
  }
}
function generateFallbackOracle(sunSignName, moonSignName, philosophicalPhrase, userName, aspectDesc) {
  const sunRaw = (sunSignName || "Touro").trim();
  const moonRaw = (moonSignName || "Peixes").trim();
  const sun = sunRaw.toLowerCase();
  const moon = moonRaw.toLowerCase();
  const nameIntro = userName ? `${userName}, ` : "";
  const archetypes = {
    "\xE1ries": "a coragem e a iniciativa de \xC1ries",
    "aries": "a coragem e a iniciativa de \xC1ries",
    "touro": "a persist\xEAncia e o valor real de Touro",
    "g\xEAmeos": "a mente curiosa e a comunica\xE7\xE3o de G\xEAmeos",
    "gemeos": "a mente curiosa e a comunica\xE7\xE3o de G\xEAmeos",
    "c\xE2ncer": "o afeto acolhedor e as ra\xEDzes de C\xE2ncer",
    "cancer": "o afeto acolhedor e as ra\xEDzes de C\xE2ncer",
    "le\xE3o": "o brilho nobre e a generosidade de Le\xE3o",
    "leao": "o brilho nobre e a generosidade de Le\xE3o",
    "virgem": "o discernimento l\xFAcido e o cuidado de Virgem",
    "libra": "a busca de harmonia e pondera\xE7\xE3o de Libra",
    "escorpi\xE3o": "a profundidade e o poder de transforma\xE7\xE3o de Escorpi\xE3o",
    "escorpiao": "a profundidade e o poder de transforma\xE7\xE3o de Escorpi\xE3o",
    "sagit\xE1rio": "a vis\xE3o ampla e o entusiasmo de Sagit\xE1rio",
    "sagitario": "a vis\xE3o ampla e o entusiasmo de Sagit\xE1rio",
    "capric\xF3rnio": "a maturidade serena e a paci\xEAncia de Capric\xF3rnio",
    "capricornio": "a maturidade serena e a paci\xEAncia de Capric\xF3rnio",
    "aqu\xE1rio": "a liberdade de pensamento e a renova\xE7\xE3o de Aqu\xE1rio",
    "aquario": "a liberdade de pensamento e a renova\xE7\xE3o de Aqu\xE1rio",
    "peixes": "a sensibilidade emp\xE1tica e a intui\xE7\xE3o de Peixes"
  };
  const getElement = (sign) => {
    if (["\xE1ries", "le\xE3o", "sagit\xE1rio", "aries", "leao", "sagitario"].includes(sign)) return "FOGO";
    if (["touro", "virgem", "capric\xF3rnio", "capricornio"].includes(sign)) return "TERRA";
    if (["g\xEAmeos", "gemeos", "libra", "aqu\xE1rio", "aquario"].includes(sign)) return "AR";
    return "\xC1GUA";
  };
  const sunElement = getElement(sun);
  const moonElement = getElement(moon);
  const sunArch = archetypes[sun] || `a for\xE7a essencial de ${sunRaw}`;
  const moonArch = archetypes[moon] || `a presen\xE7a de ${moonRaw}`;
  let archetypesIntro = "";
  if (sun === moon) {
    archetypesIntro = `acolha com integridade ${sunArch}.`;
  } else {
    archetypesIntro = `sintonize ${sunArch} com ${moonArch}.`;
  }
  const elementMap = {
    "FOGO_FOGO": "A fa\xEDsca da sua vontade desperta com intensidade, irradiando uma chama viva que dissipa d\xFAvidas e impulsiona a sua a\xE7\xE3o com coragem.",
    "FOGO_TERRA": "A fa\xEDsca da sua vontade ganha subst\xE2ncia real quando respeita o tempo de matura\xE7\xE3o para gerar uma colheita consistente.",
    "FOGO_AR": "A chama criativa da vontade ganha fluxo no sopro das ideias, onde as palavras certas trazem s\xEDntese ao aprendizado e clareiam a percep\xE7\xE3o.",
    "FOGO_\xC1GUA": "A fa\xEDsca da sua vontade encontra as mar\xE9s do sentir, unindo o mergulho no reflexo das emo\xE7\xF5es \xE0 intui\xE7\xE3o que guia os seus passos.",
    "TERRA_FOGO": "A subst\xE2ncia do que voc\xEA constr\xF3i ganha presen\xE7a f\xE9rtil quando a fa\xEDsca da vontade desperta a coragem necess\xE1ria para uma colheita fecunda.",
    "TERRA_TERRA": "A subst\xE2ncia do real exige presen\xE7a e paci\xEAncia, honrando o ritmo natural da matura\xE7\xE3o para assegurar uma colheita fecunda e segura.",
    "TERRA_AR": "A clareza pr\xE1tica ganha s\xEDntese atrav\xE9s do sopro do aprendizado, unindo o fluxo de boas palavras \xE0 matura\xE7\xE3o de uma colheita com subst\xE2ncia.",
    "TERRA_\xC1GUA": "A matura\xE7\xE3o interna se fortalece com afeto e serenidade, permitindo que as mar\xE9s da alma e o reflexo das emo\xE7\xF5es enrique\xE7am a sua colheita.",
    "AR_FOGO": "O fluxo mental recebe um sopro renovador, enquanto a fa\xEDsca do despertar irradia a sua vontade de expandir horizontes com entusiasmo.",
    "AR_TERRA": "O fluxo das palavras ganha subst\xE2ncia ao encontrar sustento na realidade, permitindo que a percep\xE7\xE3o amadure\xE7a com tempo e paci\xEAncia.",
    "AR_AR": "O fluxo do pensamento e o sopro das ideias trazem s\xEDntese l\xFAcida, onde o aprendizado e as palavras certas ampliam a sua percep\xE7\xE3o.",
    "AR_\xC1GUA": "O fluxo das palavras se harmoniza com a intui\xE7\xE3o, onde o reflexo de \xE1guas serenas acalma a mente e pacifica os sentimentos.",
    "\xC1GUA_FOGO": "As mar\xE9s do sentir acolhem a fa\xEDsca da vontade, acendendo o reflexo de emo\xE7\xF5es que despertam a coragem de agir com nobreza.",
    "\xC1GUA_TERRA": "As mar\xE9s da sensibilidade ganham estabilidade e subst\xE2ncia quando o respeito \xE0 matura\xE7\xE3o interna constr\xF3i um alicerce seguro para o sentir.",
    "\xC1GUA_AR": "O reflexo das emo\xE7\xF5es encontra s\xEDntese no sopro do aprendizado, permitindo que as palavras comuniquem a intui\xE7\xE3o com suavidade.",
    "\xC1GUA_\xC1GUA": "As mar\xE9s \xEDntimas fluem em harmonia com a sua sensibilidade, onde o mergulho interior acalma as correntezas e acolhe os sentimentos com verdade."
  };
  const elemKey = `${sunElement}_${moonElement}`;
  const elementText = elementMap[elemKey] || elementMap["TERRA_TERRA"];
  let aspectClause = "";
  let aspectAdvice = "";
  const descLower = (aspectDesc || "").toLowerCase();
  if (descLower.includes("conjun\xE7\xE3o") || descLower.includes("conjuncao") || descLower.includes("impulso") || descLower.includes("autenticidade")) {
    aspectClause = "Este impulso de fus\xE3o pede autenticidade em s\xEDntese com a sua verdade interior.";
    aspectAdvice = "Sustente a firmeza \xE9tica dos seus atos hoje, alinhando a vontade consciente ao seu prop\xF3sito essencial.";
  } else if (descLower.includes("oposi\xE7\xE3o") || descLower.includes("oposicao") || descLower.includes("polaridades") || descLower.includes("equil\xEDbrio") || descLower.includes("equilibrio")) {
    aspectClause = "Diante de polaridades em di\xE1logo, acolha a d\xFAvida f\xE9rtil para encontrar o equil\xEDbrio entre for\xE7as complementares.";
    aspectAdvice = "Busque a pondera\xE7\xE3o serena diante de vis\xF5es contrastantes, harmonizando os opostos antes de firmar a sua postura.";
  } else if (descLower.includes("quadratura") || descLower.includes("tensa\xF5") || descLower.includes("tens\xE3o") || descLower.includes("conflito") || descLower.includes("turva")) {
    aspectClause = "Diante de qualquer tens\xE3o emocional ou conflito, exercite a paci\xEAncia e a espera \u2014 jamais permita que a emo\xE7\xE3o turve a raz\xE3o.";
    aspectAdvice = "Preserve a serenidade interior e aguarde a turbul\xEAncia passar antes de tomar atitudes definitivas hoje.";
  } else if (descLower.includes("tr\xEDgono") || descLower.includes("trigono") || descLower.includes("solu\xE7\xF5es") || descLower.includes("criatividade")) {
    aspectClause = "Caminhe com leveza sob o fluxo harm\xF4nico de solu\xE7\xF5es criativas e clareza espont\xE2nea.";
    aspectAdvice = "Confie no curso natural dos acontecimentos e deixe a sua sabedoria interior orientar as escolhas de hoje.";
  } else {
    aspectClause = "Mantenha a mente receptiva para aprender com simplicidade e aplicar o que j\xE1 foi assimilado com maturidade.";
    aspectAdvice = "Aplique com sobriedade o discernimento \xE9tico nas situa\xE7\xF5es que exigirem o seu posicionamento hoje.";
  }
  return `${nameIntro}${archetypesIntro} ${elementText} ${aspectClause} ${aspectAdvice}`;
}
function parseLogDataInfo(logData) {
  if (!logData || !logData.trim()) {
    return {
      hasLogs: false,
      count: 0,
      dominant: "recolhimento",
      secondary: "",
      notesSummary: "",
      emotionsList: []
    };
  }
  const lines = logData.split("\n").filter((l) => l.trim().length > 0);
  const emotionCounts = {};
  const notes = [];
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
  const dominant = sorted[0]?.[0] || "recolhimento e auto-observa\xE7\xE3o";
  const secondary = sorted[1]?.[0] || "";
  const notesSummary = notes.length > 0 ? ` As anota\xE7\xF5es trazem \xE0 tona reflex\xF5es como "${notes.slice(0, 2).join('" e "')}", revelando a sinceridade do seu processo \xEDntimo.` : "";
  return {
    hasLogs: lines.length > 0,
    count: lines.length,
    dominant,
    secondary,
    notesSummary,
    emotionsList: sorted.map((s) => `${s[0]} (${s[1]}x)`)
  };
}
function generateFallbackReports(period, logData, userName) {
  const isWeekly = period === "weekly";
  const isMonthly = period === "monthly";
  const isCorrelation = period === "correlation";
  const nameIntro = userName ? `${userName}, ` : "";
  const info = parseLogDataInfo(logData);
  if (isWeekly) {
    const emotionClause = info.hasLogs ? info.secondary ? `uma t\xF4nica de sentimentos voltada predominantemente a ${info.dominant.toLowerCase()}, acompanhada de manifesta\xE7\xF5es de ${info.secondary.toLowerCase()}` : `uma t\xF4nica de sentimentos voltada predominantemente a ${info.dominant.toLowerCase()}` : `uma t\xF4nica de sentimentos voltada \xE0 busca por recolhimento e discernimento profundo`;
    return `${nameIntro}identifico em sua caminhada de registros di\xE1rios ${emotionClause}. A sua linha de pensamento predominante girou em torno de integrar essas percep\xE7\xF5es e harmonizar os movimentos da mente com a sabedoria do sentir.${info.notesSummary} O padr\xE3o dominante que unifica esses dias revela momentos de auto-observa\xE7\xE3o honesta e busca por clareza. Como sua mentora s\xE1bia e amiga pr\xF3xima de caminhada, ressalto que as oscila\xE7\xF5es emocionais e a autocr\xEDtica s\xE3o pontos de sombra que demandam sua gentil aten\xE7\xE3o e zelo protetor para que n\xE3o sufoquem sua clareza. Em contrapartida, a const\xE2ncia em registrar a verdade do seu sentir e acolher seus pr\xF3prios ritmos funcionam como pontos luminosos de grande expans\xE3o e for\xE7a. Sustente seus passos com postura \xE9tica e resgate o centramento d\xF3cil para conduzir os pr\xF3ximos movimentos da alma. O conselho pr\xE1tico para este momento \xE9 cultivar uma pausa intencional antes de responder a qualquer provoca\xE7\xE3o externa, permitindo que a quietude revele o pr\xF3ximo passo com nobreza e dignidade.`;
  } else if (isMonthly) {
    const emotionClause = info.hasLogs ? info.secondary ? `uma t\xF4nica ancorada em ${info.dominant.toLowerCase()} e ${info.secondary.toLowerCase()}` : `uma t\xF4nica ancorada em ${info.dominant.toLowerCase()}` : `uma t\xF4nica voltada \xE0 consolida\xE7\xE3o, aterramento e organiza\xE7\xE3o de prioridades`;
    return `${nameIntro}ao sintetizar os pontos recorrentes das suas anota\xE7\xF5es ao longo dos \xFAltimos 28 dias do ciclo lunar, percebo ${emotionClause}, estruturando sua caminhada de matura\xE7\xE3o e centramento.${info.notesSummary} O padr\xE3o dominante revela momentos de colheita sincera alternados com per\xEDodos em que a mente pede paci\xEAncia para assimilar as transforma\xE7\xF5es necess\xE1rias. Como sua mentora, amiga querida e companheira de jornada, destaco que a pressa ou a rigidez diante dos desdobramentos da vida s\xE3o sombras que requerem sua aten\xE7\xE3o vigilante para n\xE3o represar o fluxo do seu desenvolvimento. Em contrapartida, a const\xE2ncia em observar-se com afeto e o respeito solene ao tempo de gesta\xE7\xE3o dos seus ideais s\xE3o pontos luminosos de grande expans\xE3o. Para guiar seus passos na condu\xE7\xE3o dos movimentos da alma com postura e clareza, finalize o que ficou pendente e abra espa\xE7o para o novo florescer.

Lista de Tarefas:
- Iniciado: Reconhecimento consciente dos padr\xF5es de ${info.dominant.toLowerCase()} e escuta atenta das mar\xE9s internas.
- Dar continuidade: Pr\xE1tica di\xE1ria de escrita de astromem\xF3rias e sustenta\xE7\xE3o da clareza mental.
- Finalizado: Integra\xE7\xE3o das oscila\xE7\xF5es passadas e encerramento de din\xE2micas internas de autocobran\xE7a.`;
  } else if (isCorrelation) {
    const subtitle = `Sentimento Predominante nos \xDAltimos 3 Ciclos: ${info.dominant}`;
    const emotionContext = info.hasLogs ? ` Os registros apontam que sentimentos como ${info.dominant.toLowerCase()}${info.secondary ? ` e ${info.secondary.toLowerCase()}` : ""} dialogam diretamente com as oscila\xE7\xF5es de luz do c\xE9u.` : "";
    return `${subtitle}

${nameIntro}as suas mandalas revelam uma correspond\xEAncia \xEDntima entre as fases lunares e sua energia emocional interna ao longo dos ciclos registrados.${emotionContext} Na fase de Lua Nova, o sentimento priorit\xE1rio identificado \xE9 o acolhimento reflexivo, convidando ao recolhimento e plantio de inten\xE7\xF5es. Na fase Crescente, sobressai o \xE2nimo renovador e o entusiasmo para estruturar novos passos. Na fase Cheia, destaca-se a sensibilidade expandida e a expressividade, elevando as emo\xE7\xF5es ao seu ponto mais alto. E na fase Minguante, o desapego e a s\xEDntese tornam-se priorit\xE1rios para encerrar o ciclo com sabedoria. Use essa correspond\xEAncia direta como um mapa pessoal de autoconhecimento, aprendendo a respeitar os momentos em que a alma pede para agir com coragem e quando \xE9 o tempo de simplesmente fluir e descansar.`;
  } else {
    const emotionContext = info.hasLogs ? ` Em seus registros deste trimestre, sobressa\xEDram sentimentos de ${info.dominant.toLowerCase()}${info.secondary ? ` e ${info.secondary.toLowerCase()}` : ""}, marcando momentos cruciais de tomada de consci\xEAncia.` : "";
    return `${nameIntro}identifico na an\xE1lise desta Esta\xE7\xE3o da Alma, que compreende este \xFAltimo trimestre, eventos significativos e datas espec\xEDficas onde os padr\xF5es emocionais se tornaram evidentes.${emotionContext} Em epis\xF3dios de sobrecarga ou cansa\xE7o acumulado, rea\xE7\xF5es de hesita\xE7\xE3o e ansiedade emergiram de forma mais marcante, resultando em oscila\xE7\xF5es do foco. Como sua amiga pr\xF3xima e mentora s\xE1bia nesta caminhada, lembro-lhe de que essas reatividades s\xE3o sombras naturais que nos indicam onde a autonomia precisa ser refor\xE7ada com maturidade. Os sentimentos predominantes de busca por seguran\xE7a e centramento mostram o seu desejo sincero de evolu\xE7\xE3o. O conselho para lidar com essa reatividade e conduzir seu processo de transforma\xE7\xE3o permanente \xE9 cultivar uma pausa intencional antes de responder a est\xEDmulos externos, usando a respira\xE7\xE3o profunda como alicerce para desarmar a reatividade, permitindo que a clareza mental guie suas decis\xF5es com nobreza e dignidade.`;
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
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });
  app.post("/api/oracle", async (req, res) => {
    const { sunSignName, moonSignName, philosophicalPhrase, userName, aspectName, aspectDesc } = req.body;
    try {
      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY") {
        return res.json({ text: generateFallbackOracle(sunSignName, moonSignName, philosophicalPhrase, userName, aspectDesc) });
      }
      const ai = getAI();
      const systemInstruction = `Voc\xEA \xE9 o Or\xE1culo Hekat (Hekat Astromemorias). Sua voz une com absoluta maestria sobriedade estrat\xE9gica, acolhimento l\xFAcido e sabedoria emp\xE1tica. Suas orienta\xE7\xF5es funcionam como uma b\xFAssola pragm\xE1tica para a postura, \xE9tica e clareza mental do usu\xE1rio diante dos desafios reais da alma.

Siga rigorosamente as seguintes diretrizes para o PAINEL OR\xC1CULO DI\xC1RIO:

1. PRINC\xCDPIO GERAL E T\xD4NICA DOS TEXTOS:
   - Os textos devem ser acolhedores, simples e objetivos \u2014 como uma conversa pr\xF3xima e cuidadosa.
   - Evitar tom coloquial (g\xEDrias), extremismos, exageros dram\xE1ticos e vocabul\xE1rio rebuscado.
   - A orienta\xE7\xE3o deve chegar com clareza e leveza, sem impor e sem comandos severos.
   - Sabedoria Emp\xE1tica: As orienta\xE7\xF5es soam como uma verdade simples e profunda, baseada na observa\xE7\xE3o clara do momento, sem hermetismo ou lirismo rom\xE2ntico.
   - Mist\xE9rio Sutil: A linguagem mant\xE9m uma aura de sabedoria profunda, mas evita nomes t\xE9cnicos (aspectos, elementos, nomes de casas astrol\xF3gicas).
   - Equil\xEDbrio Alqu\xEDmico: Una sobriedade estrat\xE9gica e acolhimento l\xFAcido. Seja acolhedor sem ser beato (sem moralismos ou docilidade excessiva).

2. ABERTURA:
   - ${userName ? `Abrir o texto com o nome fornecido pelo usu\xE1rio ("${userName}"), chamando-o diretamente logo na primeira frase (ex.: "${userName}, ..."), para transmitir confian\xE7a e proximidade desde a primeira frase.` : "Abrir o texto de forma acolhedora, pr\xF3xima e direta, transmitindo confian\xE7a imediata."}

3. SOL E LUA NOS SIGNOS \u2014 SIMBOLOGIA DOS ELEMENTOS:
   Considere a posi\xE7\xE3o do Sol e da Lua nos signos astrol\xF3gicos informados conforme a simbologia dos elementos (NUNCA cite os nomes dos elementos "Fogo", "Terra", "Ar" ou "\xC1gua" no texto):
   - FOGO (\xC1ries, Le\xE3o, Sagit\xE1rio) \u2014 Inspire a agir.
     * T\xF4nica: vitalidade, impulso, revela\xE7\xE3o.
     * Diretriz: frases curtas e diretas, com \xE2nimo sereno e confian\xE7a \u2014 sem exalta\xE7\xE3o.
     * Palavras-chave a incorporar naturalmente: fa\xEDsca, irradia\xE7\xE3o, vontade, despertar, chama.
   - TERRA (Touro, Virgem, Capric\xF3rnio) \u2014 Ensine a construir.
     * T\xF4nica: estrutura, presen\xE7a, manifesta\xE7\xE3o.
     * Diretriz: linguagem objetiva e concreta, que transmita seguran\xE7a, realismo e paci\xEAncia.
     * Palavras-chave a incorporar naturalmente: matura\xE7\xE3o, subst\xE2ncia, colheita.
   - AR (G\xEAmeos, Libra, Aqu\xE1rio) \u2014 Estimule a pensar e conectar.
     * T\xF4nica: conex\xE3o, perspectiva, fluidez mental.
     * Diretriz: met\xE1foras de vis\xE3o, troca, comunica\xE7\xE3o e movimento; tom curioso, leve e anal\xEDtico.
     * Palavras-chave a incorporar naturalmente: fluxo, sopro, s\xEDntese, aprendizado, percep\xE7\xE3o, palavras.
   - \xC1GUA (C\xE2ncer, Escorpi\xE3o, Peixes) \u2014 Acolha os sentimentos.
     * T\xF4nica: profundidade, mem\xF3ria, dissolu\xE7\xE3o.
     * Diretriz: linguagem po\xE9tica e suave, que acolha a emo\xE7\xE3o sem dramatizar; tom de empatia e escuta.
     * Palavras-chave a incorporar naturalmente: mar\xE9, reflexo, emo\xE7\xE3o, intui\xE7\xE3o, mergulho, fluir.

4. QUALIDADE DOS ASPECTOS (SEM CIT\xC1-LOS NO TEXTO):
   Harmonize de forma sutil a rela\xE7\xE3o entre Sol e Lua sem jamais citar termos t\xE9cnicos como quadratura, tr\xEDgono, oposi\xE7\xE3o, etc.:
   - Conjun\xE7\xE3o: impulso, autenticidade, fus\xE3o \u2014 s\xEDntese das simbologias dos signos envolvidos.
   - Oposi\xE7\xE3o: d\xFAvida, equil\xEDbrio por complementaridade.
   - Quadratura: tens\xE3o emocional, conflitos, espera, paci\xEAncia; a emo\xE7\xE3o que turva a raz\xE3o.
   - Tr\xEDgono: solu\xE7\xF5es, harmonia, fluidez, clareza, criatividade.
   - Sextil / Semissextil: abertura para aprender e aplicar com simplicidade o que j\xE1 foi assimilado com maturidade pr\xE1tica.

5. ARQU\xC9TIPOS ASTROL\xD3GICOS:
   - Certificar-se de que os conceitos est\xE3o alinhados ao arqu\xE9tipo de cada signo (G\xEAmeos = dualidade, mente, comunica\xE7\xE3o; Touro = persist\xEAncia, valor, mat\xE9ria; etc.).

6. T\xD4NICA GERAL E FLUIDEZ:
   - Frases fluidas, com come\xE7o, meio e fim que conduzam o leitor com naturalidade.
   - Trazer fluidez e simplicidade ao texto, mantendo consist\xEAncia de forma pr\xE1tica e clara em toda a leitura.

7. FECHAMENTO:
   - Finalizar com um conselho para o dia (sem citar que \xE9 um conselho), em sintonia com os aspectos formados entre Sol e Lua.
   - NUNCA usar palavras como "Conselho:", "Dica:", "Lembrete:". A orienta\xE7\xE3o deve ser a frase conclusiva, integrada com total naturalidade.
   - NUNCA sugerir rotinas dom\xE9sticas ou tarefas triviais do cotidiano (como arrumar mesa, beber \xE1gua, organizar agendas). O foco \xE9 postura, \xE9tica e clareza mental.

8. FORMATA\xC7\xC3O E CONCIS\xC3O:
   - Concis\xE3o: M\xE1ximo de 4 linhas.
   - Formata\xE7\xE3o no app: texto justificado em bloco cont\xEDnuo (sem quebras de linha ou subt\xEDtulos).
   - Idioma: Portugu\xEAs do Brasil.`;
      const prompt = `Sol em ${sunSignName || "Desconhecido"}, Lua em ${moonSignName || "Desconhecido"}. T\xF4nica: "${philosophicalPhrase || ""}". Aspecto Ativo: ${aspectName || ""} (${aspectDesc || ""}). Que diretriz de postura este momento exige?`;
      const generatedText = await generateWithGemini(prompt, systemInstruction);
      res.json({ text: generatedText });
    } catch (error) {
      console.log("[Or\xE1culo] Aplicando fallback reflexivo:", error?.message || error);
      const fallbackText = generateFallbackOracle(sunSignName, moonSignName, philosophicalPhrase, userName, aspectDesc);
      res.json({ text: fallbackText });
    }
  });
  app.post("/api/reports", async (req, res) => {
    const { period, logData, previousLogsData, correlationData, userName } = req.body;
    try {
      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY") {
        return res.json({ text: generateFallbackReports(period, logData, userName) });
      }
      const ai = getAI();
      const isLongTerm = period === "monthly" || period === "quarterly" || period === "correlation";
      let prompt = "";
      if (period === "weekly") {
        prompt = `Realize a an\xE1lise do Relat\xF3rio Semanal com base nos registros dos \xFAltimos 7 dias.
                 DADOS DE CORTE (7 DIAS):
                 ${logData || "Nenhum dado registrado nos \xFAltimos 7 dias."}
                 
                 TAREFA EXCLUSIVA:
                 1. Use os dados inseridos pela usu\xE1ria no per\xEDodo dos \xFAltimos 7 dias para definir a t\xF4nica dos sentimentos e a linha de pensamento predominante do per\xEDodo, apresentando um parecer anal\xEDtico estruturado de forma fluida.
                 2. Una os dados das informa\xE7\xF5es dispon\xEDveis para revelar um padr\xE3o dominante identificado nos registros.
                 3. Use uma linguagem acolhedora e fraterna, aproximando-se com a postura de uma s\xE1bia, amiga querida e mentora (Hekat \xE9 do g\xEAnero feminino), mantendo a sobriedade indispens\xE1vel e evitando g\xEDrias, tons excessivamente informais ou superlativos sint\xE9ticos.
                 4. ATEN\xC7\xC3O ABSOLUTA: \xC9 estritamente proibido usar a palavra ou varia\xE7\xE3o de "ao olhar seus \xFAltimos sete dias" ou "ao avaliar seus sentimentos". Comece o texto chamando a usu\xE1ria pelo nome "${userName}" no in\xEDcio exato para trazer proximidade confi\xE1vel (ex: "Nome, ...").
                 5. Destaque de forma n\xEDtida tanto os pontos negativos que requerem aten\xE7\xE3o da usu\xE1ria (vulnerabilidades, sombras ou oscila\xE7\xF5es) quanto os pontos positivos que geram expans\xE3o de consci\xEAncia.
                 6. Finalize o relat\xF3rio com um conselho pr\xE1tico e \xFAtil centrado em postura, \xE9tica e clareza mental para conduzir os movimentos da alma.
                 7. N\xC3O se restrinja a 4 linhas. Desenvolva um texto reflexivo, consistente e profundo.
                 8. Formato: O texto deve ser composto por um par\xE1grafo \xFAnico integralmente JUSTIFICADO (sem recuos de p\xE1gina, sem bullets, sem t\xEDtulos, sem subse\xE7\xF5es, sem aspas externas desnecess\xE1rias).`;
      } else if (period === "monthly") {
        prompt = `Realize a an\xE1lise do Relat\xF3rio Mensal com base nos registros dos \xFAltimos 29 dias do ciclo lunar.
                 DADOS DE CORTE (29 DIAS):
                 ${logData || "Nenhum dado registrado neste ciclo lunar de 29 dias."}
                 HIST\xD3RICO RECENTE:
                 ${previousLogsData || "Primeiro ciclo registrado."}
                 
                 TAREFA EXCLUSIVA:
                 1. Use os dados inseridos pela usu\xE1ria no per\xEDodo dos \xFAltimos 29 dias para definir de forma n\xEDtida a t\xF4nica dos sentimentos e a linha de pensamento predominante do per\xEDodo, apresentando um parecer anal\xEDtico estruturado de forma fluida.
                 2. Una os dados dispon\xEDveis para revelar os padr\xF5es de sentimentos dominantes identificados nos registros, comparando-os e conectando-os se houver hist\xF3rico.
                 3. Use uma linguagem acolhedora e fraterna, aproximando-se com a postura de uma s\xE1bia, amiga querida e mentora (Hekat \xE9 do g\xEAnero feminino), mantendo a sobriedade indispens\xE1vel e evitando g\xEDrias, tons informais ou superlativos sint\xE9ticos.
                 4. ATEN\xC7\xC3O ABSOLUTA: \xC9 estritamente proibido usar a palavra ou varia\xE7\xE3o de "ao olhar seus \xFAltimos vinte e nove dias", "ao olhar seu ciclo" ou "ao avaliar seus sentimentos/registros". Comece o texto chamando a usu\xE1ria pelo nome "${userName}" no in\xEDcio exato para trazer proximidade confi\xE1vel (ex: "Nome, ...").
                 5. Destaque tanto os pontos negativos que requerem aten\xE7\xE3o da usu\xE1ria (vulnerabilidades, sombras ou resist\xEAncias que a paralisam) quanto os pontos positivos que geram expans\xE3o de consci\xEAncia.
                 6. Apresente uma s\xEDntese clara dos pontos recorrentes ao longo do per\xEDodo de 29 dias, ressaltando o que precisa ser finalizado.
                 7. Gere obrigatoriamente uma lista de tarefas estruturada e clara ao final, classificada exatamente nestas tr\xEAs classes de forma limpa:
                    - Iniciado: [tarefas iniciadas no per\xEDodo]
                    - Dar continuidade: [atividades ou processos para dar continuidade]
                    - Finalizado: [processos ou tarefas finalizadas ou a finalizar neste ciclo]
                 8. N\xC3O se restrinja a 4 ou 6 linhas. Desenvolva um texto reflexivo, consistente e profundo, seguido de forma espa\xE7ada pela lista de tarefas.
                 9. Formato: O texto de an\xE1lise deve ser justificado, seguido pela se\xE7\xE3o da lista de tarefas estruturada de forma limpa e vis\xEDvel.`;
      } else if (period === "correlation") {
        const parsedInfo = parseLogDataInfo(logData);
        const dominantSentiment = parsedInfo.dominant;
        prompt = `Realize uma an\xE1lise de correla\xE7\xE3o entre as fases da lua e os padr\xF5es de sentimentos/dados inseridos pela usu\xE1ria.
                 DADOS DE CORRELA\xC7\xC3O DOS \xDALTIMOS 3 CICLOS (de 29 dias cada):
${correlationData || "Nenhum dado acumulado dispon\xEDvel ainda."}

                 HIST\xD3RICO INTEGRADO:
${previousLogsData || ""}
${logData || ""}
                 
                 TAREFA EXCLUSIVA:
                 1. A frase inicial do relat\xF3rio deve ser obrigatoriamente um subt\xEDtulo din\xE2mico que apresente o sentimento predominante detectado nos 3 \xFAltimos ciclos lunares, exatamente no formato:
                 "Sentimento Predominante nos \xDAltimos 3 Ciclos: ${dominantSentiment}"
                 2. Fa\xE7a uma correla\xE7\xE3o n\xEDtida e direta das fases da Lua (Nova, Crescente, Cheia, Minguante) com a repeti\xE7\xE3o de padr\xF5es de sentimentos e dados inseridos pela usu\xE1ria.
                 3. Destaque obrigatoriamente um sentimento priorit\xE1rio identificado em cada uma das quatro fases lunares considerando os 3 \xFAltimos ciclos lunares de 29 dias.
                 4. Use uma linguagem acolhedora, fraterna, d\xF3cil e s\xE1bia de uma mentora s\xE1bia (Hekat \xE9 do g\xEAnero feminino). Evite superlativos sint\xE9ticos.
                 5. Logo ap\xF3s o subt\xEDtulo din\xE2mico na primeira linha isolada, inicie o texto chamando a usu\xE1ria pelo nome "${userName}" para trazer proximidade de forma natural (ex: "${userName}, ...").
                 6. Formato: O relat\xF3rio deve iniciar com o subt\xEDtulo din\xE2mico na primeira linha, seguido pelo texto fluido, reflexivo e consistente.`;
      } else {
        prompt = `Realize uma an\xE1lise profunda desta 'Esta\xE7\xE3o da Alma' (Relat\xF3rio Trimestral).
                 HIST\xD3RICO E CICLO ATUAL:
${previousLogsData}
${logData}

                 
                 TAREFA EXCLUSIVA:
                 1. Analise o hist\xF3rico dos \xFAltimos 90 dias (trimestre).
                 2. Identifique e pontue datas e eventos espec\xEDficos mencionados nos registros que estejam relacionados com padr\xF5es emocionais reativos.
                 3. Ressalte com clareza quais foram os sentimentos predominantes detectados ao longo do trimestre.
                 4. Destaque tanto os pontos negativos que necessitam de sua aten\xE7\xE3o cuidadosa quanto os pontos positivos que propiciam a expans\xE3o de consci\xEAncia.
                 5. Traga um conselho profundo e \xFAtil centrado em postura, \xE9tica e clareza mental para lidar com os sentimentos reativos e guiar seu processo de transforma\xE7\xE3o permanente.
                 6. Use uma linguagem acolhedora, fraterna e s\xE1bia de sua mentora Hekat (g\xEAnero feminino). Evite superlativos sint\xE9ticos.
                 7. ATEN\xC7\xC3O ABSOLUTA: Comece o texto chamando a usu\xE1ria pelo nome "${userName}" no in\xEDcio exato. N\xE3o use varia\xE7\xF5es de "ao olhar seu trimestre" ou "ao avaliar seus sentimentos".
                 8. Formato: Um texto corrido, reflexivo e consistente.`;
      }
      const systemInstruction = `Voc\xEA \xE9 o Or\xE1culo Hekat (Hekat Astromemorias). Sua voz \xFAnica une sobriedade estrat\xE9gica e acolhimento l\xFAcido de uma mentora fraterna e pragm\xE1tica, incorporando uma for\xE7a lunar feminina em suas falas.
        
        TOM DE VOZ E ESTILO:
        - Equil\xEDbrio Alqu\xEDmico Final: Una sobriedade estrat\xE9gica e acolhimento l\xFAcido. Seja direta sem ser dogm\xE1tica (evite comandos severos) e acolhedora sem ser "beata" ou melodram\xE1tica (evite moralismos, excesso de compaix\xE3o sentimental ou docilidade excessiva). Use g\xEAnero feminino para referir-se a si mesma (como "sua mentora", "sua amiga", "s\xE1bia").
        - Praticidade de Vida: O conte\xFAdo deve ser \xFAtil e focado em postura, \xE9tica e clareza mental. Ofere\xE7a diretrizes para os grandes movimentos da alma e desafios reais, e NUNCA sugira rotinas dom\xE9sticas, tarefas cotidianas triviais, ou conselhos superficiais.
        - Sabedoria Emp\xE1tica: Suas orienta\xE7\xF5es soam como uma verdade simples e profunda, baseada na observa\xE7\xE3o clara do momento, sem hermetismo ou lirismo rom\xE2ntico.
        - Mist\xE9rio Sutil: A linguagem mant\xE9m uma aura de sabedoria profunda, mas evita nomes t\xE9cnicos (graus, casas, aspectos, cardinal, fixo, etc.).
        - Idioma: Portugu\xEAs do Brasil.
        
        DIRETRIZES DE CONTE\xDADO EXTRAORDIN\xC1RIAS:
        - Para o RELAT\xD3RIO SEMANAL e RELAT\xD3RIO MENSAL (29 dias), RELAT\xD3RIO TRIMESTRAL e CORRELA\xC7\xC3O LUNAR: Use os dados do respectivo per\xEDodo para definir o parecer anal\xEDtico.
        - N\xE3o use frases como "ao olhar seus \xFAltimos sete dias", "ao olhar seus \xFAltimos vinte e nove dias" ou "ao avaliar seus sentimentos/registros".
        - Chame sempre a pessoa pelo nome "${userName}" abrindo o texto para trazer confian\xE7a e proximidade de forma d\xF3cil, calma e direta (ex: "Nome, ...").
        - Para os relat\xF3rios em geral, nunca use cabe\xE7alhos ou t\xEDtulos gen\xE9ricos, exceto na CORRELA\xC7\xC3O LUNAR onde a frase inicial deve ser exatamente o subt\xEDtulo din\xE2mico indicando o sentimento predominante nos 3 \xFAltimos ciclos lunares conforme a tarefa.`;
      const contents = `Dados: 
${logData || "Nenhum dado inserido ainda."}
${correlationData ? `Dados de Correla\xE7\xE3o: 
${correlationData}
` : ""}
Tarefa: ${prompt}`;
      let generatedText = await generateWithGemini(contents, systemInstruction);
      if (period === "correlation" && generatedText && !generatedText.toLowerCase().includes("sentimento predominante")) {
        const parsedInfo = parseLogDataInfo(logData);
        generatedText = `Sentimento Predominante nos \xDAltimos 3 Ciclos: ${parsedInfo.dominant}

${generatedText}`;
      }
      res.json({ text: generatedText });
    } catch (error) {
      console.log("[Relat\xF3rios] Aplicando fallback reflexivo:", error?.message || error);
      const fallbackText = generateFallbackReports(period, logData, userName);
      res.json({ text: fallbackText });
    }
  });
  app.post("/api/astronomy/calculate", (req, res) => {
    let { date } = req.body;
    try {
      const d = date ? new Date(date) : /* @__PURE__ */ new Date();
      if (isNaN(d.getTime())) {
        return res.status(400).json({ error: "Invalid date" });
      }
      const year = d.getUTCFullYear();
      const month = d.getUTCMonth() + 1;
      const day = d.getUTCDate();
      const hour = d.getUTCHours() + d.getUTCMinutes() / 60 + d.getUTCSeconds() / 3600;
      const jd = (0, import_sweph.julday)(year, month, day, hour, import_sweph.constants.SE_GREG_CAL);
      const sunCalc = (0, import_sweph.calc_ut)(jd, import_sweph.constants.SE_SUN, import_sweph.constants.SEFLG_SWIEPH);
      const sunLon = sunCalc.data[0];
      const moonCalc = (0, import_sweph.calc_ut)(jd, import_sweph.constants.SE_MOON, import_sweph.constants.SEFLG_SWIEPH);
      const moonLon = moonCalc.data[0];
      const phaseAngle = (moonLon - sunLon + 360) % 360;
      const illumination = (1 - Math.cos(phaseAngle * Math.PI / 180)) / 2 * 100;
      const ZODIAC_SIGNS_NAMES = [
        "\xC1ries",
        "Touro",
        "G\xEAmeos",
        "C\xE2ncer",
        "Le\xE3o",
        "Virgem",
        "Libra",
        "Escorpi\xE3o",
        "Sagit\xE1rio",
        "Capric\xF3rnio",
        "Aqu\xE1rio",
        "Peixes"
      ];
      const sunSignIndex = Math.floor(sunLon / 30) % 12;
      const moonSignIndex = Math.floor(moonLon / 30) % 12;
      res.json({
        success: true,
        julianDay: jd,
        serverTime: (/* @__PURE__ */ new Date()).toISOString(),
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
    } catch (e) {
      console.error("Error in astronomy calculation:", e);
      res.status(500).json({ error: e.message || "Calculation failed" });
    }
  });
  app.post("/api/astronomy/cycle", (req, res) => {
    let { startDate } = req.body;
    try {
      const dStart = startDate ? new Date(startDate) : new Date(Date.UTC(2026, 4, 16, 0, 0, 0));
      if (isNaN(dStart.getTime())) {
        return res.status(400).json({ error: "Invalid start date" });
      }
      const LUNAR_MONTH = 29.53059;
      const ZODIAC_SIGNS_NAMES = [
        "\xC1ries",
        "Touro",
        "G\xEAmeos",
        "C\xE2ncer",
        "Le\xE3o",
        "Virgem",
        "Libra",
        "Escorpi\xE3o",
        "Sagit\xE1rio",
        "Capric\xF3rnio",
        "Aqu\xE1rio",
        "Peixes"
      ];
      const daysData = [];
      for (let dayIndex = 1; dayIndex <= 29; dayIndex++) {
        const ageForDay = (dayIndex - 1) / 29 * LUNAR_MONTH;
        const targetDate = new Date(dStart.getTime() + ageForDay * 24 * 60 * 60 * 1e3);
        const year = targetDate.getUTCFullYear();
        const month = targetDate.getUTCMonth() + 1;
        const day = targetDate.getUTCDate();
        const hour = targetDate.getUTCHours() + targetDate.getUTCMinutes() / 60 + targetDate.getUTCSeconds() / 3600;
        const jd = (0, import_sweph.julday)(year, month, day, hour, import_sweph.constants.SE_GREG_CAL);
        const sunCalc = (0, import_sweph.calc_ut)(jd, import_sweph.constants.SE_SUN, import_sweph.constants.SEFLG_SWIEPH);
        const sunLon = sunCalc.data[0];
        const moonCalc = (0, import_sweph.calc_ut)(jd, import_sweph.constants.SE_MOON, import_sweph.constants.SEFLG_SWIEPH);
        const moonLon = moonCalc.data[0];
        const phaseAngle = (moonLon - sunLon + 360) % 360;
        const illumination = (1 - Math.cos(phaseAngle * Math.PI / 180)) / 2 * 100;
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
    } catch (e) {
      console.error("Error in cycle calculation:", e);
      res.status(500).json({ error: e.message || "Cycle calculation failed" });
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
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== "true"
      },
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
startServer().catch((err) => {
  console.error("Critical: Server failed to start:", err);
  process.exit(1);
});
//# sourceMappingURL=server.cjs.map
