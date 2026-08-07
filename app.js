// Application Controller for Minima Infobae (Supabase Version)

document.addEventListener("DOMContentLoaded", async () => {
  // --- SUPABASE CLIENT INITIALIZATION ---
  const supabase = window.supabase.createClient(
    SUPABASE_CONFIG.SUPABASE_URL,
    SUPABASE_CONFIG.SUPABASE_ANON_KEY
  );

  // --- STATE MANAGEMENT ---
  const state = {
    activeCountry: "CO",      // Country ID: 'CO', 'MX', etc.
    activeCategory: "Todos",  // Category Name: 'Todos', 'Política', etc.
    searchQuery: "",
    theme: localStorage.getItem("theme") || "light",
    countries: [],            // Dynamically loaded from database
    categories: []            // Dynamically loaded from database
  };

  // Helper to format authors and prevent grid wrapping issues
  const formatAuthor = (authorStr) => {
    if (!authorStr) return 'Redacción';
    const cleaned = authorStr.trim();
    // If it has commas (multiple authors), show first and count others
    if (cleaned.includes(',')) {
      const parts = cleaned.split(',');
      const firstAuthor = parts[0].trim();
      const othersCount = parts.length - 1;
      return `${firstAuthor} y ${othersCount} más`;
    }
    // If it's single author but too long
    if (cleaned.length > 32) {
      return cleaned.substring(0, 29) + '...';
    }
    return cleaned;
  };



  // --- DOM SELECTORS ---
  const body = document.body;
  const themeToggleBtn = document.getElementById("theme-toggle");
  const searchInput = document.getElementById("search-input");
  const categoryContainer = document.getElementById("category-container");
  const countrySwitcher = document.getElementById("country-switcher");
  
  const heroContainer = document.getElementById("hero-container");
  const newsGrid = document.getElementById("news-grid");
  const trendingList = document.getElementById("trending-list");
  
  // Widget selectors
  const weatherCity = document.getElementById("weather-city");
  const weatherTemp = document.getElementById("weather-temp");
  const weatherDesc = document.getElementById("weather-desc");
  const weatherIcon = document.getElementById("weather-icon");
  const currencyBox = document.getElementById("currency-box");

  // Modal selectors
  const modalOverlay = document.getElementById("modal-overlay");
  const modalClose = document.getElementById("modal-close");
  const modalImg = document.getElementById("modal-img");
  const modalCategory = document.getElementById("modal-category");
  const modalTitle = document.getElementById("modal-title");
  const modalAuthorAvatar = document.getElementById("modal-author-avatar");
  const modalAuthorName = document.getElementById("modal-author-name");
  const modalPublishDate = document.getElementById("modal-publish-date");
  const modalArticleText = document.getElementById("modal-article-text");
  
  // --- MOCK WIDGET LOGIC (Calculated based on active country) ---
  const weatherMocks = {
    CO: { temp: "19°C", desc: "Llovizna dispersa", icon: "🌧️" },
    MX: { temp: "24°C", desc: "Parcialmente soleado", icon: "⛅" },
    default: { temp: "22°C", desc: "Despejado", icon: "☀️" }
  };

  const currencyMocks = {
    USDCOP: [
      { label: "USD a COP", value: "$4,120.50" },
      { label: "EUR a COP", value: "$4,480.15" }
    ],
    USDMXN: [
      { label: "USD a MXN", value: "$17.15" },
      { label: "EUR a MXN", value: "$18.62" }
    ],
    default: [
      { label: "USD a EUR", value: "€0.92" },
      { label: "GBP a USD", value: "$1.28" }
    ]
  };

  // --- THEME INITIALIZATION ---
  const applyTheme = (themeName) => {
    if (themeName === "dark") {
      body.classList.add("dark-theme");
    } else {
      body.classList.remove("dark-theme");
    }
    localStorage.setItem("theme", themeName);
  };
  applyTheme(state.theme);

  // --- METADATA LOADER (SUPABASE) ---
  const loadMetadata = async () => {
    try {
      // Fetch Countries
      const { data: dbCountries, error: countriesError } = await supabase
        .from("countries")
        .select("*")
        .order("name");

      if (countriesError) throw countriesError;
      state.countries = dbCountries || [];

      // Fetch Categories
      const { data: dbCategories, error: categoriesError } = await supabase
        .from("categories")
        .select("*")
        .order("id");

      if (categoriesError) throw categoriesError;
      state.categories = dbCategories || [];

      // Set initial country if present
      if (state.countries.length > 0) {
        state.activeCountry = state.countries[0].id;
      }
    } catch (err) {
      console.error("Error al cargar metadatos de Supabase:", err);
    }
  };

  // --- DYNAMIC RENDERING OF METADATA COMPONENT NAVBARS ---

  const renderCountrySwitcher = () => {
    if (state.countries.length === 0) return;

    const buttonsHTML = state.countries.map((country) => {
      const isActive = state.activeCountry === country.id;
      return `
        <button 
          id="btn-country-${country.id.toLowerCase()}" 
          class="country-btn ${isActive ? 'active' : ''}" 
          data-id="${country.id}" 
          role="radio" 
          aria-checked="${isActive ? 'true' : 'false'}"
        >
          ${country.name}
        </button>
      `;
    }).join("");

    const sliderHTML = `
      <div 
        class="country-slider" 
        id="country-slider" 
        aria-hidden="true" 
        style="width: calc(${100 / state.countries.length}% - 6px); transform: translateX(0px)"
      ></div>
    `;

    countrySwitcher.innerHTML = buttonsHTML + sliderHTML;

    // Position slider initial position
    updateCountrySliderPosition();

    // Event listeners
    state.countries.forEach(country => {
      const btn = document.getElementById(`btn-country-${country.id.toLowerCase()}`);
      btn.addEventListener("click", () => {
        if (state.activeCountry !== country.id) {
          state.activeCountry = country.id;
          updateCountrySliderPosition();
          
          // Switch active class
          document.querySelectorAll(".country-btn").forEach(b => b.classList.remove("active"));
          btn.classList.add("active");

          resetCategoryAndSearch();
          renderApp();
        }
      });
    });
  };

  const updateCountrySliderPosition = () => {
    const slider = document.getElementById("country-slider");
    const activeIdx = state.countries.findIndex(c => c.id === state.activeCountry);
    if (slider && activeIdx !== -1) {
      slider.style.transform = `translateX(${activeIdx * 100}%)`;
    }
  };

  const renderCategoryBar = () => {
    if (state.categories.length === 0) return;

    const staticPill = `<button class="category-pill active" data-category="Todos">Todos</button>`;
    
    // Ignore general category as it maps to 'Todos' on the UI
    const pillsHTML = state.categories
      .filter(cat => cat.name.toLowerCase() !== 'general')
      .map(cat => `
        <button class="category-pill" data-category="${cat.name}">${cat.name}</button>
      `).join("");

    categoryContainer.innerHTML = staticPill + pillsHTML;
  };

  // --- EVENT LISTENERS ---
  
  // Theme Toggle
  themeToggleBtn.addEventListener("click", () => {
    state.theme = state.theme === "light" ? "dark" : "light";
    applyTheme(state.theme);
  });

  // Category Filtering
  categoryContainer.addEventListener("click", (e) => {
    if (e.target.classList.contains("category-pill")) {
      document.querySelectorAll(".category-pill").forEach(pill => {
        pill.classList.remove("active");
      });
      e.target.classList.add("active");
      state.activeCategory = e.target.getAttribute("data-category");
      renderArticles();
    }
  });

  // Search Input
  searchInput.addEventListener("input", (e) => {
    state.searchQuery = e.target.value.trim().toLowerCase();
    renderArticles();
  });

  // Close Modal
  modalClose.addEventListener("click", closeModal);
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) closeModal();
  });
  
  // Keyboard Close Modal
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalOverlay.classList.contains("open")) {
      closeModal();
    }
  });

  // --- DATA FETCHING & RENDERING (SUPABASE) ---

  const resetCategoryAndSearch = () => {
    state.activeCategory = "Todos";
    state.searchQuery = "";
    searchInput.value = "";
    document.querySelectorAll(".category-pill").forEach(pill => {
      if (pill.getAttribute("data-category") === "Todos") {
        pill.classList.add("active");
      } else {
        pill.classList.remove("active");
      }
    });
  };

  const getFilteredArticles = async () => {
    try {
      // Basic query select
      let query = supabase
        .from("articles")
        .select(`
          *,
          categories (
            name
          )
        `)
        .eq("country_id", state.activeCountry)
        .order("published_at", { ascending: false });

      // Add Category filter
      if (state.activeCategory !== "Todos") {
        // Resolve active category id
        const matchedCat = state.categories.find(c => c.name === state.activeCategory);
        if (matchedCat) {
          query = query.eq("category_id", matchedCat.id);
        }
      }

      // Add Search filter
      if (state.searchQuery) {
        query = query.or(`title.ilike.%${state.searchQuery}%,deck.ilike.%${state.searchQuery}%,content.ilike.%${state.searchQuery}%`);
      }

      // Limit results
      const { data: articles, error } = await query.limit(20);
      if (error) throw error;
      
      return articles || [];
    } catch (err) {
      console.error("Error al consultar artículos de Supabase:", err);
      return [];
    }
  };

  const openModal = (article) => {
    const categoryName = article.categories?.name || "General";
    
    // Fallbacks for images
    const defaultImage = state.activeCountry === "CO" ? "assets/colombia_hero.png" : "assets/mexico_hero.png";
    modalImg.src = article.image_url || defaultImage;
    modalImg.alt = article.title;
    modalCategory.textContent = categoryName;
    modalTitle.textContent = article.title;
    modalAuthorAvatar.textContent = article.author ? article.author.charAt(0) : "R";
    modalAuthorName.textContent = article.author || "Redacción";
    
    // Format pubdate
    const rawDate = new Date(article.published_at);
    const dateFormatted = rawDate.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });
    modalPublishDate.textContent = dateFormatted;
    
    // Format paragraph breaks
    const formattedParagraphs = (article.content || '')
      .split("\n\n")
      .map(para => `<p>${para.replace(/\n/g, "<br>")}</p>`)
      .join("");
    
    modalArticleText.innerHTML = formattedParagraphs;

    // Social share setup
    setupShareButtons(article);

    modalOverlay.classList.add("open");
    document.body.style.overflow = "hidden";
  };

  function closeModal() {
    modalOverlay.classList.remove("open");
    document.body.style.overflow = "";
  }

  const setupShareButtons = (article) => {
    const text = encodeURIComponent(article.title);
    const url = encodeURIComponent(article.link || window.location.href);
    
    const twBtn = document.querySelector(".share-tw");
    const fbBtn = document.querySelector(".share-fb");
    const waBtn = document.querySelector(".share-wa");

    twBtn.href = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
    fbBtn.href = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    waBtn.href = `https://api.whatsapp.com/send?text=${text}%20${url}`;
  };

  const renderWidgets = () => {
    const activeCountryObj = state.countries.find(c => c.id === state.activeCountry);
    const cityName = activeCountryObj ? activeCountryObj.weather_city : "Cargando...";
    const weather = weatherMocks[state.activeCountry] || weatherMocks.default;
    
    weatherCity.textContent = cityName;
    weatherTemp.textContent = weather.temp;
    weatherDesc.textContent = weather.desc;
    weatherIcon.textContent = weather.icon;

    // Render Currency
    const currencyPairKey = activeCountryObj?.currency_pair || 'default';
    const rates = currencyMocks[currencyPairKey] || currencyMocks.default;
    
    currencyBox.innerHTML = rates.map(c => `
      <div class="currency-pair">
        <span class="currency-label">${c.label}</span>
        <span class="currency-value">${c.value}</span>
      </div>
    `).join("");
  };

  const renderTrending = async () => {
    try {
      const { data: trending, error } = await supabase
        .from("articles")
        .select(`
          *,
          categories (
            name
          )
        `)
        .eq("country_id", state.activeCountry)
        .eq("trending", true)
        .order("published_at", { ascending: false })
        .limit(4);

      if (error) throw error;

      if (!trending || trending.length === 0) {
        trendingList.innerHTML = `<p style="font-size:13px; color:var(--text-muted);">No hay tendencias en este momento.</p>`;
        return;
      }

      trendingList.innerHTML = trending.map((article, index) => {
        const catName = article.categories?.name || "General";
        return `
          <div class="trending-item" data-id="${article.id}">
            <span class="trending-number">0${index + 1}</span>
            <div class="trending-body">
              <span class="trending-category">${catName}</span>
              <span class="trending-headline">${article.title}</span>
            </div>
          </div>
        `;
      }).join("");

      // Add click events to trending items
      trendingList.querySelectorAll(".trending-item").forEach(item => {
        item.addEventListener("click", () => {
          const id = item.getAttribute("data-id");
          const found = trending.find(a => a.id === id);
          if (found) openModal(found);
        });
      });
    } catch (err) {
      console.error("Error al renderizar tendencias:", err);
    }
  };

  const renderArticles = async () => {
    // Show a loading skeleton or text
    newsGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
        <i class="fa-solid fa-spinner fa-spin" style="font-size: 24px; margin-bottom: 8px;"></i>
        <p>Cargando noticias de la base de datos...</p>
      </div>
    `;

    const filtered = await getFilteredArticles();

    if (filtered.length === 0) {
      heroContainer.innerHTML = "";
      newsGrid.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🔍</div>
          <h3 class="empty-state-title">No encontramos noticias</h3>
          <p class="empty-state-text">Prueba ajustando los filtros o realizando otra búsqueda.</p>
        </div>
      `;
      return;
    }

    const defaultImage = state.activeCountry === "CO" ? "assets/colombia_hero.png" : "assets/mexico_hero.png";

    // Render Hero Article (first of the list)
    const heroArticle = filtered[0];
    const heroCatName = heroArticle.categories?.name || "General";
    
    // Format date nicely
    const rawDate = new Date(heroArticle.published_at);
    const timeFormatted = rawDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const dateFormatted = rawDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    
    heroContainer.innerHTML = `
      <div class="hero-card" id="hero-article-card">
        <div class="hero-image-wrapper">
          <img src="${heroArticle.image_url || defaultImage}" alt="${heroArticle.title}" class="hero-img">
          <span class="hero-overlay">${heroCatName}</span>
        </div>
        <div class="hero-content">
          <div class="hero-meta">
            <span>${dateFormatted}, ${timeFormatted}</span>
            <span class="meta-divider"></span>
            <span>Por ${formatAuthor(heroArticle.author)}</span>
          </div>
          <h2 class="hero-title">${heroArticle.title}</h2>
          <p class="hero-deck">${heroArticle.deck || ''}</p>
          <div class="hero-author">
            <div class="author-avatar">${heroArticle.author ? heroArticle.author.trim().charAt(0) : 'R'}</div>
            <div class="author-info">
              <span class="author-name">${formatAuthor(heroArticle.author)}</span>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById("hero-article-card").addEventListener("click", () => {
      openModal(heroArticle);
    });

    // Render Grid Articles (the remaining items)
    const gridArticles = filtered.slice(1);
    if (gridArticles.length === 0) {
      newsGrid.innerHTML = "";
      return;
    }

    newsGrid.innerHTML = gridArticles.map(article => {
      const gridCatName = article.categories?.name || "General";
      const gridDate = new Date(article.published_at);
      const gridTimeStr = gridDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      const gridDateStr = gridDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

      return `
        <div class="news-card" data-id="${article.id}">
          <div class="card-image-wrapper">
            <img src="${article.image_url || defaultImage}" alt="${article.title}" class="card-img" loading="lazy">
            <span class="card-category">${gridCatName}</span>
          </div>
          <div class="card-content">
            <div class="card-meta">
              <span>${gridDateStr}, ${gridTimeStr}</span>
              <span class="meta-divider"></span>
              <span>Por ${formatAuthor(article.author)}</span>
            </div>
            <h3 class="card-title">${article.title}</h3>
            <p class="card-excerpt">${article.deck || ''}</p>
            <div class="card-footer">
              <div class="author-avatar" style="width: 24px; height: 24px; font-size: 10px;">${article.author ? article.author.trim().charAt(0) : 'R'}</div>
              <span class="author-name" style="font-size: 12px;">${formatAuthor(article.author)}</span>
            </div>
          </div>
        </div>
      `;
    }).join("");

    // Add click events to grid cards
    newsGrid.querySelectorAll(".news-card").forEach(card => {
      card.addEventListener("click", () => {
        const id = card.getAttribute("data-id");
        const found = gridArticles.find(a => a.id === id);
        if (found) openModal(found);
      });
    });
  };

  const renderApp = () => {
    renderWidgets();
    renderTrending();
    renderArticles();
  };

  // --- INITIAL LAUNCH ---
  // Load metadata from Supabase, render layout, and fetch news
  await loadMetadata();
  renderCountrySwitcher();
  renderCategoryBar();
  renderApp();
});
