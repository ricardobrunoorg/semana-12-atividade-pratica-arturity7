


  /* =============================================
   CINESCOPE — script.js
   API: The Movie Database (TMDB)
   ============================================= */

// ─── CONFIGURAÇÃO ────────────────────────────────────────────────────────────
const API_KEY = "f904647018b96fe8b5159c620ec2d814"; 
const BASE_URL = "https://api.themoviedb.org/3";
const IMG_BASE = "https://image.tmdb.org/t/p/w500";

// ─── SELETORES DOM ────────────────────────────────────────────────────────────
const movieList   = document.getElementById("movie-list");
const messageEl   = document.getElementById("message");
const searchInput = document.getElementById("search");
const btnSearch   = document.getElementById("btnSearch");
const tabs        = document.querySelectorAll(".tab");

// ─── ESTADO ───────────────────────────────────────────────────────────────────
let currentEndpoint = "popular"; // endpoint ativo no momento

// ─── FUNÇÕES PRINCIPAIS ───────────────────────────────────────────────────────

/**
 * Busca filmes na TMDB.
 * @param {string} query - Texto de busca (vazio = usa endpoint de listagem)
 * @param {string} endpoint - popular | top_rated | now_playing | upcoming
 * @returns {Promise<Array>} - Array de filmes
 */
