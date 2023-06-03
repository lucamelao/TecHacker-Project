# [2023.1] Projeto de Tecnologias Hacker

**Autoria:** Luca Coutinho Melão

## 1. Introdução

O projeto consiste na criação de uma extensão com o objetivo de detecção de ataques e violações de privacidade em clientes web. O plugin foi desenvolvido em javascript para o navegador Firefox, utilizando uma série de APIs disponibilizadas pelo mesmo. Abaixo é possível observar a versão final em execução.

<p align="center">
  <img width="400" alt="IJR1" src="https://github.com/lucamelao/TecHacker-Project/assets/63018319/13c9bfbf-9d0c-4015-92c2-c99dd910adcd"> 
  <img width="400" alt="IJR2" src="https://github.com/lucamelao/TecHacker-Project/assets/63018319/58f99316-0fd0-4ee9-802c-e0f58c8920f8">
  <img width="400" alt="G1" src="https://github.com/lucamelao/TecHacker-Project/assets/63018319/3928b6da-0dbc-4691-90c3-f397f625e15d"> 
  <img width="400" alt="UOL" src="https://github.com/lucamelao/TecHacker-Project/assets/63018319/24fb1b0c-a277-4846-bb99-e2ec724689d5">
</p>

## 2. Tutorial para rodar o projeto

1. Instale o Browser **Firefox**.

2. Clone este repositório em sua máquina.

3. Abra o Firefox e digite na barra de endereços: **about:debugging**.

4. Clique em ***This Firefox*** > ***Load Temporary Add-on...***.

5. Selecione o arquivo **manifest.json** deste repositório clonado e clique em ***"Open"***.

Com isso, a extensão estará rodando, para visualizá-la basta clicar no seu ícone na barra de extensões do Firefox, a qual pode ser acessada clicando no ícone de quebra cabeça.

<p align="center">
  <img width="412" alt="EXTENSION" src="https://github.com/lucamelao/TecHacker-Project/assets/63018319/efb6987a-0255-4458-816d-a937ff7cc761">
</p>

Para visualizar os logs no console do Firefox, basta ir na página **about:debugging** e clicar em ***"Inspect"*** na extensão. Quando  uma nova janela se abrir, clique na aba ***"Console"***.

Para parar a extensão, basta clicar em ***"Remove"*** na extensão na página **about:debugging**.

## 3. Desenvolvimento e funcionalidades

### 3.1. Cookies

Uso da API de Cookies do Firefox para detecção da quantidade de cookies injetados no carregamento de uma página, diferenciando entre cookies de primeira e terceira parte, bem como de sessão ou navegação.

Essa funcionalidade é implementada na função `countCookies(cookies, domain)`. Ela separa os cookies em cookies de primeira parte (aqueles que pertencem ao domínio visitado) e cookies de terceiros (aqueles de domínios diferentes). Além disso, ela distingue também entre cookies de sessão (aqueles que expiram quando o navegador é fechado) e cookies persistentes (aqueles que permanecem mesmo após o fechamento do navegador). Por fim, ela exibe todas essas contagens na interface do usuário, mostrando a quantidade total de cookies, bem como os números específicos para cada categoria.

### 3.2. Sincronismo de Cookies

O sincronismo de cookies é uma prática usada por empresas de publicidade online para compartilhar informações de usuários entre diferentes sites, permitindo que eles acompanhem a atividade do usuário através de múltiplos domínios, aprimorando a segmentação de anúncios. É realizado através da correspondência dos valores de cookies entre diferentes sites, permitindo que um perfil de usuário seja construído e compartilhado.

Neste plugin, a detecção de sincronização de cookies é feita através do monitoramento de todas as requisições de rede enviadas pelo navegador. Ao capturar um evento de requisição de rede (usando o evento `onBeforeSendHeaders`), o código verifica os headers de 'cookie' de todas as requisições de saída. Estes cookies são divididos em pares chave-valor individuais e armazenados em um map, no qual a key é o valor do cookie e o value é uma lista de URLs de origem que usaram esse valor de cookie.

Se, em qualquer momento, mais de uma URL de origem usa o mesmo valor de cookie, isso é registrado como uma possível sincronização de cookies. Desta forma, pode-se identificar se os cookies estão sendo sincronizados entre diferentes domínios, o que pode indicar o compartilhamento de informações do usuário entre diferentes partes.

Já no contexto do client, a função `detectSyncronism(cookies)` no arquivo popup.jsé responsável por detectar o sincronismo de cookies, examinando os cookies que estão atualmente armazenados no navegador do usuário. Ela percorre todos os cookies e os armazena em um map similar ao anterior. Quando encontra um valor de cookie que é compartilhado por mais de um domínio, conclui que há uma possível sincronização de cookies ocorrendo. Esta informação é então exibida para o usuário no popup, mostrando os domínios que estão possivelmente sincronizando seus cookies. Através dessa função, o usuário pode ter um panorama instantâneo de quais sites podem estar compartilhando suas informações através da sincronização de cookies.

### 3.3. Third Party Connections

Uso da API de WebRequest para detectar requisições de terceiros e a realização de conexões com terceiros.

O poupup da extensão mostra as conexões de terceiros realizadas na página atual, restringindo a visualização para o link da conexão. Porém, ao clicar no botão **"Get Third-Party URLs"**, o arquivo **"urls.txt"** é baixado contendo todas as conexões completas realizadas pela página.

### 3.4. Local Storage

O armazenamento de dados (local storage) pode ser acessado através do objeto *localStorage* em JavaScript. É utilizado um script de conteúdo para verificar o uso do *localStorage* em cada página.

### 3.5. Privacy Score

O cálculo de um score de privacidade para um domínio é um meio para fornecer ao usuário um entendimento rápido e intuitivo sobre a quantidade e o tipo de rastreamento que está ocorrendo em um determinado site.

No privacy score desse plugin, foram considerados os seguintes itens:

**1. thirdPartyUrls (0.25):** Esta é a quantidade de conexões a domínios de terceiros detectadas.

**2. firstPartyCookies (3.00):** Este é o número de cookies de primeira parte injetados no carregamento da página.

**3. thirdPartyCookies (1.00):** Este é o número de cookies de terceiros injetados no carregamento da página.

**4. localStorage (1.50):** Este é o número de objetos no LocalStorage.

As categorias tem pesos diferentes, correspondentes ao quão "prejudicial" consideramos esse parâmetro para a privacidade do usuário. Nesse caso optei por mais dar peso para cookies de terceiros do que para armazenamento local, porque os cookies de terceiros podem ser usados para rastrear usuários entre diferentes sites.

Além disso, o peso das thirdPartyUrls é menor do que o restante pelo número elevador de conexões que são estabelecidas.

Assim, o score é calculado de forma que quanto maior o score, melhor a privacidade do usuário. De modo a gerar um output visual claro e intuitivo para o usuário, o score é mostrado em vermelho, amarelo, ou verde, de acordo com o range no qual ele se encontra.

Sua implementação pode ser vista no arquivo "background.js", em "getPrivacyScore()".

## 4. Referências utilizadas

1. [Developing an Extension (mdn web docs)](https://developer.mozilla.org/pt-BR/docs/Mozilla/Add-ons/WebExtensions/Your_second_WebExtension)

2. [Working with the Cookies (Mozilla)](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Work_with_the_Cookies_API)

3. [API webRequest (mdn web docs)](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest)

4. [API cookies (mdn web docs)](https://developer.mozilla.org/pt-BR/docs/Mozilla/Add-ons/WebExtensions/API/cookies)
