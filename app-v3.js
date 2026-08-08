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
    categories: [],            // Dynamically loaded from database
    usdRates: null,           // Live currency exchange rates
    weatherData: null         // Live weather data
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
      return `${firstAuthor} +${othersCount}`;
    }
    // Crop long single author names to maximum 24 chars for design grid alignment
    if (cleaned.length > 24) {
      return cleaned.substring(0, 21) + '...';
    }
    return cleaned;
  };

  const generateSlug = (text) => {
    return text
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .substring(0, 60);
  };

  const getCountrySlug = (countryId) => {
    const slugs = {
      CO: "colombia",
      MX: "mexico",
      US: "usa",
      ES: "espana"
    };
    return slugs[countryId] || "general";
  };

  const getCountryIdFromSlug = (slug) => {
    const ids = {
      colombia: "CO",
      mexico: "MX",
      usa: "US",
      espana: "ES"
    };
    return ids[slug] || null;
  };

  // Helper to format currency numbers nicely
  const formatCurrency = (value, currencySymbol = "$") => {
    return `${currencySymbol}${Number(value).toLocaleString("es-MX", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  // Show premium floating toast notifications
  const showToast = (title, message, type = "success") => {
    let container = document.querySelector(".toast-container");
    if (!container) {
      container = document.createElement("div");
      container.className = "toast-container";
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast-notification toast-${type}`;

    const icons = {
      success: '<i class="fa-solid fa-circle-check"></i>',
      error: '<i class="fa-solid fa-circle-xmark"></i>',
      info: '<i class="fa-solid fa-circle-info"></i>'
    };

    toast.innerHTML = `
      <div class="toast-icon">${icons[type] || icons.info}</div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close" aria-label="Cerrar"><i class="fa-solid fa-xmark"></i></button>
    `;

    container.appendChild(toast);

    // Fade and slide in
    setTimeout(() => {
      toast.classList.add("show");
    }, 10);

    // Auto-close
    const timer = setTimeout(() => {
      dismissToast(toast);
    }, 4000);

    // Close button click
    toast.querySelector(".toast-close").addEventListener("click", () => {
      clearTimeout(timer);
      dismissToast(toast);
    });
  };

  const dismissToast = (toast) => {
    toast.classList.remove("show");
    setTimeout(() => {
      toast.remove();
    }, 450);
  };

  // Fetch live exchange rates from public API
  const fetchLiveRates = async () => {
    try {
      const res = await fetch("https://open.er-api.com/v6/latest/USD");
      if (!res.ok) throw new Error("API rates fetch failed");
      const data = await res.json();
      if (data && data.rates) {
        state.usdRates = data.rates;
      }
    } catch (err) {
      console.error("Error al obtener tasas de cambio:", err);
    }
  };

  // Fetch live weather data from public Open-Meteo API
  const fetchLiveWeather = async () => {
    const coords = {
      CO: { lat: 4.6097, lon: -74.0817 }, // Bogotá coords
      MX: { lat: 19.4326, lon: -99.1332 }, // Mexico City coords
      US: { lat: 25.7617, lon: -80.1918 }, // Miami coords
      ES: { lat: 40.4168, lon: -3.7038 }   // Madrid coords
    };

    const activeCoords = coords[state.activeCountry];
    if (!activeCoords) return;

    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${activeCoords.lat}&longitude=${activeCoords.lon}&current=temperature_2m,weather_code`);
      if (!res.ok) throw new Error("Weather API fetch failed");
      const data = await res.json();
      if (data && data.current) {
        const temp = Math.round(data.current.temperature_2m);
        const code = data.current.weather_code;
        
        let desc = "Despejado";
        let icon = "☀️";

        if (code === 0) { desc = "Despejado"; icon = "☀️"; }
        else if (code >= 1 && code <= 3) { desc = "Nublado parcial"; icon = "⛅"; }
        else if (code === 45 || code === 48) { desc = "Niebla"; icon = "🌫️"; }
        else if (code >= 51 && code <= 55) { desc = "Llovizna"; icon = "🌧️"; }
        else if (code >= 61 && code <= 65) { desc = "Lluvia"; icon = "🌧️"; }
        else if (code >= 80 && code <= 82) { desc = "Chubascos"; icon = "🌧️"; }
        else if (code >= 95) { desc = "Tormenta"; icon = "⛈️"; }

        state.weatherData = { temp: `${temp}°C`, desc, icon };
      }
    } catch (err) {
      console.error("Error al obtener clima:", err);
      state.weatherData = null; // Fallback to mocks
    }
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

  // Newsletter selectors
  const newsletterForm = document.getElementById("newsletter-form");
  const newsletterEmail = document.getElementById("newsletter-email");
  
  // --- MOCK WIDGET LOGIC (Calculated based on active country) ---
  const weatherMocks = {
    CO: { temp: "19°C", desc: "Llovizna dispersa", icon: "🌧️" },
    MX: { temp: "24°C", desc: "Parcialmente soleado", icon: "⛅" },
    US: { temp: "28°C", desc: "Caluroso", icon: "☀️" },
    ES: { temp: "22°C", desc: "Despejado", icon: "☀️" },
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
    USD: [
      { label: "EUR a USD", value: "$1.09" },
      { label: "GBP a USD", value: "$1.28" }
    ],
    EUR: [
      { label: "USD a EUR", value: "€0.92" },
      { label: "GBP a EUR", value: "€1.18" }
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

      // Set initial country from URL path segments or query params
      const pathSegments = window.location.pathname.split("/").filter(Boolean);
      let selectedCountryId = null;

      // Check if any of the path segments is a valid country slug
      for (const segment of pathSegments) {
        const matchingId = getCountryIdFromSlug(segment.toLowerCase());
        if (matchingId && state.countries.some(c => c.id === matchingId)) {
          selectedCountryId = matchingId;
          break;
        }
      }

      // Fallback to query params if not found in path (e.g. for legacy URLs)
      if (!selectedCountryId) {
        const urlParams = new URLSearchParams(window.location.search);
        const paisParam = urlParams.get("pais");
        if (paisParam) {
          selectedCountryId = getCountryIdFromSlug(paisParam.toLowerCase());
        }
      }

      if (selectedCountryId && state.countries.some(c => c.id === selectedCountryId)) {
        state.activeCountry = selectedCountryId;
      } else if (state.countries.length > 0) {
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
        style="width: calc(${100 / state.countries.length}% - ${8 / state.countries.length}px); transform: translateX(0px)"
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
          
          // Update URL dynamically without page reload
          const countrySlug = getCountrySlug(country.id);
          window.history.pushState(null, "", `/${countrySlug}/`);
          localStorage.setItem("user_preferred_country", countrySlug);

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

  // Newsletter Subscription Submit
  if (newsletterForm) {
    newsletterForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = newsletterEmail.value.trim();
      if (!email) return;

      // Strict email format validation (requires a TLD like .com, .org, .co, etc.)
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email)) {
        showToast("Correo inválido", "Ingresa una dirección válida con extensión (ej: nombre@correo.com).", "error");
        return;
      }

      try {
        const { error } = await supabase
          .from("subscribers")
          .insert([{ email, country_id: state.activeCountry }]);

        if (error) {
          if (error.code === "23505") {
            showToast("Ya registrado", "Este correo ya está suscrito a nuestro boletín.", "info");
          } else {
            throw error;
          }
        } else {
          showToast("¡Suscrito con éxito!", "Te has registrado en el boletín informativo.", "success");
          newsletterForm.reset();
        }
      } catch (err) {
        console.error("Error al suscribirse:", err);
        showToast("Error de registro", "Ocurrió un error al procesar tu suscripción.", "error");
      }
    });
  }

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
    const defaultImage = state.activeCountry === "CO" ? "/assets/colombia_hero.png" : "/assets/mexico_hero.png";
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
    const weather = state.weatherData || weatherMocks[state.activeCountry] || weatherMocks.default;
    
    weatherCity.textContent = cityName;
    weatherTemp.textContent = weather.temp;
    weatherDesc.textContent = weather.desc;
    weatherIcon.textContent = weather.icon;

    // Render Currency Rates (Live or Fallback)
    let rates = [];
    if (state.usdRates) {
      if (state.activeCountry === "CO") {
        const usdToCop = state.usdRates.COP;
        const eurToCop = state.usdRates.COP / state.usdRates.EUR;
        rates = [
          { label: "USD a COP", value: formatCurrency(usdToCop) },
          { label: "EUR a COP", value: formatCurrency(eurToCop) }
        ];
      } else if (state.activeCountry === "MX") {
        const usdToMxn = state.usdRates.MXN;
        const eurToMxn = state.usdRates.MXN / state.usdRates.EUR;
        rates = [
          { label: "USD a MXN", value: formatCurrency(usdToMxn) },
          { label: "EUR a MXN", value: formatCurrency(eurToMxn) }
        ];
      } else if (state.activeCountry === "ES") {
        const usdToEur = state.usdRates.EUR;
        const gbpToEur = state.usdRates.EUR / state.usdRates.GBP;
        rates = [
          { label: "USD a EUR", value: formatCurrency(usdToEur, "€") },
          { label: "GBP a EUR", value: formatCurrency(gbpToEur, "€") }
        ];
      } else if (state.activeCountry === "US") {
        const eurToUsd = 1 / state.usdRates.EUR;
        const gbpToUsd = 1 / state.usdRates.GBP;
        rates = [
          { label: "EUR a USD", value: formatCurrency(eurToUsd) },
          { label: "GBP a USD", value: formatCurrency(gbpToUsd) }
        ];
      } else {
        rates = [
          { label: "USD a EUR", value: formatCurrency(state.usdRates.EUR, "€") },
          { label: "GBP a USD", value: formatCurrency(1 / state.usdRates.GBP) }
        ];
      }
    } else {
      const currencyPairKey = activeCountryObj?.currency_pair || 'default';
      rates = currencyMocks[currencyPairKey] || currencyMocks.default;
    }
    
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
        const imgParam = article.image_url ? `&imagen=${encodeURIComponent(article.image_url)}` : "";
        const articleLink = `/article.html?pais=${getCountrySlug(article.country_id)}&noticia=${generateSlug(article.title)}&id=${article.id}${imgParam}`;
        return `
          <a href="${articleLink}" class="trending-item" style="text-decoration: none; color: inherit;">
            <span class="trending-number">0${index + 1}</span>
            <div class="trending-body">
              <span class="trending-category">${catName}</span>
              <span class="trending-headline">${article.title}</span>
            </div>
          </a>
        `;
      }).join("");
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

    const defaultImage = state.activeCountry === "CO" ? "/assets/colombia_hero.png" : "/assets/mexico_hero.png";

    // Render Hero Article (first of the list)
    const heroArticle = filtered[0];
    const heroCatName = heroArticle.categories?.name || "General";
    
    // Format date nicely
    const rawDate = new Date(heroArticle.published_at);
    const timeFormatted = rawDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const dateFormatted = rawDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    
    const heroImgParam = heroArticle.image_url ? `&imagen=${encodeURIComponent(heroArticle.image_url)}` : "";
    const heroLink = `/article.html?pais=${getCountrySlug(heroArticle.country_id)}&noticia=${generateSlug(heroArticle.title)}&id=${heroArticle.id}${heroImgParam}`;
    heroContainer.innerHTML = `
      <a href="${heroLink}" class="hero-card" id="hero-article-card" style="text-decoration: none; color: inherit;">
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
      </a>
    `;

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
      const gridImgParam = article.image_url ? `&imagen=${encodeURIComponent(article.image_url)}` : "";
      const articleLink = `/article.html?pais=${getCountrySlug(article.country_id)}&noticia=${generateSlug(article.title)}&id=${article.id}${gridImgParam}`;

      return `
        <a href="${articleLink}" class="news-card" style="text-decoration: none; color: inherit;">
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
        </a>
      `;
    }).join("");
  };

  // --- YOUTUBE SUBSCRIPTIONS INTERACTIVE CONTROLLER ---
  const initYoutubeSubscriptions = () => {
    const channels = {
      sin_filtros: {
        baseSubs: 11400,
        url: "https://www.youtube.com/@veredicto_final_sin_filtros",
        format: (num) => `${(num / 1000).toFixed(1).replace(".", ",")} K suscriptores`,
        defaultState: true // Pre-subscribed mock
      },
      sin_censura: {
        name: "Veredicto Final Sin Censura",
        baseSubs: 445,
        url: "https://www.youtube.com/@veredictofinalsincensura",
        format: (num) => `${num} suscriptores`,
        defaultState: true
      },
      sin_rollos: {
        baseSubs: 19,
        url: "https://www.youtube.com/@veredictofinalsinrollos",
        format: (num) => `${num} suscriptores`,
        defaultState: true
      },
      usa: {
        baseSubs: 20,
        url: "https://www.youtube.com/@veredictofinalusa",
        format: (num) => `${num} suscriptores`,
        defaultState: false
      }
    };

    Object.keys(channels).forEach(id => {
      const channel = channels[id];
      const btn = document.getElementById(`btn-subs-${id}`);
      const textSpan = document.getElementById(`subs-${id}`);

      if (!btn || !textSpan) return;

      // Read from localStorage, fallback to default state
      let isSubscribed = localStorage.getItem(`yt_sub_${id}`);
      if (isSubscribed === null) {
        isSubscribed = channel.defaultState;
        localStorage.setItem(`yt_sub_${id}`, isSubscribed);
      } else {
        isSubscribed = isSubscribed === "true";
      }

      const updateUI = () => {
        const count = channel.baseSubs + (isSubscribed ? 1 : 0);
        textSpan.textContent = channel.format(count);
        if (isSubscribed) {
          btn.textContent = "Suscrito/a";
          btn.classList.add("subscribed");
        } else {
          btn.textContent = "Suscribirse";
          btn.classList.remove("subscribed");
        }
      };

      // Set initial UI
      updateUI();

      // Click listener
      btn.addEventListener("click", () => {
        isSubscribed = !isSubscribed;
        localStorage.setItem(`yt_sub_${id}`, isSubscribed);
        updateUI();

        if (isSubscribed) {
          const chName = id === "sin_censura" ? "Veredicto Final Sin Censura" : id === "usa" ? "Veredicto Final USA" : id === "sin_filtros" ? "Veredicto Final Sin Filtros" : "Veredicto Final Sin Rollos";
          showToast("¡Suscrito!", `Te has suscrito a ${chName}.`, "success");
        } else {
          showToast("Suscripción cancelada", "Has cancelado tu suscripción local.", "info");
        }

        // Open YouTube channel in a new tab
        window.open(channel.url, "_blank");
      });
    });
  };

  const renderApp = async () => {
    renderWidgets();
    renderTrending();
    renderArticles();

    // Fetch weather dynamically in the background and update widget
    fetchLiveWeather().then(() => {
      renderWidgets();
    });
  };

  // --- INITIAL LAUNCH ---
  // Load metadata from Supabase, render layout, and fetch news
  await loadMetadata();
  renderCountrySwitcher();
  renderCategoryBar();
  initYoutubeSubscriptions();
  
  // Fetch exchange rates dynamically in the background and update widget
  fetchLiveRates().then(() => {
    renderWidgets();
  });

  // --- BROWSER BACK/FORWARD NAVIGATION LISTENER ---
  window.addEventListener("popstate", () => {
    const pathSegments = window.location.pathname.split("/").filter(Boolean);
    let selectedCountryId = null;

    for (const segment of pathSegments) {
      const matchingId = getCountryIdFromSlug(segment.toLowerCase());
      if (matchingId && state.countries.some(c => c.id === matchingId)) {
        selectedCountryId = matchingId;
        break;
      }
    }

    if (selectedCountryId && state.countries.some(c => c.id === selectedCountryId)) {
      if (state.activeCountry !== selectedCountryId) {
        state.activeCountry = selectedCountryId;
        updateCountrySliderPosition();
        
        // Update switcher active buttons visually
        document.querySelectorAll(".country-btn").forEach(b => {
          const cid = b.getAttribute("data-id");
          if (cid === state.activeCountry) {
            b.classList.add("active");
            b.setAttribute("aria-checked", "true");
          } else {
            b.classList.remove("active");
            b.setAttribute("aria-checked", "false");
          }
        });

        resetCategoryAndSearch();
        renderApp();
      }
    }
  });

  await renderApp();
});