async function fetchMovies(query = "", endpoint = "popular") {
  let url;

  if (query.trim()) {
    // Pesquisa por texto: endpoint de busca
    url = `${BASE_URL}/search/movie?api_key=${API_KEY}&language=pt-BR&query=${encodeURIComponent(query)}&page=1`;
  } else {
    // Listagem por categoria
    url = `${BASE_URL}/movie/${endpoint}?api_key=${API_KEY}&language=pt-BR&page=1`;
  }

  const response = await fetch(url);

  if (!response.ok) {
    // Trata erros HTTP (401 chave inválida, 404 etc.)
    if (response.status === 401) {
      throw new Error("Chave de API inválida. Verifique a constante API_KEY no script.js.");
    }
    throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.results || [];
}

/**
 * Cria um card HTML para um filme.
 * @param {Object} movie - Objeto de filme retornado pela API
 * @returns {HTMLElement}
 */
function createMovieCard(movie) {
  const card = document.createElement("article");
  card.classList.add("movie-card");

  // Poster
  const posterWrap = document.createElement("div");
  posterWrap.classList.add("card-poster-wrap");

  if (movie.poster_path) {
    const img = document.createElement("img");
    img.classList.add("card-poster");
    img.src    = `${IMG_BASE}${movie.poster_path}`;
    img.alt    = movie.title;
    img.loading = "lazy";
    // Fallback caso a imagem falhe
    img.onerror = () => {
      posterWrap.innerHTML = "";
      posterWrap.appendChild(createPosterPlaceholder(movie.title));
    };
    posterWrap.appendChild(img);
  } else {
    posterWrap.appendChild(createPosterPlaceholder(movie.title));
  }

  // Badge de avaliação
  if (movie.vote_average) {
    const rating = document.createElement("div");
    rating.classList.add("card-rating");
    const score = movie.vote_average.toFixed(1);
    rating.textContent = `★ ${score}`;
    posterWrap.appendChild(rating);
  }

  // Corpo do card
  const body = document.createElement("div");
  body.classList.add("card-body");

  // Título
  const title = document.createElement("h3");
  title.classList.add("card-title");
  title.textContent = movie.title || "Título desconhecido";

  // Ano de lançamento
  const year = document.createElement("p");
  year.classList.add("card-year");
  year.textContent = movie.release_date
    ? movie.release_date.substring(0, 4)
    : "Ano desconhecido";

  // Sinopse (limitada)
  const overview = document.createElement("p");
  overview.classList.add("card-overview");
  overview.textContent = movie.overview
    ? truncateText(movie.overview, 140)
    : "Sinopse não disponível.";

  body.appendChild(title);
  body.appendChild(year);
  body.appendChild(overview);

  card.appendChild(posterWrap);
  card.appendChild(body);

  return card;
}

/**
 * Cria um placeholder quando não há poster.
 * @param {string} title
 * @returns {HTMLElement}
 */
function createPosterPlaceholder(title) {
  const placeholder = document.createElement("div");
  placeholder.classList.add("poster-placeholder");
  placeholder.innerHTML = `<span>🎬</span><span>${title ? title[0] : "?"}</span>`;
  return placeholder;
}

/**
 * Renderiza a lista de filmes na grade.
 * @param {Array} movies - Array de objetos de filmes
 */
function renderMovies(movies) {
  movieList.innerHTML = ""; // Limpa o container

  if (!movies || movies.length === 0) {
    showEmptyState();
    return;
  }

  showMessage(""); // Limpa mensagens

  movies.forEach(movie => {
    const card = createMovieCard(movie);
    movieList.appendChild(card);
  });
}

/**
 * Exibe skeletons de carregamento enquanto aguarda a API.
 * @param {number} count - Quantidade de skeletons
 */
function showSkeletons(count = 12) {
  movieList.innerHTML = "";
  for (let i = 0; i < count; i++) {
    movieList.innerHTML += `
      <div class="skeleton-card">
        <div class="skeleton-poster"></div>
        <div class="skeleton-body">
          <div class="skeleton-line title"></div>
          <div class="skeleton-line year"></div>
          <div class="skeleton-line text"></div>
          <div class="skeleton-line text2"></div>
        </div>
      </div>
    `;
  }
}

/**
 * Exibe uma mensagem de texto na área de feedback.
 * @param {string} text - Texto da mensagem
 * @param {string} [type] - "error" | "loading" | "" (normal)
 */
function showMessage(text, type = "") {
  messageEl.textContent = text;
  messageEl.className   = type;
}

/**
 * Exibe o estado vazio (sem resultados).
 */
function showEmptyState() {
  showMessage("");
  movieList.innerHTML = `
    <div class="empty-state">
      <span class="empty-icon">🔍</span>
      <h3>Nenhum filme encontrado</h3>
      <p>Tente outro título ou remova os filtros aplicados.</p>
    </div>
  `;
}

/**
 * Trunca texto ao comprimento máximo, adicionando "...".
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
function truncateText(text, maxLength) {
  if (!text) return "";
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
}

// ─── FLUXO PRINCIPAL ──────────────────────────────────────────────────────────

/**
 * Orquestra busca + renderização + tratamento de erros.
 * @param {string} query - Texto de busca
 * @param {string} endpoint - Categoria (popular, top_rated, etc.)
 */
async function loadMovies(query = "", endpoint = currentEndpoint) {
  showSkeletons(12);

  const searchTerm = query.trim();
  if (searchTerm) {
    showMessage(`Buscando por "${searchTerm}"...`, "loading");
  } else {
    showMessage("Carregando filmes...", "loading");
  }

  try {
    const movies = await fetchMovies(searchTerm, endpoint);
    renderMovies(movies);

    if (movies.length > 0 && searchTerm) {
      showMessage(`${movies.length} resultado(s) para "${searchTerm}"`);
    } else if (movies.length > 0) {
      showMessage("");
    }
  } catch (error) {
    // Tratamento de erro: exibe mensagem no DOM e no console
    console.error("[CineScope] Erro ao buscar filmes:", error);
    movieList.innerHTML = "";
    showMessage(`⚠ ${error.message}`, "error");
  }
}

/**
 * Inicializa a aplicação: carrega filmes populares ao abrir a página.
 */
async function init() {
  await loadMovies("", "popular");
}

// ─── EVENTOS ──────────────────────────────────────────────────────────────────

// Botão "Buscar"
btnSearch.addEventListener("click", () => {
  const query = searchInput.value;
  // Ao buscar por texto, desativa as tabs
  tabs.forEach(t => t.classList.remove("active"));
  loadMovies(query, "popular");
});

// Busca ao pressionar Enter
searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    btnSearch.click();
  }
});

// Busca em tempo real (debounce de 500ms)
let debounceTimer;
searchInput.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    const query = searchInput.value.trim();
    if (query.length >= 2) {
      tabs.forEach(t => t.classList.remove("active"));
      loadMovies(query);
    } else if (query.length === 0) {
      // Volta para a categoria ativa ao limpar o campo
      const activeTab = document.querySelector(".tab.active");
      if (activeTab) loadMovies("", activeTab.dataset.endpoint);
    }
  }, 500);
});

// Tabs de filtro por categoria
tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    tabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");

    currentEndpoint = tab.dataset.endpoint;
    searchInput.value = ""; // Limpa busca ao trocar de tab
    loadMovies("", currentEndpoint);
  });
});

// ─── INICIALIZAÇÃO ────────────────────────────────────────────────────────────
init();