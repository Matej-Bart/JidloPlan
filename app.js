// ════════════════════════════════════════════════
//  JidloPlan – app.js
//  Spoonacular REST API + localStorage + PWA
// ════════════════════════════════════════════════

// ── Konfigurace API ──────────────────────────────
const API_BASE = "https://api.spoonacular.com";
const API_KEY  = "0b68acfc620348db9dfafa5950250b1f";

// ── Klíče pro localStorage ───────────────────────
const STORAGE_KEYS = {
  favorites:    "jidlplan:favorites",
  plan:         "jidlplan:weekly-plan",
  customItems:  "jidlplan:custom-shopping",
  checkedItems: "jidlplan:checked-shopping",
};

// ── Konstanty aplikace ───────────────────────────
const DAYS  = ["Pondělí", "Úterý", "Středa", "Čtvrtek", "Pátek", "Sobota", "Neděle"];
const SLOTS = [
  { id: "breakfast", label: "Snídaně" },
  { id: "lunch",     label: "Oběd"    },
  { id: "dinner",    label: "Večeře"  },
];

const CUISINES = [
  "African", "American", "British", "Chinese", "French",
  "Greek", "Indian", "Italian", "Japanese", "Korean",
  "Mediterranean", "Mexican", "Middle Eastern", "Spanish", "Thai",
];

// ── Lokální záložní recepty (při výpadku API) ────
const FALLBACK_RECIPES = [
  {
    idMeal: "local-1",
    strMeal: "Kuřecí těstoviny se zeleninou",
    strMealThumb: "assets/icon.svg",
    strArea: "Domácí",
    strCategory: "Chicken",
    strInstructions: "Uvař těstoviny podle návodu. Na pánvi opeč kuřecí maso, přidej papriku, rajčata a trochu smetany. Smíchej s těstovinami a dochuť solí, pepřem a bylinkami.",
    strIngredient1: "kuřecí prsa", strMeasure1: "400 g",
    strIngredient2: "těstoviny",   strMeasure2: "300 g",
    strIngredient3: "paprika",     strMeasure3: "1 ks",
    strIngredient4: "rajčata",     strMeasure4: "2 ks",
    strIngredient5: "smetana",     strMeasure5: "150 ml",
  },
  {
    idMeal: "local-2",
    strMeal: "Rajčatová polévka",
    strMealThumb: "assets/icon.svg",
    strArea: "Italské",
    strCategory: "Starter",
    strInstructions: "Na oleji osmahni cibuli a česnek, přidej rajčata a vývar. Vař přibližně 20 minut, rozmixuj a dochuť bazalkou. Podávej s pečivem.",
    strIngredient1: "rajčata v plechovce", strMeasure1: "2 plechovky",
    strIngredient2: "cibule",              strMeasure2: "1 ks",
    strIngredient3: "česnek",              strMeasure3: "2 stroužky",
    strIngredient4: "zeleninový vývar",    strMeasure4: "500 ml",
    strIngredient5: "bazalka",             strMeasure5: "1 hrst",
  },
  {
    idMeal: "local-3",
    strMeal: "Rýže s tuňákem a vejcem",
    strMealThumb: "assets/icon.svg",
    strArea: "Rychlé",
    strCategory: "Seafood",
    strInstructions: "Uvař rýži a vejce. Tuňáka smíchej s kukuřicí, rýží a trochou jogurtu. Přidej vejce, osol, opepři a podávej jako rychlý oběd.",
    strIngredient1: "rýže",        strMeasure1: "250 g",
    strIngredient2: "tuňák",       strMeasure2: "1 plechovka",
    strIngredient3: "vejce",       strMeasure3: "2 ks",
    strIngredient4: "kukuřice",    strMeasure4: "1 malá plechovka",
    strIngredient5: "bílý jogurt", strMeasure5: "2 lžíce",
  },
  {
    idMeal: "local-4",
    strMeal: "Ovesná snídaně s ovocem",
    strMealThumb: "assets/icon.svg",
    strArea: "Snídaně",
    strCategory: "Breakfast",
    strInstructions: "Ovesné vločky krátce povař v mléce. Přidej med, ovoce a ořechy. Hotovou kaši můžeš uložit do krabičky i na další den.",
    strIngredient1: "ovesné vločky", strMeasure1: "80 g",
    strIngredient2: "mléko",         strMeasure2: "250 ml",
    strIngredient3: "banán",         strMeasure3: "1 ks",
    strIngredient4: "med",           strMeasure4: "1 lžíce",
    strIngredient5: "ořechy",        strMeasure5: "1 hrst",
  },
];

