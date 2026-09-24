// ============================================
// Foodie Delight - Client-side script
// Handles: mobile menu, cart (localStorage), header cart modal,
// full cart page rendering, checkout (calls backend API), bill download
// ============================================

// ---- Mobile hamburger menu ----
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.querySelector('.nav-links');
if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => navLinks.classList.toggle('active'));
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => navLinks.classList.remove('active'));
    });
}

// ---- Profile dropdown toggle ----
const profileToggle = document.getElementById('profileToggle');
const profileDropdown = document.getElementById('profileDropdown');

if (profileToggle && profileDropdown) {
    profileToggle.addEventListener('click', function (e) {
        e.preventDefault();
        profileDropdown.classList.toggle('show');
    });
    window.addEventListener('click', function (e) {
        if (!profileToggle.contains(e.target) && !profileDropdown.contains(e.target)) {
            profileDropdown.classList.remove('show');
        }
    });
}

// ---- Cart state (persisted in localStorage) ----
let cart = JSON.parse(localStorage.getItem('cart')) || [];

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function addToCart(id, name, price, image) {
    const existing = cart.find(item => item.id === id);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ id, name, price: parseFloat(price), image, quantity: 1 });
    }
    saveCart();
    updateCartHeaderUI();
    alert(`${name} added to cart!`);
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    saveCart();
    updateCartHeaderUI();
    renderFullCartPage();
}

function updateQuantity(id, change) {
    const item = cart.find(item => item.id === id);
    if (!item) return;
    item.quantity += change;
    if (item.quantity <= 0) {
        removeFromCart(id);
        return;
    }
    saveCart();
    updateCartHeaderUI();
    renderFullCartPage();
}

// ---- Wire up "Add to Cart" buttons on any page ----
document.addEventListener('click', function (e) {
    if (e.target.classList.contains('add-to-cart')) {
        const btn = e.target;
        addToCart(
            parseInt(btn.getAttribute('data-id'), 10),
            btn.getAttribute('data-name'),
            btn.getAttribute('data-price'),
            btn.getAttribute('data-image')
        );
    }
});

// ---- Header cart modal (icon in navbar) ----
const cartLink = document.getElementById('cartLink');
const cartModal = document.getElementById('cartModal');
const closeCart = document.getElementById('closeCart');
const cartCountEl = document.querySelector('.cart-count');

function updateCartHeaderUI() {
    if (!cartCountEl) return;
    const totalItems = cart.reduce((t, i) => t + i.quantity, 0);
    cartCountEl.textContent = totalItems;
}

if (cartLink && cartModal) {
    // On pages with a full cart page (/cart), let the link navigate there normally.
    // On other pages, open the quick-preview modal instead.
    const isCartPage = window.location.pathname === '/cart';
    if (!isCartPage) {
        cartLink.addEventListener('click', function (e) {
            e.preventDefault();
            cartModal.style.display = 'flex';
        });
    }
    if (closeCart) {
        closeCart.addEventListener('click', () => { cartModal.style.display = 'none'; });
    }
    window.addEventListener('click', function (e) {
        if (e.target === cartModal) cartModal.style.display = 'none';
    });
}

updateCartHeaderUI();

// ============================================
// Full Cart Page (/cart) logic
// ============================================
const pageCartItems = document.getElementById('pageCartItems');
const pageCartTotal = document.getElementById('pageCartTotal');
const placeOrderBtn = document.getElementById('placeOrderBtn');

function renderFullCartPage() {
    if (!pageCartItems) return;

    if (cart.length === 0) {
        pageCartItems.innerHTML = '<p class="empty-cart-message">Your cart is empty</p>';
        pageCartTotal.textContent = '0.00';
        return;
    }

    let total = 0;
    pageCartItems.innerHTML = '';

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;

        const row = document.createElement('div');
        row.className = 'cart-item';
        row.innerHTML = `
            <div class="item-info">
                <h4>${item.name}</h4>
                <p class="item-price">₹${item.price.toFixed(2)} each</p>
            </div>
            <div class="item-quantity">
                <button class="quantity-btn minus" data-id="${item.id}">-</button>
                <span class="quantity">${item.quantity}</span>
                <button class="quantity-btn plus" data-id="${item.id}">+</button>
            </div>
            <p class="item-total">₹${itemTotal.toFixed(2)}</p>
            <button class="remove-item" data-id="${item.id}">×</button>
        `;
        pageCartItems.appendChild(row);
    });

    pageCartTotal.textContent = total.toFixed(2);

    pageCartItems.querySelectorAll('.quantity-btn.minus').forEach(btn => {
        btn.addEventListener('click', () => updateQuantity(parseInt(btn.dataset.id, 10), -1));
    });
    pageCartItems.querySelectorAll('.quantity-btn.plus').forEach(btn => {
        btn.addEventListener('click', () => updateQuantity(parseInt(btn.dataset.id, 10), 1));
    });
    pageCartItems.querySelectorAll('.remove-item').forEach(btn => {
        btn.addEventListener('click', () => removeFromCart(parseInt(btn.dataset.id, 10)));
    });
}

if (pageCartItems) {
    renderFullCartPage();
}

// ---- Place Order (COD or Razorpay online payment) ----
if (placeOrderBtn) {
    placeOrderBtn.addEventListener('click', async function () {
        if (cart.length === 0) {
            alert('Your cart is empty!');
            return;
        }

        const deliveryAddress = document.getElementById('deliveryAddress')?.value || '';
        const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'cod';

        if (paymentMethod === 'online') {
            await placeOrderOnline(deliveryAddress);
        } else {
            await placeOrderCOD(deliveryAddress);
        }
    });
}

