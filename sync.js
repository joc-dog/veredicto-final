import 'dotenv/config';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import { XMLParser } from 'fast-xml-parser';

// Retrieve credentials
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ ERROR: Faltan las variables SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el archivo .env.');
  console.log('Copia .env.example a .env y rellena tus credenciales de Supabase.');
  process.exit(1);
}

// Initialize Supabase admin client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Helper helper to clean html strings
function cleanHTML(htmlStr) {
  if (!htmlStr) return '';
  return htmlStr
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')   // Remove styles
    .trim();
}

// Classifier function to resolve dynamic categories from URL and Keywords
function classifyArticle(title, deck, content, url, categoryMap, defaultCategoryId) {
  const textToAnalyze = `${title} ${deck} ${content} ${url}`.toLowerCase();
  
  // 1. Analyze URL segments first (highest priority)
  if (url.includes('/deportes/')) return categoryMap['deportes'];
  if (url.includes('/teleshow/') || url.includes('/entretenimiento/')) return categoryMap['entretenimiento'];
  if (url.includes('/tecno/') || url.includes('/tecnologia/')) return categoryMap['tecnologia'];
  if (url.includes('/economia/') || url.includes('/negocios/')) return categoryMap['economia'];
  if (url.includes('/politica/')) return categoryMap['politica'];

  // 2. Pre-exclude lottery, crime, complaints, and accidents to keep them in General (Sucesos/Judicial/Servicios)
  const lotteryRegex = /\b(loteria|lotería|sorteo|chance|chontico|baloto|ganadora|ganador|premios|premio mayor)\b/i;
  if (lotteryRegex.test(textToAnalyze)) {
    return defaultCategoryId;
  }

  // Expanded crime regex (includes robbery, assault, arrests, court, police)
  const crimeRegex = /\b(asesinato|homicidio|asesinado|asesinada|crimen|crímenes|crimenes|sicario|sicariato|sicarial|secuestro|violación|violacion|abuso sexual|abuso|muerto|muertos|falleció|fallecio|cadáver|cadaver|defunción|defuncion|masacre|ladrón|ladron|ladrones|robo|robó|robos|asalto|asaltaron|delincuente|delincuentes|linchamiento|linchado|golpeado|captura|capturado|capturada|policía|policia|fiscalía|fiscalia|juez|jueza|víctima|victima|víctimas|victimas|agresor|agresión|agresion)\b/i;
  if (crimeRegex.test(textToAnalyze)) {
    return defaultCategoryId;
  }

  // Accident, disasters and emergencies regex
  const accidentRegex = /\b(accidente|choque|estrelló|estrello|tránsito|transito|incendio|inundación|inundacion|sismo|temblor|terremoto|deslave|derrubio|derrumbes|desastre|emergencia)\b/i;
  if (accidentRegex.test(textToAnalyze)) {
    return defaultCategoryId;
  }

  // Citizen complaints and public alerts regex
  const complaintRegex = /\b(denunció|denuncio|denuncia|denuncias|queja|reclamación|reclamacion|polémica|polemica|indignación|indignacion|alerta)\b/i;
  if (complaintRegex.test(textToAnalyze)) {
    return defaultCategoryId;
  }

  // 3. Regex-based keyword matching (with word boundaries)
  const categoryRegexes = {
    deportes: /\b(fútbol|futbol|ciclismo|gol|goles|mundial|olímpicos|olimpicos|campeonato|torneo|atleta|atletas|podio|copa|entrenador|goleador|estadio|cancha|juegos olímpicos|la liga|central de|rosario central|river plate|boca juniors|medalla|medallas|clavados)\b/i,
    
    politica: /\b(gobierno|presidencia|senado|congreso|diputado|diputada|electoral|voto|votación|votacion|reforma|reformas|sánchez|sanchez|vox|partido político|partido politico|senador|senadora|canciller|gabinete|democracia|democrático|pacto histórico|pacto historico|gobernación|gobernacion)\b/i,
    
    economia: /\b(peso|pesos|dólar|dolar|dólares|dolares|remesas|exportaciones|exportación|exportacion|inflación|inflacion|tasa|tasas|interés|interes|intereses|banco|bancos|comercio|mercado|mercados|finanzas|pib|arancel|aranceles|usd|cop|mxn|bursátil|bursatil|divisas|acciones|bolsa de valores|bancolombia|nequi|daviplata|fintech|bancario|bancaria|entidad financiera|entidades financieras)\b/i,
    
    tecnologia: /\b(inteligencia artificial|tecnológica|tecnológico|tecnologia|tecnología|dispositivo|dispositivos|sensor|sensores|aplicación|aplicacion|aplicaciones|software|ia|científicos|cientificos|científico|cientifico|digital|digitales|celular|celulares|computación|computacion|laboratorio|laboratorios|robótica|robotica|deep learning|cuántico|cuantica|chip|chips|biomédico|biomedico)\b/i,
    
    entretenimiento: /\b(cine|película|pelicula|películas|peliculas|mariachi|música|musica|musical|baile|bailarina|bailarín|bailarin|actor|actriz|estreno|estrenos|cantante|cantantes|concierto|conciertos|show|shows|teatro|festival|festivales|arte|espectáculo|espectaculo|espectáculos|espectaculos|rulos|estilo|look|looks|cabello|pelazo|folklore|cultura|bellas artes|series|novela|novelas|teleshow|pareja|noviazgo|romance|farándula|farandula|chisme|celebridad|celebridades|gossip)\b/i
  };

  const scores = { deportes: 0, politica: 0, economia: 0, tecnologia: 0, entretenimiento: 0 };

  // Count matches using regex
  for (const [cat, regex] of Object.entries(categoryRegexes)) {
    const globalRegex = new RegExp(regex.source, 'gi');
    const allMatches = textToAnalyze.match(globalRegex);
    scores[cat] = allMatches ? allMatches.length : 0;
  }

  // Find category with highest score
  let maxScore = 0;
  let bestCategory = defaultCategoryId;

  for (const [cat, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      bestCategory = categoryMap[cat];
    }
  }

  return bestCategory;
}

