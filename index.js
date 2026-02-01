/* API Configure Section*/
const API = {
  categories: "https://openapi.programming-hero.com/api/categories",
  allPlants: "https://openapi.programming-hero.com/api/plants",
  byCategory: (id) => `https://openapi.programming-hero.com/api/category/${id}`,
  details: (id) => `https://openapi.programming-hero.com/api/plant/${id}`,
};

/**DOM Element Section */

const elements = {
  categoryContainer: document.getElementById("category-container"),
  plantContainer: document.getElementById("plant-container"),
  spinner: document.getElementById("spinner"),
  emptyState: document.getElementById("empty-state"),
  cartList: document.getElementById("cart-list"),
  totalPriceEl: document.getElementById("total-price"),
  plantModal: document.getElementById("plant_modal"),
  modalBody: document.getElementById("modal-body"),
  donateForm: document.getElementById("donate-form"), // Donate form element add kora hoyeche
};

let cart = []; //cart-er data rakhar array

const setLoading = (isLoading) => elements.spinner.classList.toggle("hidden", !isLoading);

const priceToNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

/**
 * ✅ Data Extractors
 */
function pickCategories(payload) {
  if (!payload) return [];
  return payload.data || payload.categories || [];
}

function pickPlants(payload) {
  if (!payload) return [];
  return payload.data || payload.plants || [];
}

function pickPlantDetail(payload) {
  if (!payload) return null;
  const data = payload.data || payload.plant;
  return Array.isArray(data) ? data[0] : data;
}

function getPlantId(p) {
  if (!p) return null;
  return p.id || p.plant_id || p._id || p.plantId || null;
}

/**
 * ✅ UI Helpers
 */
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

/**
 * ✅ Business Logic: Loading Data
 */