// ---- Cash on Delivery flow ----
async function placeOrderCOD(deliveryAddress) {
    placeOrderBtn.disabled = true;
    placeOrderBtn.textContent = 'Placing order...';

    try {
        const response = await fetch('/order/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items: cart.map(i => ({ id: i.id, quantity: i.quantity })),
                deliveryAddress
            })
        });

        const data = await response.json();

        if (!data.success) {
            alert(data.message || 'Checkout failed. Please try again.');
            return;
        }

        cart = [];
        saveCart();
        updateCartHeaderUI();
        renderFullCartPage();

        showBillPreview(data.order);
    } catch (err) {
        console.error('Checkout error:', err);
        alert('Something went wrong while placing your order.');
    } finally {
        placeOrderBtn.disabled = false;
        placeOrderBtn.textContent = 'Place Order';
    }
}

// ---- Razorpay online payment flow ----
async function placeOrderOnline(deliveryAddress) {
    placeOrderBtn.disabled = true;
    placeOrderBtn.textContent = 'Starting payment...';

    try {
        // Step 1: ask the server to create a Razorpay order (server recalculates the total)
        const createRes = await fetch('/order/razorpay/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items: cart.map(i => ({ id: i.id, quantity: i.quantity })),
                deliveryAddress
            })
        });
        const createData = await createRes.json();

        if (!createData.success) {
            alert(createData.message || 'Could not start payment. Please try again.');
            placeOrderBtn.disabled = false;
            placeOrderBtn.textContent = 'Place Order';
            return;
        }

        // Step 2: open the Razorpay payment popup
        const options = {
            key: createData.keyId,
            amount: createData.amount,
            currency: createData.currency,
            name: 'Foodie Delight',
            description: 'Order Payment',
            order_id: createData.razorpayOrderId,
            handler: async function (response) {
                // Step 3: verify the payment signature on the server
                placeOrderBtn.textContent = 'Verifying payment...';
                try {
                    const verifyRes = await fetch('/order/razorpay/verify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        })
                    });
                    const verifyData = await verifyRes.json();

                    if (!verifyData.success) {
                        alert(verifyData.message || 'Payment verification failed. Please contact support.');
                        return;
                    }

                    cart = [];
                    saveCart();
                    updateCartHeaderUI();
                    renderFullCartPage();
                    showBillPreview(verifyData.order);
                } catch (err) {
                    console.error('Payment verification error:', err);
                    alert('Payment was received but verification failed. Please contact support with your payment ID: ' + response.razorpay_payment_id);
                } finally {
                    placeOrderBtn.disabled = false;
                    placeOrderBtn.textContent = 'Place Order';
                }
            },
            modal: {
                ondismiss: function () {
                    // User closed the popup without paying — order stays recorded
                    // with payment_status='pending' so you can retry from My Orders.
                    placeOrderBtn.disabled = false;
                    placeOrderBtn.textContent = 'Place Order';
                }
            },
            prefill: {
                name: (window.CURRENT_USER_NAME || '')
            },
            theme: { color: '#1e3c72' }
        };

        const rzp = new Razorpay(options);
        rzp.on('payment.failed', function () {
            alert('Payment failed. Please try again or choose Cash on Delivery.');
            placeOrderBtn.disabled = false;
            placeOrderBtn.textContent = 'Place Order';
        });
        rzp.open();
    } catch (err) {
        console.error('Razorpay init error:', err);
        alert('Something went wrong starting the payment.');
        placeOrderBtn.disabled = false;
        placeOrderBtn.textContent = 'Place Order';
    }
}

// ---- Bill preview modal (shown right after successful checkout) ----
function buildBillText(order) {
    let text = `
=====================================
          FOODIE DELIGHT
      ORDER RECEIPT & BILL
=====================================

Order ID: #${order.id}
Date: ${new Date(order.created_at).toLocaleString()}
Payment Method: ${order.payment_method === 'online' ? 'Paid Online' : 'Cash on Delivery'}
Payment Status: ${order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}

Items:
-------------------------------------
`;
    order.items.forEach(item => {
        const lineTotal = (item.item_price * item.quantity).toFixed(2);
        text += `${item.item_name}\n  Price: ₹${Number(item.item_price).toFixed(2)} x ${item.quantity} = ₹${lineTotal}\n-------------------------------------\n`;
    });
    text += `\nTotal Amount: ₹${Number(order.total_amount).toFixed(2)}\n\n=====================================\n    Thank you for your order!\n  Visit us again at Foodie Delight\n=====================================\n`;
    return text;
}

function showBillPreview(order) {
    const billModal = document.getElementById('billModal');
    const billPreview = document.getElementById('billPreview');
    if (!billModal || !billPreview) return;

    const billText = buildBillText(order);
    billPreview.textContent = billText;
    billModal.style.display = 'flex';

    const closeBill = document.getElementById('closeBill');
    const closeBillBtn = document.getElementById('closeBillBtn');
    const downloadTxt = document.getElementById('downloadTxt');
    const downloadPdf = document.getElementById('downloadPdf');

    if (closeBill) closeBill.onclick = () => { billModal.style.display = 'none'; };
    if (closeBillBtn) closeBillBtn.onclick = () => { billModal.style.display = 'none'; };

    if (downloadTxt) {
        downloadTxt.onclick = () => {
            const blob = new Blob([billText], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `foodie-delight-bill-${order.id}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        };
    }

    if (downloadPdf) {
        downloadPdf.onclick = () => {
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <html><head><title>Foodie Delight Bill</title>
                <style>body{font-family:monospace;margin:20px;} pre{white-space:pre-wrap;}</style>
                </head><body><pre>${billText}</pre>
                <script>window.onload = function(){ window.print(); }<\/script>
                </body></html>
            `);
            printWindow.document.close();
        };
    }

    window.addEventListener('click', function (e) {
        if (e.target === billModal) billModal.style.display = 'none';
    });
}
