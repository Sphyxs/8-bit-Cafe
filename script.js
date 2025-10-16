// script.js – Enhanced 8-Bit Café functionality (FIXED)

// ============================
// 1. Cart Management (Cookie-based)
// ============================
let cart = {};

function setCookie(name, value, days) {
  const expires = days ? `; expires=${new Date(Date.now() + days * 864e5).toUTCString()}` : '';
  document.cookie = `${name}=${encodeURIComponent(value)}${expires}; path=/; SameSite=Lax`;
  console.log('Cookie set:', name, value); // Debug
}

function getCookie(name) {
  const value = document.cookie.split('; ').reduce((r, v) => {
    const parts = v.split('=');
    return parts[0] === name ? decodeURIComponent(parts[1]) : r;
  }, '');
  console.log('Cookie get:', name, value); // Debug
  return value;
}

function getCart() {
  try {
    const stored = getCookie('cafe_cart');
    if (stored && stored !== '') {
      const parsed = JSON.parse(stored);
      console.log('Cart loaded from cookie:', parsed); // Debug
      return parsed;
    }
  } catch (e) {
    console.log('Error loading cart:', e);
  }
  console.log('Returning empty cart'); // Debug
  return {};
}

function saveCart(cartData) {
  cart = cartData;
  try {
    const jsonString = JSON.stringify(cartData);
    setCookie('cafe_cart', jsonString, 1);
    console.log('Cart saved:', cartData); // Debug
  } catch (e) {
    console.log('Error saving cart:', e);
  }
  updateAllCartCounts();
}

function addToCart(itemName, price) {
  console.log('=== ADD TO CART CALLED ===');
  console.log('Item:', itemName, 'Price:', price);
  
  const cartData = getCart();
  console.log('Current cart before adding:', cartData);
  
  if (cartData[itemName]) {
    cartData[itemName].quantity += 1;
  } else {
    cartData[itemName] = { price: parseFloat(price), quantity: 1 };
  }
  
  console.log('Cart after adding:', cartData);
  saveCart(cartData);
  
  renderOrdersPage(); // Update orders page if we're on it
  showNotification(`Added ${itemName} to cart! 🎮`);
}

function updateQuantity(itemName, delta) {
  const cartData = getCart();
  if (cartData[itemName]) {
    cartData[itemName].quantity += delta;
    if (cartData[itemName].quantity <= 0) {
      delete cartData[itemName];
      showNotification(`Removed ${itemName} from cart`);
    } else {
      showNotification(`Updated ${itemName} quantity`);
    }
    saveCart(cartData);
    renderOrdersPage();
  }
}

function clearCart() {
  saveCart({});
  renderOrdersPage();
  showNotification('Cart cleared! 🗑️');
}

function getTotalItems() {
  const cartData = getCart();
  const total = Object.values(cartData).reduce((sum, item) => sum + item.quantity, 0);
  console.log('Total items:', total); // Debug
  return total;
}

function getTotalPrice() {
  const cartData = getCart();
  return Object.values(cartData).reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

function updateAllCartCounts() {
  const total = getTotalItems();
  console.log('Updating all cart counts to:', total); // Debug
  
  const counters = [
    'home-cart-count',
    'coffee-count',
    'non-coffee-count',
    'pastries-count'
  ];
  
  counters.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      console.log('Updating counter:', id, 'to', total); // Debug
      el.textContent = `= ${total} items`;
      el.style.animation = 'none';
      setTimeout(() => {
        el.style.animation = 'pulse 0.3s ease';
      }, 10);
    } else {
      console.log('Counter element not found:', id); // Debug
    }
  });
}

// ============================
// 2. Notification System
// ============================
function showNotification(message) {
  const existing = document.querySelector('.notification');
  if (existing) {
    existing.remove();
  }

  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add('show');
  }, 10);

  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 2000);
}

// ============================
// 3. Menu Navigation
// ============================
const menuPages = [
  'menu-coffee.html',
  'menu-non-coffee.html',
  'menu-pastries.html'
];

function setupMenuNavigation() {
  const prevBtn = document.getElementById('prevMenuBtn');
  const nextBtn = document.getElementById('nextMenuBtn');
  
  if (!prevBtn || !nextBtn) return;

  const currentPage = window.location.pathname.split('/').pop();
  const currentIndex = menuPages.indexOf(currentPage);

  if (currentIndex === -1) return;

  prevBtn.onclick = () => {
    const prevIndex = (currentIndex - 1 + menuPages.length) % menuPages.length;
    window.location.href = menuPages[prevIndex];
  };

  nextBtn.onclick = () => {
    const nextIndex = (currentIndex + 1) % menuPages.length;
    window.location.href = menuPages[nextIndex];
  };
}

// ============================
// 4. Menu Item Click Handlers
// ============================
function setupMenuItems() {
  console.log('=== SETTING UP MENU ITEMS ===');
  const menuItems = document.querySelectorAll('.menu-item');
  console.log('Found menu items:', menuItems.length);
  
  menuItems.forEach((item, index) => {
    const itemName = item.getAttribute('data-item');
    const price = item.getAttribute('data-price');
    console.log(`Menu item ${index}:`, itemName, price);
    
    item.addEventListener('click', function() {
      console.log('Menu item clicked!', itemName, price);
      
      this.style.animation = 'itemClick 0.3s ease';
      setTimeout(() => {
        this.style.animation = '';
      }, 300);
      
      addToCart(itemName, price);
    });
  });
}

