// Article Page Controller for Minima Infobae

document.addEventListener("DOMContentLoaded", async () => {
  // --- SUPABASE CLIENT INITIALIZATION ---
  const supabase = window.supabase.createClient(
    SUPABASE_CONFIG.SUPABASE_URL,
    SUPABASE_CONFIG.SUPABASE_ANON_KEY
  );

  // --- STATE MANAGEMENT ---
  const state = {
    articleId: new URLSearchParams(window.location.search).get("id"),
    theme: localStorage.getItem("theme") || "light",
    article: null
  };

  // --- URL SEO HELPERS ---
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

  // --- DOM SELECTORS ---
  const body = document.body;
  const themeToggleBtn = document.getElementById("theme-toggle");
  
  const articleVolanta = document.getElementById("article-volanta");
  const articleTitle = document.getElementById("article-title");
  const articleDeck = document.getElementById("article-deck");
  const articleAvatar = document.getElementById("article-avatar");
  const articleAuthor = document.getElementById("article-author");
  const articleDate = document.getElementById("article-date");
  const articleImage = document.getElementById("article-image");
  const articleBody = document.getElementById("article-body");
  const relatedList = document.getElementById("related-list");

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

  themeToggleBtn.addEventListener("click", () => {
    state.theme = state.theme === "light" ? "dark" : "light";
    applyTheme(state.theme);
  });

  // --- LOAD ARTICLE DATA ---
  const loadArticle = async () => {
    if (!state.articleId) {
      showError("No se especificó ninguna noticia para mostrar.");
      return;
    }

    try {
      const { data: article, error } = await supabase
        .from("articles")
        .select(`
          *,
          categories (
            name
          )
        `)
        .eq("id", state.articleId)
        .single();

      if (error || !article) {
        throw new Error("No se pudo encontrar la noticia seleccionada.");
      }

      state.article = article;
      
      // Canonical SEO URL redirection
      const correctSlug = generateSlug(article.title);
      const correctCountrySlug = getCountrySlug(article.country_id);
      const urlParams = new URLSearchParams(window.location.search);
      const pais = urlParams.get("pais");
      const noticia = urlParams.get("noticia");

      if (pais !== correctCountrySlug || noticia !== correctSlug) {
        const newUrl = `/article.html?pais=${correctCountrySlug}&noticia=${correctSlug}&id=${article.id}`;
        window.history.replaceState(null, "", newUrl);
      }

      renderArticle();
      loadRelatedArticles();
    } catch (err) {
      console.error(err);
      showError(err.message);
    }
  };

  const renderArticle = () => {
    const art = state.article;
    const categoryName = art.categories?.name || "General";
    const defaultImage = art.country_id === "CO" ? "/assets/colombia_hero.png" : "/assets/mexico_hero.png";

    // Set page title
    document.title = `${art.title} | Veredicto Final`;

    // Populate header info
    articleVolanta.textContent = categoryName;
    articleTitle.textContent = art.title;
    articleDeck.textContent = art.deck || "";

    // Author block
    articleAuthor.textContent = art.author || "Redacción Veredicto Final";
    articleAvatar.textContent = art.author ? art.author.trim().charAt(0) : "R";

    // Format publication date
    const rawDate = new Date(art.published_at);
    const dateFormatted = rawDate.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    articleDate.textContent = `Publicado el ${dateFormatted}`;

    // Article Media
    articleImage.src = art.image_url || defaultImage;
    articleImage.alt = art.title;

    // Body content format (paragraphs)
    const paragraphs = (art.content || "")
      .split("\n\n")
      .filter(p => p.trim() !== "")
      .map(para => `<p>${para.replace(/\n/g, "<br>")}</p>`)
      .join("");

    articleBody.innerHTML = paragraphs || "<p>Sin contenido disponible.</p>";

    // Setup social shares
    setupShareButtons(art);
  };

  const setupShareButtons = (art) => {
    const text = encodeURIComponent(art.title);
    const url = encodeURIComponent(window.location.href);
    
    document.getElementById("share-tw").href = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
    document.getElementById("share-fb").href = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    document.getElementById("share-wa").href = `https://api.whatsapp.com/send?text=${text}%20${url}`;
    
    // Copy Link button setup
    const copyBtn = document.getElementById("share-copy");
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(window.location.href)
        .then(() => {
          const originalHTML = copyBtn.innerHTML;
          copyBtn.innerHTML = '<i class="fa-solid fa-check" style="color: var(--success-color)"></i>';
          setTimeout(() => {
            copyBtn.innerHTML = originalHTML;
          }, 2000);
        })
        .catch(err => {
          console.error("Error al copiar enlace:", err);
        });
    });
  };

  // --- RELATED ARTICLES SIDEBAR ---
  const loadRelatedArticles = async () => {
    if (!state.article) return;

    try {
      const { data: related, error } = await supabase
        .from("articles")
        .select("id, title, published_at, image_url, country_id")
        .eq("country_id", state.article.country_id)
        .neq("id", state.article.id) // Exclude current article
        .order("published_at", { ascending: false })
        .limit(5);

      if (error) throw error;

      if (!related || related.length === 0) {
        relatedList.innerHTML = `<p style="font-size: 13px; color: var(--text-muted);">No hay noticias recomendadas en este momento.</p>`;
        return;
      }

      relatedList.innerHTML = related.map(art => {
        const defaultImg = art.country_id === "CO" ? "/assets/colombia_hero.png" : "/assets/mexico_hero.png";
        const rawDate = new Date(art.published_at);
        const dateStr = rawDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

        return `
          <a href="/article.html?pais=${getCountrySlug(art.country_id)}&noticia=${generateSlug(art.title)}&id=${art.id}" class="related-mini-card" style="text-decoration: none; color: inherit;">
            <div class="related-mini-img-box">
              <img src="${art.image_url || defaultImg}" alt="${art.title}" class="related-mini-img">
            </div>
            <div class="related-mini-content">
              <span class="related-mini-title">${art.title}</span>
              <span class="related-mini-date">${dateStr}</span>
            </div>
          </a>
        `;
      }).join("");
    } catch (err) {
      console.error("Error al cargar artículos recomendados:", err);
      relatedList.innerHTML = `<p style="font-size: 12px; color: var(--text-muted);">Error al cargar recomendaciones.</p>`;
    }
  };

  const showError = (message) => {
    articleTitle.textContent = "Error";
    articleDeck.textContent = "";
    articleVolanta.textContent = "Error";
    articleBody.innerHTML = `
      <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
        <i class="fa-solid fa-triangle-exclamation" style="font-size: 48px; color: var(--accent-orange); margin-bottom: 20px;"></i>
        <h3>Ups, algo salió mal</h3>
        <p style="margin-top: 10px;">${message}</p>
        <a href="index.html" class="category-pill" style="display: inline-block; margin-top: 24px; border: 1px solid var(--border-color);">Volver a la Portada</a>
      </div>
    `;
    relatedList.innerHTML = "";
  };

  // Launch article loading
  loadArticle();
});