// ── Stav aplikace (data která se mění za běhu) ───
const state = {
  recipes:      [],
  selectedRecipe: null,
  favorites:    loadStorage(STORAGE_KEYS.favorites,    []),
  plan:         loadStorage(STORAGE_KEYS.plan,         createEmptyPlan()),
  customItems:  loadStorage(STORAGE_KEYS.customItems,  []),
  checkedItems: loadStorage(STORAGE_KEYS.checkedItems, []),
};

// ── Zkratky pro HTML elementy ────────────────────
const elements = {
  searchForm:       document.querySelector("#searchForm"),
  searchInput:      document.querySelector("#searchInput"),
  categorySelect:   document.querySelector("#categorySelect"),
  randomButton:     document.querySelector("#randomButton"),
  recipeGrid:       document.querySelector("#recipeGrid"),
  recipeCount:      document.querySelector("#recipeCount"),
  favoriteCount:    document.querySelector("#favoriteCount"),
  plannedCount:     document.querySelector("#plannedCount"),
  messageBox:       document.querySelector("#messageBox"),
  plannerGrid:      document.querySelector("#plannerGrid"),
  favoritesList:    document.querySelector("#favoritesList"),
  shoppingList:     document.querySelector("#shoppingList"),
  recipeDialog:     document.querySelector("#recipeDialog"),
  recipeDetail:     document.querySelector("#recipeDetail"),
  closeDialogButton:document.querySelector("#closeDialogButton"),
  clearPlanButton:  document.querySelector("#clearPlanButton"),
  customItemForm:   document.querySelector("#customItemForm"),
  customItemInput:  document.querySelector("#customItemInput"),
  recipeTemplate:   document.querySelector("#recipeCardTemplate"),
};

// ════════════════════════════════════════════════
//  INICIALIZACE
// ════════════════════════════════════════════════

document.addEventListener("DOMContentLoaded", initApp);

async function initApp() {
  bindEvents();
  loadCategoryOptions();

  // Zobraz záložní recepty než doběhne API
  state.recipes = FALLBACK_RECIPES;
  renderRecipes();
  renderPlanner();
  renderFavorites();
  renderShoppingList();
  updateStats();
  // Načti reálné recepty z API
  await searchRecipes("chicken");
}

// ════════════════════════════════════════════════
//  UDÁLOSTI (event listeners)
// ════════════════════════════════════════════════

function bindEvents() {
  // Odeslání vyhledávacího formuláře
  elements.searchForm.addEventListener("submit", function (event) {
    event.preventDefault();
    searchRecipes(elements.searchInput.value.trim());
  });

  // Změna kategorie v selectu
  elements.categorySelect.addEventListener("change", function () {
    const category = elements.categorySelect.value;
    if (category) {
      loadCategory(category);
    } else {
      searchRecipes(elements.searchInput.value.trim() || "chicken");
    }
  });

  elements.randomButton.addEventListener("click", loadRandomRecipe);

  // Zavření dialogu tlačítkem nebo kliknutím mimo dialog
  elements.closeDialogButton.addEventListener("click", function () {
    elements.recipeDialog.close();
  });
  elements.recipeDialog.addEventListener("click", function (event) {
    if (event.target === elements.recipeDialog) {
      elements.recipeDialog.close();
    }
  });

  elements.clearPlanButton.addEventListener("click", clearPlan);

  // Přidání vlastní položky do nákupního seznamu
  elements.customItemForm.addEventListener("submit", function (event) {
    event.preventDefault();
    addCustomShoppingItem(elements.customItemInput.value.trim());
  });
}