async function loadCategories() {
  try {
    setLoading(true);
    const payload = await getJSON(API.categories);
    const categories = pickCategories(payload);

    elements.categoryContainer.innerHTML = "";

    const allBtn = document.createElement("button");
    allBtn.id = "cat-all";
    allBtn.className = "cat-btn w-full text-left px-3 py-2 rounded-md bg-transparent text-green-800 font-semibold hover:bg-green-700 hover:text-white transition";
    allBtn.textContent = "All Trees";
    allBtn.onclick = () => {
      setActiveCategory("cat-all");
      loadAllPlants();
    };
    elements.categoryContainer.appendChild(allBtn);

    categories.forEach((cat) => {
      const id = cat.category_id || cat.id;
      const btn = document.createElement("button");
      btn.id = `cat-${id}`;
      btn.className = "cat-btn w-full text-left px-3 py-2 rounded-md bg-transparent text-green-800 hover:bg-green-700 hover:text-white transition";
      btn.textContent = cat.category_name;
      btn.onclick = () => {
        setActiveCategory(`cat-${id}`);
        loadPlantsByCategory(id);
      };
      elements.categoryContainer.appendChild(btn);
    });

    setActiveCategory("cat-all");
    loadAllPlants();
  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
}

async function loadAllPlants() {
  try {
    setLoading(true);
    const payload = await getJSON(API.allPlants);
    renderPlants(pickPlants(payload));
  } catch (err) {
    elements.plantContainer.innerHTML = `<p class="text-red-500">Error loading plants</p>`;
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
    elements.plantContainer.innerHTML = `<p class="text-red-500">Error loading category</p>`;
  } finally {
    setLoading(false);
  }
}

/**
 * ✅ Rendering UI
 */
function renderPlants(plants) {
  elements.plantContainer.innerHTML = "";
  if (!plants || plants.length === 0) {
    elements.emptyState.classList.remove("hidden");
    return;
  }
  elements.emptyState.classList.add("hidden");

  plants.forEach((p) => {
    const id = getPlantId(p);
    const name = p.plant_name || p.name;
    const price = priceToNumber(p.price);
    const card = document.createElement("div");
    card.className = "bg-white rounded-2xl border border-green-50 shadow-sm p-3 hover:shadow-md transition-shadow";

    card.innerHTML = `
      <div class="bg-gray-50 border border-green-50 rounded-xl overflow-hidden h-44 mb-3">
        <img src="${p.image}" alt="${name}" class="w-full h-full object-cover" onerror="this.src='https://via.placeholder.com/400x300?text=No+Image'">
      </div>
      <div class="space-y-2">
        <h3 class="font-bold text-[#166534] cursor-pointer hover:underline" onclick="showPlantDetails('${id}', '${encodeURIComponent(JSON.stringify(p))}')">
          ${name}
        </h3>
        <p class="text-[11px] text-gray-500 line-clamp-2">${p.short_description || p.description || ""}</p>
        <div class="flex items-center justify-between">
          <span class="badge bg-green-100 text-[#166534] border-0 text-[10px] font-semibold">${p.category || "General"}</span>
          <span class="font-bold text-gray-800">৳${price}</span>
        </div>
        <button onclick="addToCart('${name}', ${price})" class="btn btn-sm w-full rounded-full mt-2 transition-all duration-300 bg-[#15803D] text-white border hover:bg-white hover:text-[#15803D]">
          Add to Cart
        </button>
      </div>
    `;
    elements.plantContainer.appendChild(card);
  });
}

/**
 * ✅ Feature: Modal & Cart Alerts
 */
async function showPlantDetails(id, encodedData) {
  const fallback = JSON.parse(decodeURIComponent(encodedData));
  try {
    setLoading(true);
    const payload = await getJSON(API.details(id));
    const p = pickPlantDetail(payload) || fallback;

    elements.modalBody.innerHTML = `
      <img src="${p.image}" class="w-full h-56 object-cover rounded-xl mb-4">
      <div class="flex justify-between items-center mb-2">
        <h2 class="text-2xl font-bold text-[#166534]">${p.plant_name || p.name}</h2>
        <span class="badge bg-green-100 text-[#166534] border-0">${p.category || ""}</span>
      </div>
      <p class="text-gray-600 text-sm leading-relaxed mb-4">${p.description || p.short_description}</p>
      <div class="flex justify-between font-bold border-t pt-3">
        <span>Price:</span>
        <span class="text-green-700">৳${priceToNumber(p.price)}</span>
      </div>
    `;
    elements.plantModal.showModal();
  } catch (err) {
    console.error("Modal Error:", err);
  } finally {
    setLoading(false);
  }
}

// ✅ Add to Cart with Premium SweetAlert2
function addToCart(name, price) {
  cart.push({ name, price });
  updateCartUI();

  let currentTotal = 0;
  cart.forEach(item => currentTotal += item.price);

  Swal.fire({
    title: `<span style="font-family: 'Poppins', sans-serif; color: #15803D;">${name}</span>`,
    html: `
      <div style="text-align: center; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <p style="font-size: 1.2rem; margin: 10px 0;">৳${price} × 1 = ${price}৳</p>
        <p style="font-weight: bold; color: #333;">Total: ৳${currentTotal}</p>
        <hr style="border: 0.5px solid #eee; margin: 15px 0;">
        <p style="color: #15803D; font-weight: 600;">added ${name}</p>
      </div>
    `,
    icon: 'success',
    confirmButtonText: 'OKAY',
    confirmButtonColor: '#15803D',
    background: '#fff',
    customClass: {
      popup: 'rounded-3xl shadow-xl'
    }
  });
}

function removeFromCart(index) {
  cart.splice(index, 1);
  updateCartUI();
}

function updateCartUI() {
  elements.cartList.innerHTML = "";
  let total = 0;
  if (cart.length === 0) {
    elements.cartList.innerHTML = `<p class="text-xs text-gray-400 text-center py-4">Cart is empty</p>`;
    elements.totalPriceEl.textContent = "0";
    return;
  }
  cart.forEach((item, index) => {
    total += item.price;
    const row = document.createElement("div");
    row.className = "flex items-center justify-between bg-green-50 rounded-lg p-2 mb-2 animate-pulse-once";
    row.innerHTML = `
      <div class="min-w-0">
        <p class="font-bold text-[12px] truncate">${item.name}</p>
        <p class="text-[10px] text-gray-500">৳${item.price} × 1</p>
      </div>
      <button onclick="removeFromCart(${index})" class="text-red-400 hover:text-red-600 px-2">
        <i class="fa-solid fa-xmark"></i>
      </button>
    `;
    elements.cartList.appendChild(row);
  });
  elements.totalPriceEl.textContent = total;
}

/**
 * ✅ Donate Form: Premium SweetAlert2
 */
if (elements.donateForm) {
  elements.donateForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = e.target.querySelector('input[type="text"]').value;
    const email = e.target.querySelector('input[type="email"]').value;
    const trees = e.target.querySelector('select').value;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Swal.fire({ icon: 'error', title: 'Oops...', text: 'Invalid Email!', confirmButtonColor: '#d33' });
      return;
    }

    Swal.fire({
      icon: 'success',
      title: `<span style="color: #15803D; font-family: 'Poppins', sans-serif;">Donation Success!</span>`,
      html: `
        <div style="text-align: center; font-family: 'Segoe UI', sans-serif;">
          <p style="font-size: 1.1rem; color: #555;">Thank you, <b>${name}</b>!</p>
          <div style="background: #f0fdf4; padding: 15px; border-radius: 15px; margin: 15px 0; border: 1px dashed #15803D;">
             <p style="font-size: 1.2rem; font-weight: bold; color: #15803D; margin: 0;">🌳 ${trees} Trees Donated 🌳</p>
          </div>
          <p style="font-size: 0.9rem; color: #666;">( ${name} donated ${trees} trees successfully! )</p>
        </div>
      `,
      confirmButtonColor: '#15803D',
      confirmButtonText: 'Great!',
      customClass: { popup: 'rounded-3xl' }
    });
    e.target.reset();
  });
}

// Initializing
loadCategories();