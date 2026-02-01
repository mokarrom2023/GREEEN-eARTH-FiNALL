/* API Configure Section*/
const API = {
  categories: "https://openapi.programming-hero.com/api/categories",
  allPlants: "https://openapi.programming-hero.com/api/plants",
  byCategory: (id) => `https://openapi.programming-hero.com/api/category/${id}`,
  details: (id) => `https://openapi.programming-hero.com/api/plant/${id}`,
};

/**DOM Element Section */

const categoryContainer = document.getElementById("category-container");
const plantContainer = document.getElementById("plant-container");
const spinner = document.getElementById("spinner");
const emptyState = document.getElementById("empty-state");

const cartList = document.getElementById("cart-list");
const totalPriceEl = document.getElementById("total-price");

const plantModal = document.getElementById("plant_modal");
const modalBody = document.getElementById("modal-body");

let cart = []; //cart-er data rakhar array

/**Utility & Helper Functions */
function setLoading(isLoading) {
  spinner.classList.toggle("hidden", !isLoading);
}

function priceToNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

function pickCategories(payload) {
  return payload?.categories || payload?.data || [];
}

function pickPlants(payload) {
  return payload?.plants || payload?.data || [];
}

function pickPlantDetail(payload) {
  return payload?.plant || payload?.data || null;
}

function getPlantId(p) {
  return p?.id ?? p?.plant_id ?? p?._id ?? p?.plantId ?? null;
}

/**Category Active Style */

function setActiveCategory(activeId) {
  document.querySelectorAll(".cat-btn").forEach((btn) => {
    btn.classList.remove("bg-green-700", "text-white");
    btn.classList.add("bg-transparent", "text-green-800");
  });

  const activeBtn = document.getElementById(activeId);
  if (activeBtn) {
    activeBtn.classList.add("bg-green-700", "text-white");
    activeBtn.classList.remove("bg-transparent", "text-green-800");
  }
}

/**Category Loading Section*/

async function loadCategories() {
  try {
    setLoading(true);

    const payload = await getJSON(API.categories);
    const categories = pickCategories(payload);

    categoryContainer.innerHTML = "";

    // "All Trees" Button banano

    const allBtn = document.createElement("button");
    allBtn.id = "cat-all";
    allBtn.className = "cat-btn w-full text-left px-3 py-2 rounded-md bg-transparent text-green-800 font-semibold hover:bg-green-700 hover:text-white transition";
    allBtn.textContent = "All Trees";
    allBtn.addEventListener("click", async () => {
      setActiveCategory("cat-all");
      await loadAllPlants();
    });
    categoryContainer.appendChild(allBtn);

    // Dynamic buttons banano
    categories.forEach((cat) => {
      const id = cat.id ?? cat.category_id ?? cat._id;
      const name = cat.category_name || cat.name || `Category ${id}`;

      const btn = document.createElement("button");
      btn.id = `cat-${id}`;
      btn.className =
        "cat-btn w-full text-left px-3 py-2 rounded-md bg-transparent text-green-800 hover:bg-green-700 hover:text-white transition";
      btn.textContent = name;

      btn.addEventListener("click", async () => {
        setActiveCategory(`cat-${id}`);
        await loadPlantsByCategory(id);
      });

      categoryContainer.appendChild(btn);
    });

    setActiveCategory("cat-all");
    await loadAllPlants();
   } 
    catch (err) {
    console.error(err);
    categoryContainer.innerHTML = `<p class="text-red-500">Failed to load categories</p>`;
   }
    finally {
    setLoading(false);
  }
}

/**Load Plants */

async function loadAllPlants() {
  try {
    setLoading(true);
    const payload = await getJSON(API.allPlants);
    renderPlants(pickPlants(payload));
  } catch (err) {
    console.error(err);
    plantContainer.innerHTML = `<p class="text-red-500">Failed to load plants</p>`;
    emptyState.classList.add("hidden");
  } finally {
    setLoading(false);
  }
}

async function loadPlantsByCategory(categoryId) {
  try {
    setLoading(true);
    const payload = await getJSON(API.byCategory(categoryId));
    renderPlants(pickPlants(payload));
  } catch (err) {
    console.error(err);
    plantContainer.innerHTML = `<p class="text-red-500">Failed to load category plants</p>`;
    emptyState.classList.add("hidden");
  } finally {
    setLoading(false);
  }
}

/**Plant Cards Rendering Section*/