// ════════════════════════════════════════════════
//  KOMUNIKACE S API
// ════════════════════════════════════════════════

// Načte data ze Spoonacular API a vrátí je jako objekt
async function apiGet(endpoint) {
  const separator = endpoint.includes("?") ? "&" : "?";
  const url = `${API_BASE}/${endpoint}${separator}apiKey=${API_KEY}`;

  // AbortController umožňuje přerušit fetch po 8 sekundách
  const controller = new AbortController();
  const timeoutId  = window.setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    window.clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
  } catch (error) {
    window.clearTimeout(timeoutId);
    throw new Error("API není momentálně dostupné.");
  }
}

// Převede Spoonacular formát dat na interní formát aplikace
function normalizeMeal(meal) {
  if (!meal) return null;

  const recipe = {
    idMeal:          String(meal.id),
    strMeal:         meal.title || "",
    strMealThumb:    meal.image || "assets/icon.svg",
    strArea:         meal.cuisines?.[0] || "",
    strCategory:     meal.dishTypes?.[0] || "",
    strInstructions: meal.instructions
      ? meal.instructions.replace(/<[^>]*>/g, "").trim()
      : "",
  };

  // Přidej ingredience jako strIngredient1, strMeasure1, atd.
  if (Array.isArray(meal.extendedIngredients)) {
    meal.extendedIngredients.slice(0, 20).forEach(function (ing, index) {
      const i = index + 1;
      const amount = ing.measures?.metric?.amount
        ? `${Math.round(ing.measures.metric.amount * 10) / 10} ${ing.measures.metric.unitShort || ""}`.trim()
        : "";
      recipe[`strIngredient${i}`] = ing.nameClean || ing.name || "";
      recipe[`strMeasure${i}`]    = amount;
    });
  }

  return recipe;
}

// ── Vyhledávání a načítání receptů ──────────────

async function searchRecipes(query) {
  const safeQuery = query || "chicken";
  setLoading(true);
  elements.searchInput.value   = safeQuery;
  elements.categorySelect.value = "";

  try {
    const data = await apiGet(
      `recipes/complexSearch?query=${encodeURIComponent(safeQuery)}&number=12&addRecipeInformation=true`
    );
    state.recipes = (data.results || []).map(normalizeMeal);
    renderRecipes();

    if (state.recipes.length === 0) {
      showMessage(`Pro "${safeQuery}" se nenašly žádné recepty.`);
    } else {
      elements.messageBox.hidden = true;
    }
  } catch (error) {
    // API selhalo – zobraz záložní recepty
    state.recipes = findFallbackRecipes(safeQuery);
    renderRecipes();
    showMessage("Externí API není dostupné, zobrazuji lokální ukázkové recepty.");
  } finally {
    setLoading(false);
  }
}

async function loadCategory(category) {
  setLoading(true);

  try {
    const data = await apiGet(
      `recipes/complexSearch?cuisine=${encodeURIComponent(category)}&number=12&addRecipeInformation=true`
    );
    state.recipes = (data.results || []).map(normalizeMeal).filter(Boolean);
    renderRecipes();
    elements.messageBox.hidden = true;
  } catch (error) {
    state.recipes = FALLBACK_RECIPES.filter(function (r) { return r.strCategory === category; });
    renderRecipes();
    showMessage("Externí API není dostupné, zobrazuji lokální recepty z vybrané kategorie.");
  } finally {
    setLoading(false);
  }
}

async function loadRandomRecipe() {
  setLoading(true);

  try {
    const data = await apiGet("recipes/random?number=12");
    state.recipes = (data.recipes || []).map(normalizeMeal);
    renderRecipes();
    if (state.recipes[0]) {
      openRecipeDetail(state.recipes[0].idMeal);
    }
  } catch (error) {
    const randomIndex = Math.floor(Math.random() * FALLBACK_RECIPES.length);
    state.recipes = [FALLBACK_RECIPES[randomIndex]];
    renderRecipes();
    openRecipeDetail(state.recipes[0].idMeal);
    showMessage("Externí API není dostupné, vybral jsem náhodný lokální recept.");
  } finally {
    setLoading(false);
  }
}