// ============================
// 5. Orders Page Rendering
// ============================
function renderOrdersPage() {
  const orderItemsList = document.getElementById('order-items-list');
  const totalItemsList = document.getElementById('total-items-list');
  const grandTotalEl = document.getElementById('grand-total');

  if (!orderItemsList) return;

  const cartData = getCart();
  const items = Object.entries(cartData);

  if (items.length === 0) {
    orderItemsList.innerHTML = '<p class="empty-cart">Your cart is empty. Add items from the menu!</p>';
    totalItemsList.innerHTML = '<p class="empty-total">No items yet</p>';
    grandTotalEl.textContent = '= 0.00 $';
    return;
  }

  orderItemsList.innerHTML = items
    .map(([name, data]) => `
      <div class="order-item" data-item="${name}">
        <span class="item-text">${name}</span>
        <div class="quantity-controls">
          <button class="control-btn" onclick="updateQuantity('${name}', -1)">−</button>
          <span class="item-quantity">${data.quantity}</span>
          <button class="control-btn" onclick="updateQuantity('${name}', 1)">+</button>
        </div>
        <span class="item-price">${(data.price * data.quantity).toFixed(2)}$</span>
      </div>
    `)
    .join('');

  totalItemsList.innerHTML = items
    .map(([name, data]) => `
      <div class="total-line">
        <span>${name} x${data.quantity}</span>
        <span>${(data.price * data.quantity).toFixed(2)}$</span>
      </div>
    `)
    .join('');

  const grandTotal = getTotalPrice();
  grandTotalEl.textContent = `= ${grandTotal.toFixed(2)} $`;
  grandTotalEl.style.animation = 'pulse 0.3s ease';
}

// ============================
// 6. Place Order Handler
// ============================
function setupPlaceOrder() {
  const placeOrderBtn = document.getElementById('placeOrderBtn');
  if (!placeOrderBtn) return;

  placeOrderBtn.onclick = () => {
    const cartData = getCart();
    const items = Object.entries(cartData);
    
    if (items.length === 0) {
      showNotification('Cart is empty! Add items first 🛒');
      return;
    }

    placeOrderBtn.style.animation = 'buttonPress 0.3s ease';
    
    const total = getTotalPrice();
    
    showNotification(`Order placed! Total: $${total.toFixed(2)} 🎉`);
    
    setTimeout(() => {
      clearCart();
      showNotification('Thank you for your order! ☕');
    }, 1500);
  };
}

// ============================
// 7. Review Submission
// ============================
function setupReviewSubmission() {
  const sendReviewBtn = document.getElementById('sendReview');
  const reviewInput = document.getElementById('reviewInput');
  
  if (!sendReviewBtn || !reviewInput) return;

  sendReviewBtn.onclick = () => {
    const reviewText = reviewInput.value.trim();
    
    if (!reviewText) {
      showNotification('Please write a review first! ✏️');
      return;
    }

    sendReviewBtn.style.animation = 'buttonPress 0.3s ease';
    
    setTimeout(() => {
      const reviewsList = document.querySelector('.reviews-list');
      const newReview = document.createElement('div');
      newReview.className = 'card review-card';
      newReview.innerHTML = `
        <p class="review-text">★★★★★ - "${reviewText}"</p>
        <span class="reviewer">- @You</span>
      `;
      newReview.style.animation = 'slideIn 0.5s ease';
      
      reviewsList.insertBefore(newReview, reviewsList.firstChild);
      reviewInput.value = '';
      
      showNotification('Review submitted! Thanks! 🌟');
    }, 300);
  };

  reviewInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendReviewBtn.click();
    }
  });
}

// ============================
// 8. Mobile Navigation
// ============================
function setupMobileNav() {
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');
  
  if (!hamburger || !navLinks) return;

  hamburger.onclick = () => {
    const isOpen = navLinks.classList.contains('open');
    
    if (isOpen) {
      navLinks.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    } else {
      navLinks.classList.add('open');
      hamburger.setAttribute('aria-expanded', 'true');
    }
  };

  const navButtons = navLinks.querySelectorAll('.nav-btn');
  navButtons.forEach(btn => {
    btn.onclick = () => {
      navLinks.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    };
  });
}

// ============================
// 9. CTA Button Animations
// ============================
function setupCTAButtons() {
  const ctaButtons = document.querySelectorAll('.cta');
  ctaButtons.forEach(btn => {
    btn.addEventListener('click', function(e) {
      this.style.animation = 'buttonPress 0.3s ease';
    });
  });
}

// ============================
// 10. Initialization
// ============================
document.addEventListener('DOMContentLoaded', () => {
  console.log('=== PAGE LOADED ===');
  console.log('Current page:', window.location.pathname);
  
  // Load cart from cookies on page load
  cart = getCart();
  console.log('Initial cart loaded:', cart);
  
  updateAllCartCounts();
  setupMenuNavigation();
  setupMenuItems();
  renderOrdersPage();
  setupPlaceOrder();
  setupReviewSubmission();
  setupMobileNav();
  setupCTAButtons();
  
  const page = document.querySelector('.page');
  if (page) {
    page.style.animation = 'fadeIn 0.5s ease';
  }
  
  console.log('=== INITIALIZATION COMPLETE ===');
});
