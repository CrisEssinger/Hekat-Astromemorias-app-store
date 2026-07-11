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
function generateFallbackOracle(sunSignName, moonSignName, philosophicalPhrase, userName, aspectDesc) {
  const sun = sunSignName || "Touro";
  const moon = moonSignName || "Peixes";
  const nameIntro = userName ? `${userName}, ` : "";
  const getElement = (sign) => {
    const s = sign.toLowerCase();
    if (["\xE1ries", "le\xE3o", "sagit\xE1rio", "aries", "leao", "sagitario"].includes(s)) return "FOGO";
    if (["touro", "virgem", "capric\xF3rnio", "capricornio"].includes(s)) return "TERRA";
    if (["g\xEAmeos", "gemeos", "libra", "aqu\xE1rio", "aquario"].includes(s)) return "AR";
    return "\xC1GUA";
  };
  const sunElement = getElement(sun);
  const moonElement = getElement(moon);
  const elementTexts = {
    "FOGO_FOGO": {
      main: `h\xE1 uma fa\xEDsca viva no agora \u2014 a sua vontade de realizar desperta com for\xE7a total: permita que a irradia\xE7\xE3o da sua for\xE7a se revele com entusiasmo.`,
      advice: `D\xEA o primeiro passo hoje mesmo em dire\xE7\xE3o ao seu objetivo real.`
    },
    "FOGO_TERRA": {
      main: `sintonize a sua vontade de agir com um alicerce est\xE1vel \u2014 o tempo exige paci\xEAncia e presen\xE7a para que a colheita seja cheia de subst\xE2ncia real.`,
      advice: `Estruture os seus planos com metas simples e tarefas concretas.`
    },
    "FOGO_AR": {
      main: `use a sua chama criativa para dar fluxo \xE0s ideias \u2014 o sopro do aprendizado e as palavras certas trazem clareza de percep\xE7\xE3o aos seus caminhos.`,
      advice: `Converse com algu\xE9m de confian\xE7a para expandir as suas perspectivas.`
    },
    "FOGO_\xC1GUA": {
      main: `sintonize o calor da sua vontade com as mar\xE9s profundas do sentir \u2014 mergulhe em sua intui\xE7\xE3o silenciosa para guiar as a\xE7\xF5es com empatia.`,
      advice: `Silencie os ru\xEDdos externos para ouvir as respostas do cora\xE7\xE3o.`
    },
    "TERRA_FOGO": {
      main: `d\xEA corpo tang\xEDvel ao seu alicerce di\xE1rio \u2014 a fa\xEDsca do entusiasmo desperta o momento certo de agir com coragem, presen\xE7a e realismo.`,
      advice: `Use a sua energia concentrada para iniciar aquela tarefa adiada.`
    },
    "TERRA_TERRA": {
      main: `honre a subst\xE2ncia do real e a matura\xE7\xE3o de cada processo \u2014 o seu solo firme exige tempo e paci\xEAncia para gerar uma colheita valiosa.`,
      advice: `Evite a pressa desnecess\xE1ria e concentre-se em concluir o que come\xE7ou.`
    },
    "TERRA_AR": {
      main: `traga clareza pr\xE1tica e s\xEDntese aos pensamentos \u2014 o fluxo d\xF3cil do aprendizado ajuda a estruturar o seu alicerce com ideias realizadoras.`,
      advice: `Escreva as suas prioridades do dia e organize a sua agenda.`
    },
    "TERRA_\xC1GUA": {
      main: `nutra o seu alicerce com afeto e sensibilidade \u2014 o reflexo das suas \xE1guas revela que o amadurecimento tang\xEDvel exige paci\xEAncia d\xF3cil.`,
      advice: `Acolha os seus sentimentos e respeite o ritmo do seu corpo.`
    },
    "AR_FOGO": {
      main: `o fluxo mental traz um sopro de \xE2nimo renovador \u2014 o despertar da sua vontade impulsiona novos caminhos com leveza, vis\xE3o e entusiasmo.`,
      advice: `Tome uma decis\xE3o simples que traga mais movimento \xE0 sua vida.`
    },
    "AR_TERRA": {
      main: `sintonize o fluxo das palavras com a estabilidade de vida \u2014 a clareza de percep\xE7\xE3o encontra sustento seguro no seu alicerce de rotina.`,
      advice: `Simplifique as suas obriga\xE7\xF5es di\xE1rias e descarte o que \xE9 sup\xE9rfluo.`
    },
    "AR_AR": {
      main: `purifique as ideias e d\xEA fluxo aos seus pensamentos \u2014 o sopro da curiosidade traz clareza de percep\xE7\xE3o e leveza para as suas palavras.`,
      advice: `Estude um assunto novo ou organize as suas leituras pendentes.`
    },
    "AR_\xC1GUA": {
      main: `una o fluxo das palavras \xE0 intui\xE7\xE3o profunda do sentir \u2014 a percep\xE7\xE3o do invis\xEDvel clareia as mem\xF3rias e acalma os seus sentimentos.`,
      advice: `Escreva ou converse abertamente sobre o que est\xE1 sentindo.`
    },
    "\xC1GUA_FOGO": {
      main: `acolha as mar\xE9s do seu cora\xE7\xE3o com empatia \u2014 o reflexo das suas emo\xE7\xF5es desperta a fa\xEDsca da vontade para agir com afeto e coragem.`,
      advice: `Siga a sua intui\xE7\xE3o e fa\xE7a algo que alegre a sua alma.`
    },
    "\xC1GUA_TERRA": {
      main: `traga seguran\xE7a e estabilidade \xE0s suas mar\xE9s emocionais \u2014 o respeito \xE0 matura\xE7\xE3o interna constr\xF3i um alicerce firme na caminhada.`,
      advice: `Respire fundo, sinta o seu corpo e acalme a mente com simplicidade.`
    },
    "\xC1GUA_AR": {
      main: `comunique as suas intui\xE7\xF5es de forma simples e d\xF3cil \u2014 o sopro do aprendizado traz s\xEDntese para compreender o reflexo das suas emo\xE7\xF5es.`,
      advice: `Reserve dez minutos para registrar as suas reflex\xF5es em um di\xE1rio.`
    },
    "\xC1GUA_\xC1GUA": {
      main: `flua com leveza em suas mar\xE9s de sensibilidade \u2014 o mergulho interno acalma as correntezas \xEDntimas e revela o mist\xE9rio do seu pr\xF3prio sentir.`,
      advice: `Fique alguns minutos em sil\xEAncio para cultivar a sua paz interior.`
    }
  };
  const key = `${sunElement}_${moonElement}`;
  const selectedText = elementTexts[key] || elementTexts["TERRA_TERRA"];
  let aspectText = "";
  if (aspectDesc) {
    const descLower = aspectDesc.toLowerCase();
    if (descLower.includes("conjun\xE7\xE3o") || descLower.includes("conjuncao") || descLower.includes("impulso") || descLower.includes("autenticidade")) {
      aspectText = ` \u2014 nobreza e fus\xE3o: viva com aut\xEAntico impulso este momento em que a clareza se sintetiza com verdade.`;
    } else if (descLower.includes("oposi\xE7\xE3o") || descLower.includes("oposicao") || descLower.includes("polaridades") || descLower.includes("equil\xEDbrio") || descLower.includes("equilibrio")) {
      aspectText = ` \u2014 polaridades opostas: busque a d\xFAvida reflexiva para equilibrar e integrar for\xE7as complementares na jornada.`;
    } else if (descLower.includes("quadratura") || descLower.includes("tensa\xF5") || descLower.includes("tens\xE3o") || descLower.includes("conflito") || descLower.includes("turva")) {
      aspectText = ` \u2014 paci\xEAncia diante da tens\xE3o: abrigue os conflitos emocionais com calma, lembrando que a emo\xE7\xE3o acumulada nunca deve turvar a raz\xE3o.`;
    } else if (descLower.includes("tr\xEDgono") || descLower.includes("trigono") || descLower.includes("solu\xE7\xF5es") || descLower.includes("criatividade")) {
      aspectText = ` \u2014 harmonia e fluxo criativo: caminhe sob a luz das solu\xE7\xF5es fluidas e da clareza abundante.`;
    } else {
      aspectText = ` \u2014 sabedoria pr\xE1tica: esteja aberto para aprender e aplicar com simplicidade o que j\xE1 foi assimilado.`;
    }
  }
  const finalMain = `${nameIntro}${selectedText.main}${aspectText} Conselho pr\xE1tico: ${selectedText.advice}`;
  return finalMain;
}
function generateFallbackReports(period, logData, userName) {
  const isWeekly = period === "weekly";
  const isMonthly = period === "monthly";
  const isCorrelation = period === "correlation";
  const nameIntro = userName ? `${userName}, ` : "Viajante, ";
  if (isWeekly) {
    return `${nameIntro}ao compreender a jornada emocional descrita em seus registros recentes de anota\xE7\xF5es, identifico uma t\xF4nica de sentimentos voltada \xE0 busca por recolhimento e discernimento profundo. A sua linha de pensamento predominante girou em torno da necessidade de reorganizar din\xE2micas internas e de restabelecer o equil\xEDbrio mental diante de demandas externas. O padr\xE3o dominante sintoniza-se em uma oscila\xE7\xE3o d\xF3cil, alternando momentos de sil\xEAncio restaurador com picos de des\xE2nimo reflexivo ou agita\xE7\xE3o mental espont\xE2nea. Como sua mentora s\xE1bia e amiga de caminhada, ressalto que a impaci\xEAncia e a autocr\xEDtica \xE1cida s\xE3o pontos de sombra que demandam seu zelo vigilante para que n\xE3o turvem sua clareza de vis\xE3o. Em contrapartida, a sua capacidade de auto-observa\xE7\xE3o sincera e a firmeza em acolher seus ritmos particulares funcionam como caminhos f\xE9rteis de profunda expans\xE3o e despertar de consci\xEAncia. Sustente seus passos com paci\xEAncia ativa e resgate o centramento d\xF3cil para conduzir os pr\xF3ximos movimentos estrat\xE9gicos da alma.`;
  } else if (isMonthly) {
    return `${nameIntro}ao compreender os ciclos e as mar\xE9s emocionais que atravessaram seus \xFAltimos 29 dias do ciclo, percebo uma t\xF4nica de sentimentos voltada \xE0 necessidade de consolida\xE7\xE3o, aterramento e busca por estabilidade. A sua linha de pensamento predominante concentrou-se na busca por clareza \xE9tica e organiza\xE7\xE3o de prioridades, tentando definir o que realmente possui valor perene. O padr\xE3o dominante revela momentos de conten\xE7\xE3o estrat\xE9gica alternados com uma sutil resist\xEAncia a mudan\xE7as necess\xE1rias, o que pode gerar cansa\xE7o acumulado. Como sua mentora e companheira de jornada, destaco que a rigidez ou a hesita\xE7\xE3o diante do novo s\xE3o pontos de sombra que requerem sua aten\xE7\xE3o vigilante para n\xE3o represar o fluxo do seu desenvolvimento. Em contrapartida, a paci\xEAncia d\xF3cil e o respeito sagrado ao tempo de gesta\xE7\xE3o dos seus ideais s\xE3o pontos luminosos de grande expans\xE3o. A orienta\xE7\xE3o para guiar seus passos \xE9 cultivar o centramento firme com maleabilidade s\xE1bia, agindo sob a luz da clareza mental e da verdade interior.`;
  } else if (isCorrelation) {
    return `${nameIntro}as suas mandalas revelam uma correspond\xEAncia \xEDntima entre os ciclos c\xF3smicos e sua energia emocional interna. Focando em tr\xEAs ciclos de anota\xE7\xF5es recentes, identificamos uma correla\xE7\xE3o clara: na fase de Lua Nova, o sentimento priorit\xE1rio \xE9 o acolhimento reflexivo, um convite sutil ao recolhimento; na fase Crescente, sobressai o est\xEDmulo com \xE2nimo renovador, impulsionando a\xE7\xF5es concretas; na fase Cheia, destaca-se a celebra\xE7\xE3o e a expressividade, onde as mar\xE9s emocionais se expandem ao \xE1pice; e na fase Minguante, o sentimento de desapego e conclus\xE3o sobressai como convite ao sil\xEAncio. Use essa correspond\xEAncia como um mapa pessoal de autoconhecimento, aprendendo a respeitar os momentos em que a alma pede para agir com coragem e quando \xE9 o tempo de simplesmente fluir e descansar.`;
  } else {
    return `${nameIntro}ao realizar uma an\xE1lise profunda nesta Esta\xE7\xE3o da Alma, que compreende este \xFAltimo trimestre, identifico que o sentimento predominante do per\xEDodo foi o esfor\xE7o constante pela auto-observa\xE7\xE3o, entremeado por reflex\xF5es sobre integridade. Olhando os registros e as marca\xE7\xF5es temporais, identificamos padr\xF5es reativos que merecem aten\xE7\xE3o: em epis\xF3dios espec\xEDficos de sobrecarga externa ou cansa\xE7o acumulado, sentimentos de ansiedade e frustra\xE7\xE3o emergiram de forma mais marcante, resultando em oscila\xE7\xF5es bruscas e dispers\xE3o do foco. Como sua amiga e mentora nessa jornada, lembro-lhe de que essas reatividades s\xE3o sombras naturais que nos indicam onde a autonomia precisa ser refor\xE7ada com maturidade e temperan\xE7a. O conselho pr\xE1tico para voc\xEA lidar com esse padr\xE3o e conduzir seu processo de transforma\xE7\xE3o permanente \xE9 cultivar uma pausa intencional antes de responder a est\xEDmulos externos: use a respira\xE7\xE3o profunda como alicerce para desarmar a reatividade irracional, permitindo que a intelig\xEAncia do cora\xE7\xE3o guie suas decis\xF5es com nobreza e dignidade.`;
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
      const systemInstruction = `Voc\xEA \xE9 o Or\xE1culo Hekat (Hekat Astromemorias). Sua voz une de modo absoluto sobriedade estrat\xE9gica, acolhimento l\xFAcido e sabedoria emp\xE1tica. Suas orienta\xE7\xF5es funcionam como uma b\xFAssola pragm\xE1tica para a postura, \xE9tica e clareza mental do usu\xE1rio diante de desafios reais da alma.

Siga rigorosamente as diretrizes e regras a seguir:

1. TOM DE VOZ E ESTILO (EQUIL\xCDBRIO ALQU\xCDMICO):
   - Evite comandos severos ou dogm\xE1ticos; evite moralismos ou condescend\xEAncia beata.
   - O tom deve ser direto, informal, acolhedor e pr\xF3ximo, transmitindo uma pausa para introspec\xE7\xE3o profunda de forma d\xF3cil, acess\xEDvel e clara.
   - Use pontua\xE7\xE3o estrat\xE9gica \u2014 travess\xF5es (\u2014) e dois-pontos (:) \u2014 para criar pausas e enfatizar frases de efeito, cita\xE7\xF5es ou percep\xE7\xF5es sublimes.
   - Use uma linguagem simples, fluida e clara para um leigo, de f\xE1cil compreens\xE3o e extremamente direta. Evite termos rebuscados, conceitos de dif\xEDcil acesso ou linguagem complexa. Mantenha a profundidade e a sabedoria emp\xE1tica sem hermetismo.

2. PRATICIDADE DE VIDA:
   - Ofere\xE7a conselhos funcionais e direcionados a postura de vida, \xE9tica e clareza mental para os grandes movimentos da alma e desafios reais.
   - NUNCA sugira rotinas dom\xE9sticas, tarefas cotidianas ou triviais do dia a dia.
   - Finalize o texto com um conselho pr\xE1tico e \xFAtil (ex: "Conselho pr\xE1tico: ...").

3. DIN\xC2MICA DOS ELEMENTOS (S\xEDmbolos Astrol\xF3gicos do Sol e da Lua):
   - Identifique os elementos correspondentes aos signos do Sol e da Lua informados e module a t\xF4nica da mensagem combinando suas ess\xEAncias de acordo com as diretrizes espec\xEDficas abaixo (NUNCA mencione os nomes dos elementos "Fogo", "Terra", "Ar" ou "\xC1gua" em si, apenas use sua simbologia e diretrizes descritas):
     * FOGO (\xC1ries, Le\xE3o, Sagit\xE1rio): Inspire a agir. 
       - T\xF4nica: Vitalidade, Impulso e Revela\xE7\xE3o.
       - Simbologia: A centelha da cria\xE7\xE3o, o calor que expande e a luz que dissipa a d\xFAvida.
       - Diretrizes: Use verbos de a\xE7\xE3o e frases curtas e impactantes. Promova coragem e entusiasmo.
       - Palavras-chave obrigat\xF3rias a incorporar sutilmente: fa\xEDsca, irradia\xE7\xE3o, vontade, despertar, chama.
     * TERRA (Touro, Virgem, Capric\xF3rnio): Ensine a construir.
       - T\xF4nica: Estrutura, Presen\xE7a e Manifesta\xE7\xE3o.
       - Simbologia: O solo que sustenta, a raiz que aprofunda e o tempo que matura a forma.
       - Diretrizes: Linguagem sensorial e objetiva. Transmita seguran\xE7a, realismo e paci\xEAncia.
       - Palavras-chave obrigat\xF3rias a incorporar sutilmente: alicerce, tang\xEDvel, matura\xE7\xE3o, subst\xE2ncia, colheita.
     * AR (G\xEAmeos, Libra, Aqu\xE1rio): Estimule a pensar e a conectar.
       - T\xF4nica: Conex\xE3o, Perspectiva e Fluidez Mental.
       - Simbologia: O sopro que transporta a informa\xE7\xE3o, o espa\xE7o entre as coisas e a clareza mental.
       - Diretrizes: Use met\xE1foras sobre vis\xE3o, troca, comunica\xE7\xE3o e movimento. O tom deve ser curioso, leve e anal\xEDtico.
       - Palavras-chave obrigat\xF3rias a incorporar sutilmente: fluxo, sopro, s\xEDntese, aprendizado, percep\xE7\xE3o, palavras.
     * \xC1GUA (C\xE2ncer, Escorpi\xE3o, Peixes): Convide a sentir.
       - T\xF4nica: Profundidade, Mem\xF3ria e Dissolu\xE7\xE3o.
       - Simbologia: O oceano do inconsciente, sentimentos, a correnteza que molda a pedra e o espelho que reflete a alma.
       - Diretrizes: Linguagem po\xE9tica, subjetiva e envolvente. O tom deve evocar empatia, intui\xE7\xE3o e mist\xE9rio.
       - Palavras-chave obrigat\xF3rias a incorporar sutilmente: mar\xE9, reflexo, emo\xE7\xE3o, sentimentos, intui\xE7\xE3o, mergulho, fluir.

4. QUALIDADE SUTIL DOS ASPECTOS:
   - Integre de maneira org\xE2nica e impercept\xEDvel (sem nunca citar os nomes t\xE9cnicos dos aspectos como "Conjun\xE7\xE3o", "Oposi\xE7\xE3o", "Quadratura", "Tr\xEDgono" ou "Sextil") o significado espiritual do aspecto astrol\xF3gico ativo no dia:
     * Se Conjun\xE7\xE3o: Traga no texto a energia de impulso, autenticidade e fus\xE3o em s\xEDntese das qualidades dos signos.
     * Se Oposi\xE7\xE3o: Traga no texto a din\xE2mica de d\xFAvida reflexiva, equil\xEDbrio das polaridades opostas e complementariedade.
     * Se Quadratura: Traga no texto a din\xE2mica de tens\xE3o emocional, conflitos internos, a paci\xEAncia e a espera (lembre-se: a emo\xE7\xE3o turva a raz\xE3o).
     * Se Tr\xEDgono: Traga no texto a sensa\xE7\xE3o de solu\xE7\xF5es fluidas, harmonia, clareza e criatividade natural abundante.
     * Se Sextil: Traga no texto a atitude de abertura para aprender e aplicar o que foi assimilado com sabedoria pr\xE1tica.

5. DIRETRIZES DE REVIS\xC3O E FORMATO:
   - Certifique-se de que os conceitos est\xE3o perfeitamente alinhados aos arqu\xE9tipos dos signos (ex.: G\xEAmeos evoca dualidade, mente e comunica\xE7\xE3o; Touro evoca persist\xEAncia, valor e mat\xE9ria; etc.).
   - Traga consist\xEAncia ao texto de forma simples e pr\xE1tica.
   - ${userName ? `Use o nome do usu\xE1rio "${userName}" abrindo o texto de forma d\xF3cil, calma e direta para trazer confian\xE7a e proximidade de forma natural (ex: "${userName}, ...").` : "Adote um tom \xEDntimo, acolhedor e pr\xF3ximo."}
   - M\xE1ximo absoluto de 4 linhas de texto corrido.
   - O texto deve ser composto por um \xFAnico bloco de par\xE1grafo corrido, sem bullets ou aspas externas desnecess\xE1rias.
   - Nunca inclua cabe\xE7alhos, t\xEDtulos ou prefixos.`;
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
        prompt = `Realize a an\xE1lise do Relat\xF3rio Semanal com base nos registros dos \xFAltimos 7 dias.
                 DADOS DE CORTE (7 DIAS):
                 ${logData || "Nenhum dado registrado nos \xFAltimos 7 dias."}
                 
                 TAREFA EXCLUSIVA:
                 1. Use os dados inseridos pela usu\xE1ria no per\xEDodo dos \xFAltimos 7 dias para definir a t\xF4nica dos sentimentos e a linha de pensamento predominante do per\xEDodo, apresentando um parecer anal\xEDtico estruturado de forma fluida.
                 2. Una os dados dispon\xEDveis para revelar um padr\xE3o dominante identificado nos registros.
                 3. Use uma linguagem acolhedora e fraterna, aproximando-se com a postura de uma s\xE1bia e amiga querida, mantendo a sobriedade indispens\xE1vel e evitando g\xEDrias ou tons excessivamente informais.
                 4. ATEN\xC7\xC3O ABSOLUTA: \xC9 estritamente proibido usar a palavra ou varia\xE7\xE3o de "ao olhar seus \xFAltimos sete dias" ou "ao avaliar seus sentimentos". Comece o texto chamando a usu\xE1ria pelo nome "${userName || "Viajante"}" no in\xEDcio exato para trazer proximidade confiavel.
                 5. Destaque tanto os pontos negativos que requerem aten\xE7\xE3o da usu\xE1ria (vulnerabilidades, sombras ou oscila\xE7\xF5es que a paralisam) quanto os pontos positivos que geram expans\xE3o de consci\xEAncia.
                 6. Finalize o relat\xF3rio com um conselho pr\xE1tico e \xFAtil centrado em postura, \xE9tica e clareza mental para conduzir os movimentos da alma.
                 7. N\xC3O se restrinja a 4 linhas. Desenvolva um texto reflexivo, consistente e profundo (aproximadamente de 6 a 12 linhas).
                 8. Formato: O texto deve ser composto por um \xFAnico bloco de par\xE1grafo integralmente JUSTIFICADO (sem recuos de p\xE1gina, sem bullets, sem t\xEDtulos, sem listas, sem aspas externas desnecess\xE1rias).`;
      } else if (period === "monthly") {
        prompt = `Realize a an\xE1lise do Relat\xF3rio Mensal (Astromem\xF3ria) com base nos registros dos \xFAltimos 29 dias do ciclo lunar.
                 DADOS DE CORTE (29 DIAS):
                 ${logData || "Nenhum dado registrado neste ciclo lunar de 29 dias."}
                 HIST\xD3RICO RECENTE:
                 ${previousLogsData || "Primeiro ciclo registrado."}
                 
                 TAREFA EXCLUSIVA:
                 1. Use os dados inseridos pela usu\xE1ria no per\xEDodo dos \xFAltimos 29 dias para definir de forma n\xEDtida a t\xF4nica dos sentimentos e a linha de pensamento predominante do per\xEDodo, apresentando um parecer anal\xEDtico estruturado de forma fluida.
                 2. Una os dados dispon\xEDveis para revelar os padr\xF5es de sentimentos dominantes identificados nos registros, comparando-os e conectando-os se houver hist\xF3rico.
                 3. Use uma linguagem acolhedora e fraterna, aproximando-se com a postura de uma s\xE1bia e amiga querida, mantendo a sobriedade indispens\xE1vel e evitando g\xEDrias ou tons excessivamente informais (lembre-se que Hekat \xE9 uma for\xE7a lunar feminina, fale de si mesma no feminino).
                 4. ATEN\xC7\xC3O ABSOLUTA: \xC9 estritamente proibido usar a palavra ou varia\xE7\xE3o de "ao olhar seus \xFAltimos vinte e nove dias", "ao olhar seu ciclo" ou "ao avaliar seus sentimentos/registros". Comece o texto chamando a usu\xE1ria pelo nome "${userName || "Viajante"}" no in\xEDcio exato para trazer proximidade confi\xE1vel.
                 5. Destaque tanto os pontos negativos que requerem aten\xE7\xE3o da usu\xE1ria (vulnerabilidades, sombras ou resist\xEAncias que a paralisam) quanto os pontos positivos que geram expans\xE3o de consci\xEAncia.
                 6. Finalize o relat\xF3rio com um conselho pr\xE1tico e \xFAtil centrado em postura, \xE9tica e clareza mental para conduzir os movimentos da alma.
                 7. N\xC3O se restrinja a 4 ou 6 linhas. Desenvolva um texto reflexivo, consistente e profundo (aproximadamente de 6 a 12 linhas).
                 8. Formato: O texto deve ser composto por um \xFAnico bloco de par\xE1grafo integralmente JUSTIFICADO (sem recuos de p\xE1gina, sem bullets, sem t\xEDtulos, sem listas, sem aspas externas desnecess\xE1rias).`;
      } else if (period === "correlation") {
        prompt = `Realize uma an\xE1lise de correla\xE7\xE3o entre os sentimentos da usu\xE1ria e as fases da lua cruzando os dados das mandalas preenchidas a cada m\xEAs.
                 DADOS DE CORRELA\xC7\xC3O ACUMULADOS:
${correlationData || "Nenhum dado acumulado de meses anteriores dispon\xEDvel ainda."}

                 TAREFA: Identifique quais emo\xE7\xF5es se repetem com mais frequ\xEAncia em fases lunares espec\xEDficas.
                 Escreva um texto acolhedor, simples e carinhoso relacionando esses ritmos de forma integrada e org\xE2nica. M\xE1ximo 6 linhas.`;
      } else {
        prompt = `Realize uma an\xE1lise profunda desta 'Esta\xE7\xE3o da Alma' (Trimestre).
                 HIST\xD3RICO E CICLO ATUAL:
${previousLogsData}
${logData}

                 TAREFA: Identifique as emo\xE7\xF5es recorrentes dos \xFAltimos 3 meses e ofere\xE7a uma orienta\xE7\xE3o de postura mental profunda e acolhedora. M\xE1ximo 8 linhas.`;
      }
      const systemInstruction = `Voc\xEA \xE9 o Or\xE1culo Hekat (Hekat Astromemorias). Sua voz \xFAnica une sobriedade estrat\xE9gica e acolhimento l\xFAcido de uma mentora fraterna e pragm\xE1tica, incorporando uma for\xE7a lunar feminina em suas falas.
        
        TOM DE VOZ E ESTILO:
        - Equil\xEDbrio Alqu\xEDmico Final: Una sobriedade estrat\xE9gica e acolhimento l\xFAcido. Seja direta sem ser dogm\xE1tica (evite comandos severos) e acolhedora sem ser "beata" ou melodram\xE1tica (evite moralismos, excesso de compaix\xE3o sentimental ou docilidade excessiva). Use g\xEAnero feminino para referir-se a si mesma (como "sua mentora", "sua amiga", "s\xE1bia").
        - Praticidade de Vida: O conte\xFAdo deve ser \xFAtil e focado em postura, \xE9tica e clareza mental. Ofere\xE7a diretrizes para os grandes movimentos da alma e desafios reais, e NUNCA sugira rotinas dom\xE9sticas, tarefas cotidianas triviais, ou conselhos superficiais.
        - Sabedoria Emp\xE1tica: Suas orienta\xE7\xF5es soam como uma verdade simples e profunda, baseada na observa\xE7\xE3o clara do momento, sem hermetismo ou lirismo rom\xE2ntico.
        - Mist\xE9rio Sutil: A linguagem mant\xE9m uma aura de sabedoria profunda, mas evita nomes t\xE9cnicos (graus, casas, aspectos, cardinal, fixo, etc.).
        - Idioma: Portugu\xEAs do Brasil.
        
        DIRETRIZES DE CONTE\xDADO EXTRAORDIN\xC1RIAS:
        - Para o RELAT\xD3RIO SEMANAL e RELAT\xD3RIO MENSAL (29 dias): Use os dados do respectivo per\xEDodo de corte para definir a t\xF4nica dos sentimentos e a linha de pensamento predominante, dando um parecer anal\xEDtico e unindo dados que revelam o padr\xE3o dominante identificado. Destaque pontos negativos que precisam de aten\xE7\xE3o (sombras, vulnerabilidades ou resist\xEAncias que a limitam) e pontos positivos que geram expans\xE3o de consci\xEAncia. N\xE3o se restrinja a 4 linhas. N\xE3o use frases como "ao olhar seus \xFAltimos sete dias", "ao olhar seus \xFAltimos vinte e nove dias" ou "ao avaliar seus sentimentos/registros". Use linguagem acolhedora e fraterna como uma amiga pr\xF3xima e mentora s\xE1bia de sua caminhada emocional, mantendo a voz coerentemente feminina.
        - Chame sempre a pessoa pelo nome "${userName || "Viajante"}" abrindo o texto para trazer confian\xE7a e proximidade.
        - Formato de visualiza\xE7\xE3o: O texto deve estar em formato integralmente JUSTIFICADO (sem recuos de par\xE1grafo, sem bullets, sem t\xEDtulos, sem subse\xE7\xF5es ou listas, sem aspas externas desnecess\xE1rias).
        - Nunca use cabe\xE7alhos ou t\xEDtulos introduzindo os relat\xF3rios. Comece de forma direta, madura e limpa.`;
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