// Načte detail jednoho receptu podle ID
async function fetchMealDetail(id) {
  if (id.startsWith("local-")) {
    return FALLBACK_RECIPES.find(function (r) { return r.idMeal === id; }) || null;
  }

  try {
    const data = await apiGet(`recipes/${encodeURIComponent(id)}/information`);
    return normalizeMeal(data);
  } catch {
    return null;
  }
}

// ════════════════════════════════════════════════
//  RECEPTY – vykreslení
// ════════════════════════════════════════════════

function renderRecipes() {
  elements.recipeGrid.innerHTML = "";

  state.recipes.forEach(function (recipe) {
    // Klonuj šablonu z HTML a vyplň daty
    const card          = elements.recipeTemplate.content.cloneNode(true);
    const article       = card.querySelector(".recipe-card");
    const image         = card.querySelector("img");
    const meta          = card.querySelector(".recipe-meta");
    const title         = card.querySelector("h3");
    const detailButton  = card.querySelector('[data-action="detail"]');
    const favoriteButton= card.querySelector('[data-action="favorite"]');

    article.dataset.id   = recipe.idMeal;
    image.src            = recipe.strMealThumb;
    image.alt            = recipe.strMeal;
    meta.textContent     = [recipe.strArea, recipe.strCategory].filter(Boolean).join(" • ");
    title.textContent    = recipe.strMeal;

    updateFavoriteButton(favoriteButton, recipe.idMeal);
    detailButton.addEventListener("click",   function () { openRecipeDetail(recipe.idMeal); });
    favoriteButton.addEventListener("click", function () { toggleFavorite(recipe); });

    elements.recipeGrid.append(card);
  });

  updateStats();
}

// Otevře detail receptu v dialogovém okně
async function openRecipeDetail(id) {
  // Zkus najít recept v datech která už máme
  let recipe = findKnownRecipe(id);

  // Pokud nemáme instrukce, dohledej detail z API
  if (!recipe || !recipe.strInstructions) {
    recipe = await fetchMealDetail(id);
  }

  if (!recipe) {
    showMessage("Detail receptu se nepodařilo načíst.");
    return;
  }

  state.selectedRecipe = recipe;
  const ingredients    = getIngredients(recipe);

  const dayOptions  = DAYS.map(function (day)   { return `<option value="${day}">${day}</option>`; }).join("");
  const slotOptions = SLOTS.map(function (slot)  { return `<option value="${slot.id}">${slot.label}</option>`; }).join("");
  const ingredientItems = ingredients.map(function (item) { return `<li>${escapeHtml(item)}</li>`; }).join("");

  elements.recipeDetail.innerHTML = `
    <div class="detail-layout">
      <img src="${recipe.strMealThumb}" alt="${escapeHtml(recipe.strMeal)}" />
      <div class="detail-body">
        <p class="eyebrow">Detail receptu</p>
        <h2>${escapeHtml(recipe.strMeal)}</h2>
        <div class="detail-tags">${escapeHtml([recipe.strArea, recipe.strCategory].filter(Boolean).join(" • "))}</div>
        <div class="plan-form">
          <label>Den   <select id="planDaySelect">${dayOptions}</select></label>
          <label>Jídlo <select id="planSlotSelect">${slotOptions}</select></label>
          <button id="addToPlanButton" type="button">Naplánovat</button>
        </div>
        <h3>Suroviny</h3>
        <ul class="ingredient-list">${ingredientItems}</ul>
        <h3>Postup</h3>
        <p class="instructions">${escapeHtml(recipe.strInstructions || "Postup není u receptu uveden.")}</p>
      </div>
    </div>
  `;

  elements.recipeDetail.querySelector("#addToPlanButton").addEventListener("click", function () {
    const day  = elements.recipeDetail.querySelector("#planDaySelect").value;
    const slot = elements.recipeDetail.querySelector("#planSlotSelect").value;
    addRecipeToPlan(recipe, day, slot);
  });

  elements.recipeDialog.showModal();
}

