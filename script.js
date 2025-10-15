// script.js - Multi-page support + localStorage cart + menu navigation
document.addEventListener('DOMContentLoaded', () => {
  // Helpers
  const CART_KEY = '8bit_cafe_cart_v1';

  function loadCart() {
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (!raw) return {};
      return JSON.parse(raw);
    } catch (e) {
      console.error('Failed to load cart', e);
      return {};
    }
  }

  function saveCart(cart) {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to save cart', e);
    }
  }

  function addToCart(name, price, category) {
    if (!name) return;
    const cart = loadCart();
    if (!cart[name]) {
      cart[name] = { price: Number(price), qty: 1, category: category || '' };
    } else {
      cart[name].qty += 1;
    }
    saveCart(cart);
    updateAllCounts();
  }

  function adjustQuantity(name, delta) {
    const cart = loadCart();
    if (!cart[name]) return;
    cart[name].qty += delta;
    if (cart[name].qty <= 0) delete cart[name];
    saveCart(cart);
    renderCartOnOrdersPage();
    updateAllCounts();
  }

  function clearCart() {
    localStorage.removeItem(CART_KEY);
    updateAllCounts();
    renderCartOnOrdersPage();
  }

  // Update counters shown on pages (all pages may show a small count)
  function getTotals() {
    const cart = loadCart();
    let totalQty = 0;
    let byCategory = { 'menu-coffee': 0, 'menu-non-coffee': 0, 'menu-pastries': 0 };
    Object.keys(cart).forEach(k => {
      const e = cart[k];
      totalQty += e.qty;
      if (byCategory[e.category]) byCategory[e.category] += e.qty;
    });
    return { totalQty, byCategory };
  }

  function updateAllCounts() {
    const totals = getTotals();
    // header/home count
    const homeCount = document.getElementById('home-cart-count');
    if (homeCount) homeCount.textContent = `= ${totals.totalQty} items`;

    // menu counts
    const coffeeCount = document.getElementById('coffee-count');
    if (coffeeCount) coffeeCount.textContent = `= ${totals.byCategory['menu-coffee'] || 0} items`;
    const nonCoffeeCount = document.getElementById('non-coffee-count');
    if (nonCoffeeCount) nonCoffeeCount.textContent = `= ${totals.byCategory['menu-non-coffee'] || 0} items`;
    const pastriesCount = document.getElementById('pastries-count');
    if (pastriesCount) pastriesCount.textContent = `= ${totals.byCategory['menu-pastries'] || 0} items`;

    // small inline counts on menu pages
    const coffeeSmall = document.getElementById('coffee-count');
    if (coffeeSmall) coffeeSmall.textContent = `= ${totals.byCategory['menu-coffee'] || 0} items`;
    const nonCoffeeSmall = document.getElementById('non-coffee-count');
    if (nonCoffeeSmall) nonCoffeeSmall.textContent = `= ${totals.byCategory['menu-non-coffee'] || 0} items`;
    const pastriesSmall = document.getElementById('pastries-count');
    if (pastriesSmall) pastriesSmall.textContent = `= ${totals.byCategory['menu-pastries'] || 0} items`;
  }

  // Nav: make current page's nav button active
  function highlightActiveNav() {
    const navBtns = document.querySelectorAll('.nav-btn');
    const pathname = window.location.pathname.split('/').pop() || 'index.html';
    navBtns.forEach(btn => {
      const href = (btn.getAttribute('href') || '').split('/').pop();
      if (href === pathname) btn.classList.add('active');
      else btn.classList.remove('active');
    });
  }

  // Attach menu item click listeners (on menu pages)
  function attachMenuItemListeners() {
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(mi => {
      if (mi.dataset.listenerAttached) return;
      mi.dataset.listenerAttached = 'true';
      mi.addEventListener('click', () => {
        const itemName = mi.dataset.item || (mi.querySelector('.item-name') && mi.querySelector('.item-name').textContent.trim());
        const itemPrice = mi.dataset.price || (mi.querySelector('.price-bar') && parseFloat(mi.querySelector('.price-bar').textContent.replace(/[^0-9.]/g, ''))) || 0;
        // infer category by current page file name
        const page = window.location.pathname.split('/').pop();
        let category = '';
        if (page && page.includes('coffee')) category = 'menu-coffee';
        else if (page && page.includes('non-coffee')) category = 'menu-non-coffee';
        else if (page && page.includes('pastries')) category = 'menu-pastries';
        else category = 'menu-coffee';
        addToCart(itemName, itemPrice, category);
      });
    });
  }

  // Render cart items on orders page
  function renderCartOnOrdersPage() {
    const orderList = document.getElementById('order-items-list');
    const totalsList = document.getElementById('total-items-list');
    const grandEl = document.getElementById('grand-total');
    if (!orderList && !totalsList && !grandEl) return;

    const cart = loadCart();
    const names = Object.keys(cart);
    if (orderList) orderList.innerHTML = '';
    if (totalsList) totalsList.innerHTML = '';

    if (names.length === 0) {
      if (orderList) orderList.innerHTML = `<p class="empty-cart">Your cart is empty. Add items from the menu!</p>`;
      if (totalsList) totalsList.innerHTML = `<p class="empty-total">No items yet</p>`;
      if (grandEl) grandEl.textContent = `= 0.00 $`;
      return;
    }

    let grandTotal = 0;
    names.forEach(name => {
      const { price, qty } = cart[name];
      const lineTotal = price * qty;
      grandTotal += lineTotal;

      // Order summary item
      if (orderList) {
        const orderItem = document.createElement('div');
        orderItem.className = 'order-item';
        orderItem.dataset.item = name;

        const itemText = document.createElement('div');
        itemText.className = 'item-text';
        itemText.textContent = `${qty} = ${name}`;

        const controls = document.createElement('div');
        controls.className = 'quantity-controls';

        const minusBtn = document.createElement('button');
        minusBtn.className = 'control-btn minus';
        minusBtn.type = 'button';
        minusBtn.textContent = '−';

        const plusBtn = document.createElement('button');
        plusBtn.className = 'control-btn plus';
        plusBtn.type = 'button';
        plusBtn.textContent = '+';

        controls.appendChild(minusBtn);
        controls.appendChild(plusBtn);

        orderItem.appendChild(itemText);
        orderItem.appendChild(controls);

        orderList.appendChild(orderItem);
      }

      // Totals list line
      if (totalsList) {
        const line = document.createElement('div');
        line.className = 'total-line';
        line.textContent = `${name} — ${qty} x ${price.toFixed(2)} $ = ${(lineTotal).toFixed(2)} $`;
        totalsList.appendChild(line);
      }
    });

    if (grandEl) grandEl.textContent = `= ${grandTotal.toFixed(2)} $`;
    // attach controls (delegation)
    attachOrderControls();
  }

  function attachOrderControls() {
    const orderList = document.getElementById('order-items-list');
    if (!orderList) return;
    if (orderList.dataset.handlerAttached) return;
    orderList.dataset.handlerAttached = 'true';

    orderList.addEventListener('click', (e) => {
      const btn = e.target.closest('.control-btn');
      if (!btn) return;
      const itemEl = btn.closest('.order-item');
      if (!itemEl) return;
      const name = itemEl.dataset.item;
      if (!name) return;
      if (btn.classList.contains('plus')) adjustQuantity(name, +1);
      else if (btn.classList.contains('minus')) adjustQuantity(name, -1);
    });
  }

  // Place order (demo)
  function attachPlaceOrder() {
    const placeBtn = document.getElementById('placeOrderBtn');
    if (!placeBtn) return;
    placeBtn.addEventListener('click', () => {
      const cart = loadCart();
      if (Object.keys(cart).length === 0) {
        alert('Your cart is empty. Add items from the menu!');
        return;
      }
      if (confirm('Place order now? (Demo)')) {
        alert('Order placed — thank you! (Demo)');
        clearCart();
      }
    });
  }

  // Review send (about page)
  function attachReviewSender() {
    const sendBtn = document.getElementById('sendReview');
    const input = document.getElementById('reviewInput');
    if (!sendBtn || !input) return;
    sendBtn.addEventListener('click', () => {
      const text = input.value && input.value.trim();
      if (!text) return;
      const reviewsList = document.querySelector('.reviews-list');
      if (!reviewsList) return;
      const card = document.createElement('div');
      card.className = 'card review-card';
      const p = document.createElement('p');
      p.className = 'review-text';
      p.textContent = `★★★★★ - "${text}"`;
      const s = document.createElement('span');
      s.className = 'reviewer';
      s.textContent = '- @You';
      card.appendChild(p);
      card.appendChild(s);
      reviewsList.insertBefore(card, reviewsList.firstChild);
      input.value = '';
    });
  }

  // Menu navigation (Previous / Next)
  function attachMenuNavButtons() {
    const mapping = [
      'menu-coffee.html',
      'menu-non-coffee.html',
      'menu-pastries.html'
    ];
    const page = window.location.pathname.split('/').pop();
    const idx = mapping.indexOf(page);
    const nextBtn = document.getElementById('nextMenuBtn');
    const prevBtn = document.getElementById('prevMenuBtn');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const nextIndex = (idx === -1) ? 0 : (idx + 1) % mapping.length;
        window.location.href = mapping[nextIndex];
      });
    }
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        const prevIndex = (idx === -1) ? 0 : (idx - 1 + mapping.length) % mapping.length;
        window.location.href = mapping[prevIndex];
      });
    }
  }

  // Mobile nav toggling
  function attachHamburger() {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    if (!hamburger || !navLinks) return;

    function closeMobileNav() {
      navLinks.classList.remove('open');
      document.body.classList.remove('nav-open-lock');
      hamburger.setAttribute('aria-expanded', 'false');
      hamburger.classList.remove('active');
    }

    hamburger.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      document.body.classList.toggle('nav-open-lock', isOpen);
      hamburger.setAttribute('aria-expanded', String(isOpen));
      hamburger.classList.toggle('active', isOpen);
    });

    document.addEventListener('click', (e) => {
      if (!navLinks.contains(e.target) && !hamburger.contains(e.target)) {
        closeMobileNav();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMobileNav();
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) {
        navLinks.classList.remove('open');
        document.body.classList.remove('nav-open-lock');
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.classList.remove('active');
      }
    });
  }

  // Initializers
  highlightActiveNav();
  attachHamburger();
  attachMenuItemListeners();
  attachMenuNavButtons();
  attachReviewSender();
  attachPlaceOrder();
  updateAllCounts();
  renderCartOnOrdersPage();

  // Update counts frequently (in case user opens multiple tabs)
  window.addEventListener('storage', () => {
    updateAllCounts();
    renderCartOnOrdersPage();
  });
});
