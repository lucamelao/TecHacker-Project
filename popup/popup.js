function handlePrivacyScoreResponse(message) {
  // Trata a resposta de pontuação de privacidade
  console.log("handlePrivacyScoreResponse chamado com a mensagem:", message);
  let privacyScoreElement = document.getElementById("privacy-score");
  
  if (message && message.privacyScore) {
    let score = message.privacyScore.toFixed(2);
    privacyScoreElement.textContent = `Privacy Score: ${score}`;
  
    // Define a cor com base na pontuação
    if (score < 40) {
      privacyScoreElement.className = "red";
    } else if (score >= 40 && score <= 60) {
      privacyScoreElement.className = "yellow";
    } else {
      privacyScoreElement.className = "green";
    }
  } else {
    privacyScoreElement.textContent = "Não foi possível recuperar a pontuação de privacidade.";
    privacyScoreElement.style.color = "black";
  }
}

function handleUrlsResponse(message) {
  // Trata a resposta das URLs
  console.log("handleUrlsResponse chamado com a mensagem:", message);
  let urlsList = document.getElementById("urls-list");

  urlsList.textContent = "";

  if (message && message.urls) {
    // Cria uma string para guardar as URLs que serão escritas no arquivo
    let urlsForFile = "";

    message.urls.forEach(url => {
      // Analisa a URL conforme sua necessidade antes de definir o textContent
      let parsedUrl = url.split('//')[1].split('.com')[0] + ".com";
      let listItem = document.createElement('li');
      listItem.textContent = parsedUrl;
      urlsList.appendChild(listItem);

      // Adiciona a URL completa à string para o arquivo
      urlsForFile += url + "\n\n";
    });

    // Cria um blob a partir da string de URLs
    let blob = new Blob([urlsForFile], {type: "text/plain;charset=utf-8"});
    
    // Cria uma URL a partir do blob
    let blobURL = window.URL.createObjectURL(blob);

    // Cria um elemento de link
    let tempLink = document.createElement('a');
    
    // Define o href do link para a URL do blob e baixe-o como urls.txt
    tempLink.href = blobURL;
    tempLink.download = 'urls.txt';
    
    // Adiciona temporariamente o link ao documento
    document.body.appendChild(tempLink);
    
    // Clica programaticamente no link para acionar o download
    tempLink.click();
    
    // Remove o link do documento
    document.body.removeChild(tempLink);

  } else {
    let p = document.createElement('p');
    p.textContent = "Não foi possível recuperar as URLs de Terceiros.";
    urlsList.appendChild(p);
  }
}

function handleLocalStorageResponse(message) {
  // Trata a resposta do localStorage
  let localStorageStatus = document.getElementById("localStorage-status");
  let localStorageData = document.getElementById("localStorage-data");

  if (localStorageStatus) {
    if (message.storageAvailable && message.keys) {
      console.log("%c[LocalStorage] Instâncias de LocalStorage encontradas",'color: blue;');
      localStorageStatus.textContent = `${message.keys.length} key(s) found in Local Storage!`;
    } else {
      console.log("%c[LocalStorage] Nenhuma instância encontrada no LocalStorage",'color: blue;');
      localStorageStatus.textContent = "LocalStorage: No keys were found.";
    }
  }

  if (localStorageData) {
    // Limpa dados anteriores
    localStorageData.innerHTML = '';

    // Apresenta novos dados
    if (message.storageAvailable && message.keys) {
      message.keys.forEach(key => {
        let listItem = document.createElement('li');
        listItem.textContent = key;
        localStorageData.appendChild(listItem);
      });
    } else {
      let messageElement = document.createElement('p');
      messageElement.textContent = "Nenhuma instância de LocalStorage encontrada nesta página.";
      localStorageData.appendChild(messageElement);
    }
  }
}

function countCookies(cookies, domain) {
  // Conta os cookies
  let firstPartyCookies = cookies.filter(cookie => cookie.domain === domain);
  let thirdPartyCookies = cookies.filter(cookie => cookie.domain !== domain);
  let sessionCookies = cookies.filter(cookie => typeof cookie.expirationDate === "undefined");
  let persistentCookies = cookies.filter(cookie => typeof cookie.expirationDate !== "undefined");

  document.getElementById("session-count").textContent = `Number of Session Cookies: ${sessionCookies.length}`;
  document.getElementById("persistent-count").textContent = `Number of Persistent Cookies: ${persistentCookies.length}`;
  document.getElementById("first-party-count").textContent = `Number of First-Party Cookies: ${firstPartyCookies.length}`;
  document.getElementById("third-party-count").textContent = `Number of Third-Party Cookies: ${thirdPartyCookies.length}`;
  document.getElementById("total-count").textContent = `Total Cookies: ${cookies.length}`;
}

function clearLogs() {
  
  // Limpa as URLs de terceiros
  document.getElementById("urls-list").textContent = "";
  
  // Limpa a contagem de cookies
  document.getElementById("first-party-count").textContent = "";
  document.getElementById("third-party-count").textContent = "";
  document.getElementById("session-count").textContent = "";
  document.getElementById("persistent-count").textContent = "";
  document.getElementById("total-count").textContent = "";
  
  // Limpa o status e os dados do localStorage
  document.getElementById("localStorage-status").textContent = "";
  document.getElementById("localStorage-data").textContent = "";
}

// Manipulador de evento principal
document.addEventListener('DOMContentLoaded', function() {
  
  browser.tabs.query({active: true, currentWindow: true}).then(async (tabs) => {
    let tab = tabs[0];

    try {
      let url = new URL(tab.url);

      // Define o domínio atual
      document.getElementById("tab-domain").textContent = `Current domain: ${url.hostname}`;
      
      // Define a pontuação de privacidade
      let privacyScorePromise = browser.runtime.sendMessage({greeting: "getPrivacyScore", tabId: tab.id, tabUrl: tab.url});
      privacyScorePromise.then(handlePrivacyScoreResponse, handleError);

      // Define as URLs de terceiros (third-party connections)
      document.getElementById("get-urls").addEventListener('click', function() {
        let messagePromise = browser.runtime.sendMessage({greeting: "getUrls"});
        console.log("Promise da mensagem:", messagePromise);
        messagePromise.then(handleUrlsResponse, handleError);
      });
      
      // Define os itens do localStorage
      document.getElementById("check-localStorage").addEventListener('click', function() {
        browser.runtime.sendMessage({greeting: "checkLocalStorage", tabId: tabs[0].id}).then(handleLocalStorageResponse);
      });
      
      // Define a contagem de cookies
      document.getElementById("check-cookies").addEventListener('click', async function() {
        let cookies = await browser.cookies.getAll({url: url.href});
        countCookies(cookies, url.hostname);
      });

      // Limpa os logs do popup
      document.getElementById("clear").addEventListener('click', clearLogs);

    } catch (error) {
      console.error("URL inválida:", tab.url);
    }
  });

  function handleError(error) {
    console.log(`Erro: ${error}`);
  }
});