// ════════════════════════════════════════════════
//  OBLÍBENÉ RECEPTY
// ════════════════════════════════════════════════

function toggleFavorite(recipe) {
  const alreadySaved = state.favorites.some(function (r) { return r.idMeal === recipe.idMeal; });

  if (alreadySaved) {
    // Odeber z oblíbených
    state.favorites = state.favorites.filter(function (r) { return r.idMeal !== recipe.idMeal; });
  } else {
    // Přidej do oblíbených (uložíme jen potřebná data)
    state.favorites.push(simplifyRecipe(recipe));
  }

  saveStorage(STORAGE_KEYS.favorites, state.favorites);
  renderRecipes();
  renderFavorites();
  updateStats();
}

function renderFavorites() {
  elements.favoritesList.innerHTML = "";

  if (state.favorites.length === 0) {
    elements.favoritesList.innerHTML = `<p class="empty-list">Zatím nemáš uložený žádný recept.</p>`;
    return;
  }

  state.favorites.forEach(function (recipe) {
    const item = document.createElement("div");
    item.className = "mini-list-item";
    item.innerHTML = `
      <img src="${recipe.strMealThumb}" alt="${escapeHtml(recipe.strMeal)}" />
      <strong>${escapeHtml(recipe.strMeal)}</strong>
      <button type="button">Detail</button>
    `;
    item.querySelector("button").addEventListener("click", function () {
      openRecipeDetail(recipe.idMeal);
    });
    elements.favoritesList.append(item);
  });
}

// Aktualizuje ikonku hvězdičky na kartě receptu
function updateFavoriteButton(button, id) {
  const isFavorite = state.favorites.some(function (r) { return r.idMeal === id; });
  button.textContent = isFavorite ? "★" : "☆";
  button.classList.toggle("is-active", isFavorite);
  button.setAttribute("aria-label", isFavorite ? "Odebrat z oblíbených" : "Přidat do oblíbených");
}

// ════════════════════════════════════════════════
//  TÝDENNÍ PLÁN
// ════════════════════════════════════════════════

function addRecipeToPlan(recipe, day, slot) {
  state.plan[day][slot] = simplifyRecipe(recipe, true); // true = ulož i ingredience
  saveStorage(STORAGE_KEYS.plan, state.plan);
  renderPlanner();
  renderShoppingList();
  updateStats();
  elements.recipeDialog.close();
}

function removeFromPlan(day, slot) {
  state.plan[day][slot] = null;
  saveStorage(STORAGE_KEYS.plan, state.plan);
  renderPlanner();
  renderShoppingList();
  updateStats();
}

function clearPlan() {
  state.plan         = createEmptyPlan();
  state.checkedItems = [];
  saveStorage(STORAGE_KEYS.plan,         state.plan);
  saveStorage(STORAGE_KEYS.checkedItems, state.checkedItems);
  renderPlanner();
  renderShoppingList();
  updateStats();
}

function renderPlanner() {
  elements.plannerGrid.innerHTML = "";

  DAYS.forEach(function (day) {
    const column = document.createElement("article");
    column.className = "day-column";
    column.innerHTML = `<h3>${day}</h3>`;

    SLOTS.forEach(function (slot) {
      const recipe      = state.plan[day]?.[slot.id];
      const slotElement = document.createElement("div");
      slotElement.className = "meal-slot";
      slotElement.innerHTML = `<span>${slot.label}</span>`;

      if (recipe) {
        slotElement.innerHTML += `
          <div class="planned-meal">
            <img src="${recipe.strMealThumb}" alt="${escapeHtml(recipe.strMeal)}" />
            <strong>${escapeHtml(recipe.strMeal)}</strong>
            <button type="button" aria-label="Odebrat">×</button>
          </div>
        `;
        slotElement.querySelector("button").addEventListener("click", function () {
          removeFromPlan(day, slot.id);
        });
      } else {
        slotElement.innerHTML += `<p class="empty-slot">Volné místo</p>`;
      }

      column.append(slotElement);
    });

    elements.plannerGrid.append(column);
  });
}