async function runSync() {
  console.log('🔄 Iniciando sincronización de noticias...');

  try {
    // 1. Fetch categories to map them dynamically
    const { data: dbCategories, error: catError } = await supabase
      .from('categories')
      .select('*');

    if (catError) throw catError;

    // Map: Category name/slug -> ID
    const categoryMap = {};
    let defaultCategoryId = null;

    dbCategories.forEach(cat => {
      categoryMap[cat.name.toLowerCase()] = cat.id;
      categoryMap[cat.slug.toLowerCase()] = cat.id;
      if (cat.name.toLowerCase() === 'general') {
        defaultCategoryId = cat.id;
      }
    });

    // 2. Fetch active RSS feeds
    const { data: feeds, error: feedsError } = await supabase
      .from('rss_feeds')
      .select('*')
      .eq('is_active', true);

    if (feedsError) throw feedsError;

    if (!feeds || feeds.length === 0) {
      console.log('⚠️ No hay canales RSS activos en la base de datos.');
      return;
    }

    const xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_'
    });

    for (const feed of feeds) {
      console.log(`🌐 Procesando feed del país [${feed.country_id}]: ${feed.url}`);
      
      try {
        const response = await fetch(feed.url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const xmlText = await response.text();
        const parsed = xmlParser.parse(xmlText);
        
        const channel = parsed.rss?.channel;
        const items = channel?.item || [];
        
        // Ensure items is an array (case where there is only one item)
        const itemsArray = Array.isArray(items) ? items : [items];
        
        console.log(`📑 Encontrados ${itemsArray.length} artículos en el RSS.`);
        
        const articlesToUpsert = [];
        
        for (const item of itemsArray) {
          // A. Guid resolution
          let guid = '';
          if (item.guid) {
            guid = typeof item.guid === 'object' ? item.guid['#text'] || item.guid['@_isPermaLink'] : item.guid;
          }
          if (!guid) {
            guid = item.link;
          }
          
          if (!guid) continue; // Skip if no unique identifier is resolved
          
          // B. Title and Link
          const title = item.title || '';
          const link = item.link || '';
          
          // C. Deck (description) and Content
          const deck = cleanHTML(item.description || '');
          let content = cleanHTML(item['content:encoded'] || item.description || '');
          
          // Remove duplicate lead images or figures from body content
          content = content
            .replace(/<figure\b[^<]*(?:(?!<\/figure>)<[^<]*)*<\/figure>/gi, '')
            .replace(/<img\b[^>]*>/gi, '')
            .trim();
          
          // D. Date and Author
          const published_at = item.pubDate ? new Date(item.pubDate) : new Date();
          const author = item['dc:creator'] || item.author || 'Redacción Infobae';
          
          // E. Image extraction (Handles media:content attributes or enclosures)
          let image_url = null;
          
          const mediaContent = item['media:content'];
          if (mediaContent) {
            if (Array.isArray(mediaContent)) {
              // Find the first image medium or default to the first element
              const imageMedia = mediaContent.find(media => media['@_medium'] === 'image');
              image_url = imageMedia ? imageMedia['@_url'] : mediaContent[0]['@_url'];
            } else {
              image_url = mediaContent['@_url'];
            }
          }
          
          if (!image_url && item.enclosure) {
            image_url = Array.isArray(item.enclosure) ? item.enclosure[0]['@_url'] : item.enclosure['@_url'];
          }
          
          // F. Category Resolution (Dynamic classification based on URL and Keyword matching)
          const categoryId = feed.category_id || classifyArticle(
            title, 
            deck, 
            content, 
            link, 
            categoryMap, 
            defaultCategoryId
          );
          
          // G. Determine if article is trending (mock criteria: has specific tag or randomly select 20% for demo realism)
          const trending = Math.random() < 0.25; 
          
          articlesToUpsert.push({
            guid,
            country_id: feed.country_id,
            category_id: categoryId,
            title,
            deck,
            content,
            link,
            image_url,
            author,
            published_at,
            trending
          });
        }
        
        // Upsert batch to Supabase
        if (articlesToUpsert.length > 0) {
          const { error: upsertError } = await supabase
            .from('articles')
            .upsert(articlesToUpsert, { onConflict: 'guid' });
            
          if (upsertError) {
            console.error('❌ Error guardando artículos en Supabase:', upsertError);
          } else {
            console.log(`✅ Sincronizados exitosamente ${articlesToUpsert.length} artículos.`);
          }
        }
        
        // Update feed sync timestamp
        await supabase
          .from('rss_feeds')
          .update({ last_fetched_at: new Date().toISOString() })
          .eq('id', feed.id);
          
      } catch (feedErr) {
        console.error(`❌ Error procesando el canal RSS:`, feedErr);
      }
    }
    
    console.log('🎉 Sincronización completada con éxito.');

    // Auto-generate fresh sitemap.xml
    await generateDynamicSitemap();
  } catch (err) {
    console.error('❌ ERROR CRÍTICO durante la ejecución:', err);
  }
}