function renderPlants(plants) {
  plantContainer.innerHTML = "";

  if (!plants || plants.length === 0) {
    emptyState.classList.remove("hidden");
    return;
  }
  emptyState.classList.add("hidden");

   plants.forEach((p) => {
    const id = getPlantId(p);
    const name = p.plant_name || p.name || "Unknown Plant";
    const image = p.image || "https://via.placeholder.com/600x400?text=No+Image";
    const category = p.category || "Fruit Tree";
    const price = priceToNumber(p.price);
    const desc = p.short_description || p.description || "";
    const safeDesc = (desc || "").replaceAll('"', "&quot;");

    const card = document.createElement("div");
    card.className =
      "bg-white rounded-xl border border-green-100 shadow-sm overflow-hidden p-3";

    card.innerHTML = `
      <div class="bg-gray-50 border border-green-100 rounded-xl overflow-hidden h-40">
        <img
          src="${image}"
          alt="${name}"
          class="w-full h-full object-cover"
          onerror="this.src='https://via.placeholder.com/600x400?text=No+Image'"
        />
      </div>

      <div class="pt-3 space-y-2">
        <h3
          class="font-bold text-sm cursor-pointer text-[#166534] hover:underline plant-name"
          data-id="${id}"
          data-name="${name}"
          data-desc="${safeDesc}"
          data-price="${price}"
          data-category="${(category || "").replaceAll('"', "&quot;")}"
        >
          ${name}
        </h3>

        <p class="text-[10px] text-gray-600 leading-snug line-clamp-2">
          ${desc}
        </p>

        <div class="flex items-center justify-between">
          <span class="badge bg-green-100 text-[#166534] border-0 text-[10px] font-medium">
            ${category}
          </span>
          <span class="font-semibold text-sm">৳${price}</span>
        </div>

        <button
          class="btn btn-sm w-full bg-[#15803D] text-white hover:bg-white hover:text-[#15803D] border border-[#15803D] duration-200 add-cart rounded-full"
          data-id="${id}"
          data-name="${name}"
          data-price="${price}"
        >
          Add to Cart
        </button>
      </div>
    `;

    plantContainer.appendChild(card);
  });
}
/** Cart & Modal Interaction Section/gachh cart-e add hoy */

async function openPlantModal(id, fallback = {}) {
  try {
    setLoading(true);

    const payload = await getJSON(API.details(id));
    const p = pickPlantDetail(payload);

    const name = p?.plant_name || p?.name || fallback.name || "Tree Details";
    const desc =
      p?.description || p?.short_description || fallback.desc || "No description available.";
    const price = priceToNumber(p?.price ?? fallback.price);
    const category = p?.category || fallback.category || "";

    modalBody.innerHTML = `
      <div class="space-y-3">
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-xl font-bold text-[#166534]">${name}</h2>
          ${
            category
              ? `<span class="badge bg-green-100 text-[#166534] border-0">${category}</span>`
              : ""
          }
        </div>

        <p class="text-gray-700 text-sm leading-relaxed">
          ${desc}
        </p>

        <div class="flex justify-between font-semibold pt-2">
          <span>Price</span>
          <span>৳${price}</span>
        </div>
      </div>
    `;

    plantModal.showModal();
  } catch (err) {
    console.error(err);

    modalBody.innerHTML = `
      <div class="space-y-3">
        <h2 class="text-xl font-bold text-[#166534]">${fallback.name || "Tree Details"}</h2>
        <p class="text-gray-700 text-sm leading-relaxed">
          ${fallback.desc || "No description available."}
        </p>
        <div class="flex justify-between font-semibold pt-2">
          <span>Price</span>
          <span>৳${priceToNumber(fallback.price)}</span>
        </div>
      </div>
    `;
    plantModal.showModal();
  } finally {
    setLoading(false);
  }
}

// Cart Update Function
function renderCart() {
  cartList.innerHTML = "";

  if (cart.length === 0) {
    cartList.innerHTML = `<p class="text-sm text-gray-500">Cart is empty.</p>`;
    totalPriceEl.textContent = "0";
    return;
  }

  let total = 0;

  cart.forEach((item, index) => {
    total += item.price;

    const row = document.createElement("div");
    row.className = "flex items-center justify-between bg-[#ECFDF5] rounded-lg p-3";

    row.innerHTML = `
      <div class="min-w-0">
        <p class="font-semibold text-sm truncate">${item.name}</p>
        <p class="text-xs text-gray-600">৳${item.price} × 1</p>
      </div>
      <button class="btn btn-ghost btn-xs text-red-500 remove-item" data-index="${index}">
        <i class="fa-solid fa-xmark"></i>
      </button>
    `;

    cartList.appendChild(row);
  });

  totalPriceEl.textContent = String(total);
}

// Global Click Listener (Events Card click + Cart click)

plantContainer.addEventListener("click", (e) => {
  const nameEl = e.target.closest(".plant-name");
  if (nameEl) {
    openPlantModal(nameEl.dataset.id, {
      name: nameEl.dataset.name || nameEl.textContent.trim(),
      desc: nameEl.dataset.desc || "",
      price: priceToNumber(nameEl.dataset.price),
      category: nameEl.dataset.category || "",
    });
    return;
  }

  const addBtn = e.target.closest(".add-cart");
  if (addBtn) {
    cart.push({
      id: addBtn.dataset.id,
      name: addBtn.dataset.name,
      price: priceToNumber(addBtn.dataset.price),
    });
    renderCart();
  }
});

cartList.addEventListener("click", (e) => {
  const rm = e.target.closest(".remove-item");
  if (!rm) return;

  const index = Number(rm.dataset.index);
  cart.splice(index, 1);
  renderCart();
});

/** Start/Init Section*/
renderCart(); // Shurute khali cart dekhabe
loadCategories(); // API theke data ana shuru korbe