// ════════════════════════════════════════════════
//  NÁKUPNÍ SEZNAM
// ════════════════════════════════════════════════

function renderShoppingList() {
  elements.shoppingList.innerHTML = "";

  // Ingredience z naplánovaných receptů
  const plannedIngredients = collectPlannedIngredients();
  // Ručně přidané položky
  const customItems = state.customItems;

  if (plannedIngredients.length === 0 && customItems.length === 0) {
    elements.shoppingList.innerHTML = `<p class="empty-list">Nákupní seznam se vytvoří po přidání receptu do plánu.</p>`;
    return;
  }

  // Vykresli ingredience z plánu
  plannedIngredients.forEach(function (text) {
    renderShoppingItem(text, false);
  });

  // Vykresli ručně přidané položky
  customItems.forEach(function (text) {
    renderShoppingItem(text, true);
  });
}

// Vykreslí jednu položku nákupního seznamu
function renderShoppingItem(text, isCustom) {
  const itemKey   = normalizeItem(text);
  const isChecked = state.checkedItems.includes(itemKey);

  const item = document.createElement("label");
  item.className = `shopping-item ${isChecked ? "is-done" : ""}`;
  item.innerHTML = `
    <input type="checkbox" ${isChecked ? "checked" : ""} />
    <span>${escapeHtml(text)}</span>
    ${isCustom
      ? `<button type="button" aria-label="Odebrat položku">×</button>`
      : `<span aria-hidden="true"></span>`}
  `;

  item.querySelector("input").addEventListener("change", function (event) {
    toggleCheckedItem(itemKey, event.target.checked);
  });

  if (isCustom) {
    item.querySelector("button").addEventListener("click", function (event) {
      event.preventDefault();
      removeShoppingItem(text);
    });
  }

  elements.shoppingList.append(item);
}

function addCustomShoppingItem(text) {
  if (!text) return;
  // Přidej jen pokud ještě neexistuje
  if (!state.customItems.includes(text)) {
    state.customItems.push(text);
  }
  elements.customItemInput.value = "";
  saveStorage(STORAGE_KEYS.customItems, state.customItems);
  renderShoppingList();
}

function removeShoppingItem(text) {
  const itemKey = normalizeItem(text);
  state.customItems  = state.customItems.filter(function (i) { return i !== text; });
  state.checkedItems = state.checkedItems.filter(function (i) { return i !== itemKey; });
  saveStorage(STORAGE_KEYS.customItems,  state.customItems);
  saveStorage(STORAGE_KEYS.checkedItems, state.checkedItems);
  renderShoppingList();
}

function toggleCheckedItem(key, checked) {
  if (checked) {
    // Přidej klíč do zaškrtnutých (pokud tam ještě není)
    if (!state.checkedItems.includes(key)) {
      state.checkedItems.push(key);
    }
  } else {
    // Odeber klíč ze zaškrtnutých
    state.checkedItems = state.checkedItems.filter(function (i) { return i !== key; });
  }
  saveStorage(STORAGE_KEYS.checkedItems, state.checkedItems);
  renderShoppingList();
}

// Projde celý plán a sesbírá všechny ingredience ze všech receptů
function collectPlannedIngredients() {
  const allIngredients = [];

  for (const day of DAYS) {
    for (const slot of SLOTS) {
      const recipe = state.plan[day]?.[slot.id];
      if (recipe && recipe.ingredients) {
        for (const ingredient of recipe.ingredients) {
          allIngredients.push(ingredient);
        }
      }
    }
  }

  // Odstraň duplicity, prázdné řetězce a seřaď abecedně
  const unique = [...new Set(allIngredients.map(function (i) { return i.trim(); }).filter(Boolean))];
  return unique.sort(function (a, b) { return a.localeCompare(b, "cs"); });
}

// ════════════════════════════════════════════════
//  POMOCNÉ FUNKCE
// ════════════════════════════════════════════════