async function generateDynamicSitemap() {
  try {
    const { data: latestArticles, error } = await supabase
      .from('articles')
      .select('id, title, country_id, image_url, published_at')
      .order('published_at', { ascending: false })
      .limit(100);

    if (error || !latestArticles) return;

    const slugs = { CO: 'colombia', MX: 'mexico', US: 'usa', ES: 'espana' };
    const generateSlug = (t) => t.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-").substring(0, 60);
    const escapeXML = (str) => (!str ? '' : str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;'));

    let sitemapXML = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;
    
    // Static main routes
    sitemapXML += `  <url>\n    <loc>https://veredictofinal.com/</loc>\n    <changefreq>always</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
    sitemapXML += `  <url>\n    <loc>https://veredictofinal.com/colombia/</loc>\n    <changefreq>hourly</changefreq>\n    <priority>0.9</priority>\n    <xhtml:link rel="alternate" hreflang="es-CO" href="https://veredictofinal.com/colombia/"/>\n  </url>\n`;
    sitemapXML += `  <url>\n    <loc>https://veredictofinal.com/mexico/</loc>\n    <changefreq>hourly</changefreq>\n    <priority>0.9</priority>\n    <xhtml:link rel="alternate" hreflang="es-MX" href="https://veredictofinal.com/mexico/"/>\n  </url>\n`;
    sitemapXML += `  <url>\n    <loc>https://veredictofinal.com/usa/</loc>\n    <changefreq>hourly</changefreq>\n    <priority>0.9</priority>\n    <xhtml:link rel="alternate" hreflang="es-US" href="https://veredictofinal.com/usa/"/>\n  </url>\n`;
    sitemapXML += `  <url>\n    <loc>https://veredictofinal.com/espana/</loc>\n    <changefreq>hourly</changefreq>\n    <priority>0.9</priority>\n    <xhtml:link rel="alternate" hreflang="es-ES" href="https://veredictofinal.com/espana/"/>\n  </url>\n`;

    // Dynamic recent news articles
    for (const art of latestArticles) {
      const countrySlug = slugs[art.country_id] || 'colombia';
      const newsSlug = generateSlug(art.title);
      const articleUrl = `https://veredictofinal.com/article.html?pais=${countrySlug}&amp;noticia=${newsSlug}&amp;id=${art.id}`;
      const pubDate = new Date(art.published_at).toISOString();
      const imageTag = art.image_url ? `\n    <image:image>\n      <image:loc>${escapeXML(art.image_url)}</image:loc>\n    </image:image>` : '';

      sitemapXML += `  <url>\n    <loc>${articleUrl}</loc>\n    <lastmod>${pubDate}</lastmod>\n    <changefreq>never</changefreq>\n    <priority>0.8</priority>${imageTag}\n  </url>\n`;
    }

    sitemapXML += `</urlset>`;

    fs.writeFileSync('sitemap.xml', sitemapXML, 'utf8');
    console.log(`🗺️ Sitemap generado exitosamente con ${latestArticles.length} noticias.`);
  } catch (err) {
    console.error('Error generando sitemap:', err);
  }
}

runSync();
