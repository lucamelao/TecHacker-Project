let thirdPartyUrls = [];

// Lidando com as requisições de terceiros
const handleThirdPartyRequests = requestDetails => {
  try {
    if (!requestDetails.originUrl) {
      return;
    }
    let originUrl = new URL(requestDetails.originUrl);
    let requestUrl = new URL(requestDetails.url);

    // Se o hostname da URL de origem e da URL da requisição forem diferentes, é uma requisição de terceiros
    if (originUrl.hostname !== requestUrl.hostname) {
      console.log("%c[3rd Party] Detecção de requisição de terceiros:", 'color: blue;', requestDetails.url);
      thirdPartyUrls.push(requestDetails.url);
    }

    // Criando um map para rastrear cookies para detecção de sincronização de cookies
    const cookieMap = new Map();

    for (let i = 0; i < requestDetails.requestHeaders.length; ++i) {
      if (requestDetails.requestHeaders[i].name.toLowerCase() === 'cookie') {

        // Analisando a string de cookie e adicionando cada um ao map
        let cookies = requestDetails.requestHeaders[i].value.split(';');
        cookies.forEach(cookie => {
          let [name, value] = cookie.split('=').map(s => s.trim());
          if (cookieMap.has(value)) {
            cookieMap.get(value).push(requestDetails.originUrl);
          } else {
            cookieMap.set(value, [requestDetails.originUrl]);
          }
        });
      }
    }

    for (let [value, urls] of cookieMap) {
      if (urls.length > 1) {
        console.log(`%cPossível sincronização do valor ${value} entre estas URLs: ${urls.join(", ")}`, 'color: red;');
      }
    }
    
  } catch (error) {
    console.error("%cErro ao tratar requisição:", 'color: red;', error);
  }
};

// Obtendo as chaves do LocalStorage
const getLocalStorageKeys = async tabId => {
  const code = `[...Array(localStorage.length).keys()].map((k) => localStorage.key(k));`;
  const results = await browser.tabs.executeScript(tabId, { code });

  if (browser.runtime.lastError) {
    console.error("%cErro ao verificar o LocalStorage:", 'color: red;', browser.runtime.lastError);
    return { storageAvailable: false };
  }

  const allKeys = results.flat();
  const storageAvailable = allKeys.length > 0;
  if (storageAvailable) {
    console.log("%c[LocalStorage] Instâncias de LocalStorage encontradas", 'color: blue;');
  } else {
    console.log("%c[LocalStorage] Nenhuma instância encontrada no LocalStorage", 'color: blue;');
  }

  return { storageAvailable, keys: allKeys };
};

// Obtendo a pontuação de privacidade
const getPrivacyScore = async (tabId, tabUrl) => {
  const domain = new URL(tabUrl).hostname;
  const uniqueThirdPartyUrls = Array.from(new Set(thirdPartyUrls));
  const cookies = await browser.cookies.getAll({ url: tabUrl });
  const thirdPartyCookies = cookies.filter(cookie => cookie.domain !== domain);
  const firstPartyCookies = cookies.filter(cookie => cookie.domain === domain);
  const localStorageData = await getLocalStorageKeys(tabId);

  const WEIGHTS = {
    thirdPartyUrls: 0.25,
    thirdPartyCookies: 3,
    firstPartyCookies: 1,
    localStorage: 1.5
  };

  let score = 0;
  score += WEIGHTS.thirdPartyUrls * uniqueThirdPartyUrls.length;
  score += WEIGHTS.thirdPartyCookies * thirdPartyCookies.length;
  score += WEIGHTS.firstPartyCookies * firstPartyCookies.length;
  score += WEIGHTS.localStorage * (localStorageData.storageAvailable ? localStorageData.keys.length : 0);

  const scaledScore = (score / 500) * 100;
  const invertedScore = 100 - scaledScore;

  return invertedScore;
};

// Monitorando todas as requisições
browser.webRequest.onBeforeSendHeaders.addListener(
  handleThirdPartyRequests,
  { urls: ["<all_urls>"] },
  ["requestHeaders"]
);

// Lidando com as mensagens do runtime
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch(request.greeting) {
    case "getUrls":
      const uniqueUrls = Array.from(new Set(thirdPartyUrls));
      console.log("ENVIANDO URLs de terceiros:", uniqueUrls);
      sendResponse({ urls: uniqueUrls });
      thirdPartyUrls = [];
      break;

    case "getCookieCount":
      console.log("%c[COOKIES] Obtendo a contagem de cookies para o domínio:", 'color: green;', request.domain);
      if (!(isCookieStorageEnabled())) {
        console.log("O armazenamento de cookies não está habilitado");
        sendResponse({ error: "O armazenamento de cookies não está habilitado" });
      } else {
        getCookieCount(request.domain).then(cookieCount => sendResponse({ cookieCount }));
      }
      return true; 

    case "checkLocalStorage":
      console.log("%c[LocalStorage] Verificando LocalStorage para tabId:", 'color: green;', request.tabId);
      getLocalStorageKeys(request.tabId).then(localStorageData => sendResponse(localStorageData));
      return true; 

    case "getPrivacyScore":
      console.log("Obtendo a pontuação de privacidade para a tabUrl:", request.tabUrl);
      getPrivacyScore(request.tabId, request.tabUrl).then(privacyScore => {
        console.log("Pontuação de privacidade calculada:", privacyScore);
        sendResponse({ privacyScore });
      });
      return true; 

    default:
      console.error("Greeting desconhecido:", request.greeting);
  }
});