// Naplní select se seznamem kuchyní (categories)
function loadCategoryOptions() {
  CUISINES.forEach(function (name) {
    const option = document.createElement("option");
    option.value       = name;
    option.textContent = name;
    elements.categorySelect.append(option);
  });
}

// Zkusí najít recept v datech která aplikace již má v paměti
function findKnownRecipe(id) {
  // Hledej v právě zobrazených receptech
  for (const recipe of state.recipes) {
    if (recipe.idMeal === id) return recipe;
  }
  // Hledej v oblíbených
  for (const recipe of state.favorites) {
    if (recipe.idMeal === id) return recipe;
  }
  // Hledej v týdenním plánu
  for (const day of DAYS) {
    for (const slot of SLOTS) {
      const recipe = state.plan[day]?.[slot.id];
      if (recipe && recipe.idMeal === id) return recipe;
    }
  }
  return null;
}

// Vrátí záložní recepty odpovídající hledanému výrazu
function findFallbackRecipes(query) {
  const q = query.toLowerCase();
  const results = FALLBACK_RECIPES.filter(function (recipe) {
    return (
      recipe.strMeal.toLowerCase().includes(q) ||
      recipe.strCategory.toLowerCase().includes(q) ||
      recipe.strArea.toLowerCase().includes(q)
    );
  });
  return results.length > 0 ? results : FALLBACK_RECIPES;
}

// Uloží jen potřebná data receptu (ušetří místo v localStorage)
function simplifyRecipe(recipe, includeIngredients = false) {
  return {
    idMeal:       recipe.idMeal,
    strMeal:      recipe.strMeal,
    strMealThumb: recipe.strMealThumb,
    strArea:      recipe.strArea,
    strCategory:  recipe.strCategory,
    ingredients:  includeIngredients ? getIngredients(recipe) : (recipe.ingredients || []),
  };
}

// Sestaví pole ingrediencí z polí strIngredient1…20 a strMeasure1…20
function getIngredients(recipe) {
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const name    = recipe[`strIngredient${i}`]?.trim();
    const measure = recipe[`strMeasure${i}`]?.trim();
    if (name) {
      ingredients.push([measure, name].filter(Boolean).join(" "));
    }
  }
  return ingredients;
}

// Spočítá kolik jídel je celkem naplánováno
function countPlannedMeals() {
  let count = 0;
  for (const day of DAYS) {
    for (const slot of SLOTS) {
      if (state.plan[day]?.[slot.id]) {
        count++;
      }
    }
  }
  return count;
}

// Vytvoří prázdný plán: { Pondělí: { breakfast: null, lunch: null, dinner: null }, … }
function createEmptyPlan() {
  const plan = {};
  for (const day of DAYS) {
    plan[day] = {};
    for (const slot of SLOTS) {
      plan[day][slot.id] = null;
    }
  }
  return plan;
}

// Aktualizuje čítače v status baru nahoře
function updateStats() {
  elements.recipeCount.textContent  = state.recipes.length;
  elements.favoriteCount.textContent = state.favorites.length;
  elements.plannedCount.textContent  = countPlannedMeals();
}

// Zobrazí nebo skryje informační zprávu
function showMessage(text) {
  elements.messageBox.textContent = text;
  elements.messageBox.hidden      = false;
}

// Zablokuje / odblokuje ovládací prvky formuláře během načítání
function setLoading(isLoading) {
  elements.searchForm.querySelectorAll("button, input, select").forEach(function (el) {
    el.disabled = isLoading;
  });
}

// ── localStorage ─────────────────────────────────

function loadStorage(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch (error) {
    return fallback;
  }
}

function saveStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ── Textové pomocné funkce ───────────────────────

// Převede text na malá písmena a odstraní extra mezery (pro porovnávání)
function normalizeItem(text) {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

// Bezpečné vložení textu do HTML (ochrana před XSS útoky)
function escapeHtml(value) {
  return String(value)
    .replaceAll("&",  "&amp;")
    .replaceAll("<",  "&lt;")
    .replaceAll(">",  "&gt;")
    .replaceAll('"',  "&quot;")
    .replaceAll("'",  "&#039;");
}