/* =================================
   LINDIWE'S BAKERY MANAGEMENT SYSTEM
   Developer: Lindiwe Kapi
   ================================= */

"use strict";

/* ---------- Storage ---------- */

const STORAGE_KEYS = {
    customers: "lindiwe_bakery_customers",
    stock: "lindiwe_bakery_stock",
    sales: "lindiwe_bakery_sales",
    payments: "lindiwe_bakery_payments"
};

function loadData(key) {
    try {
        const stored = localStorage.getItem(key);
        const data = stored ? JSON.parse(stored) : [];

        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error("Could not load saved data:", error);
        return [];
    }
}

let customers = loadData(STORAGE_KEYS.customers);
let stock = loadData(STORAGE_KEYS.stock);
let sales = loadData(STORAGE_KEYS.sales);
let payments = loadData(STORAGE_KEYS.payments);

function saveData(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error("Could not save data:", error);

        alert(
            "Your information could not be saved. " +
            "Check your browser storage."
        );

        return false;
    }
}

/* ---------- Helpers ---------- */

function createId() {
    if (window.crypto && window.crypto.randomUUID) {
        return window.crypto.randomUUID();
    }

    return (
        Date.now().toString(36) +
        Math.random().toString(36).slice(2)
    );
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return entities[character];
    });
}

function formatMoney(amount) {
    return new Intl.NumberFormat("en-ZA", {
        style: "currency",
        currency: "ZAR"
    }).format(amount);
}

function formatDate(date) {
    return new Date(date).toLocaleString("en-ZA", {
        dateStyle: "medium",
        timeStyle: "short"
    });
}

function getElement(id) {
    return document.getElementById(id);
}

function emptyRow(columns, message) {
    return `
        <tr>
            <td colspan="${columns}">
                ${escapeHTML(message)}
            </td>
        </tr>
    `;
}

/* ---------- Navigation ---------- */

const menuToggle = getElement("menuToggle");
const navLinks = getElement("navLinks");

menuToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");

    menuToggle.setAttribute("aria-expanded", String(isOpen));

    menuToggle.setAttribute(
        "aria-label",
        isOpen ? "Close navigation menu" : "Open navigation menu"
    );
});

navLinks.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
        navLinks.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute(
            "aria-label",
            "Open navigation menu"
        );
    });
});

/* ---------- Customer Management ---------- */

getElement("customerForm").addEventListener("submit", event => {
    event.preventDefault();

    const name = getElement("customerName").value.trim();
    const phone = getElement("customerPhone").value.trim();
    const email = getElement("customerEmail").value.trim();

    if (!name || !phone) {
        alert("Please enter the customer's name and phone number.");
        return;
    }

    const customer = {
        id: createId(),
        name,
        phone,
        email,
        createdAt: new Date().toISOString()
    };

    customers.push(customer);

    if (!saveData(STORAGE_KEYS.customers, customers)) {
        customers.pop();
        return;
    }

    event.target.reset();

    renderCustomers();
    updateDashboard();

    alert("Customer registered successfully.");
});

function renderCustomers() {
    const tbody = getElement("customerTableBody");

    if (customers.length === 0) {
        tbody.innerHTML = emptyRow(
            3,
            "No customers registered yet."
        );
    } else {
        tbody.innerHTML = customers.map(customer => `
            <tr>
                <td>${escapeHTML(customer.name)}</td>
                <td>${escapeHTML(customer.phone)}</td>
                <td>${escapeHTML(customer.email || "Not provided")}</td>
            </tr>
        `).join("");
    }

    const customerSelect = getElement("saleCustomer");
    const previousValue = customerSelect.value;

    customerSelect.innerHTML = `
        <option value="">Select customer</option>
        ${customers.map(customer => `
            <option value="${escapeHTML(customer.id)}">
                ${escapeHTML(customer.name)}
            </option>
        `).join("")}
    `;

    if (customers.some(customer => customer.id === previousValue)) {
        customerSelect.value = previousValue;
    }
}

/* ---------- Stock Management ---------- */

getElement("stockForm").addEventListener("submit", event => {
    event.preventDefault();

    const name = getElement("productName").value.trim();
    const quantity = Number(getElement("productQuantity").value);
    const price = Number(getElement("productPrice").value);
    const minimumStock = Number(getElement("minimumStock").value);

    if (
        !name ||
        !Number.isSafeInteger(quantity) ||
        quantity < 0 ||
        !Number.isFinite(price) ||
        price < 0 ||
        !Number.isSafeInteger(minimumStock) ||
        minimumStock < 0
    ) {
        alert("Please enter valid stock information.");
        return;
    }

    const existingProduct = stock.find(
        product => product.name.toLowerCase() === name.toLowerCase()
    );

    if (existingProduct) {
        const updatedProduct = {
            ...existingProduct,
            quantity: existingProduct.quantity + quantity,
            price,
            minimumStock
        };

        const previousStock = stock;

        stock = stock.map(product =>
            product.id === existingProduct.id
                ? updatedProduct
                : product
        );

        if (!saveData(STORAGE_KEYS.stock, stock)) {
            stock = previousStock;
            return;
        }
    } else {
        const product = {
            id: createId(),
            name,
            quantity,
            price,
            minimumStock
        };

        stock.push(product);

        if (!saveData(STORAGE_KEYS.stock, stock)) {
            stock.pop();
            return;
        }
    }

    event.target.reset();
    getElement("minimumStock").value = 5;

    renderStock();
    updateDashboard();

    alert("Stock saved successfully.");
});

function renderStock() {
    const tbody = getElement("stockTableBody");

    if (stock.length === 0) {
        tbody.innerHTML = emptyRow(5, "No stock recorded yet.");
    } else {
        tbody.innerHTML = stock.map(product => {
            const lowStock = product.quantity <= product.minimumStock;

            return `
                <tr>
                    <td>${escapeHTML(product.name)}</td>

                    <td>${product.quantity}</td>

                    <td>${formatMoney(product.price)}</td>

                    <td>
                        <span class="status ${
                            lowStock ? "status-low" : "status-good"
                        }">
                            ${lowStock ? "Low Stock" : "In Stock"}
                        </span>
                    </td>

                    <td>
                        <button
                            type="button"
                            class="table-btn"
                            data-stock-action="add"
                            data-id="${escapeHTML(product.id)}">
                            Add 1
                        </button>

                        <button
                            type="button"
                            class="table-btn table-btn-danger"
                            data-stock-action="delete"
                            data-id="${escapeHTML(product.id)}">
                            Delete
                        </button>
                    </td>
                </tr>
            `;
        }).join("");
    }

    const productSelect = getElement("saleProduct");
    const previousValue = productSelect.value;

    productSelect.innerHTML = `
        <option value="">Select product</option>
        ${stock.filter(product => product.quantity > 0)
            .map(product => `
                <option value="${escapeHTML(product.id)}">
                    ${escapeHTML(product.name)}
                    (${product.quantity} available)
                </option>
            `).join("")}
    `;

    if (stock.some(product =>
        product.id === previousValue && product.quantity > 0
    )) {
        productSelect.value = previousValue;
    }

    updateLowStockNotice();
}

getElement("stockTableBody").addEventListener("click", event => {
    const button = event.target.closest("button[data-stock-action]");

    if (!button) return;

    const product = stock.find(
        item => item.id === button.dataset.id
    );

    if (!product) return;

    const previousStock = stock;
    const action = button.dataset.stockAction;

    if (action === "add") {
        if (product.quantity >= Number.MAX_SAFE_INTEGER) {
            alert("Stock quantity has reached the maximum allowed value.");
            return;
        }

        stock = stock.map(item =>
            item.id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
        );
    }

    if (action === "delete") {
        const confirmed = confirm(
            `Delete ${product.name} from stock?`
        );

        if (!confirmed) return;

        stock = stock.filter(item => item.id !== product.id);
    }

    if (!saveData(STORAGE_KEYS.stock, stock)) {
        stock = previousStock;
        return;
    }

    renderStock();
    updateDashboard();
});

function updateLowStockNotice() {
    const lowItems = stock.filter(
        product => product.quantity <= product.minimumStock
    );

    const notice = getElement("lowStockNotice");

    if (lowItems.length === 0) {
        notice.textContent =
            "All recorded products are above their minimum stock levels.";
    } else {
        notice.textContent =
            "Low-stock warning: " +
            lowItems.map(product =>
                `${product.name} (${product.quantity} remaining)`
            ).join(", ");
    }
}

/* ---------- Sales Management ---------- */

getElement("salesForm").addEventListener("submit", event => {
    event.preventDefault();

    const customerId = getElement("saleCustomer").value;
    const productId = getElement("saleProduct").value;
    const quantity = Number(getElement("saleQuantity").value);
    const paymentMethod = getElement("paymentMethod").value;

    const customer = customers.find(
        item => item.id === customerId
    );

    const product = stock.find(
        item => item.id === productId
    );

    if (!customer || !product) {
        alert("Please select a valid customer and product.");
        return;
    }

    if (
        !Number.isSafeInteger(quantity) ||
        quantity < 1
    ) {
        alert("Please enter a valid quantity.");
        return;
    }

    if (quantity > product.quantity) {
        alert(
            `Insufficient stock. Only ${product.quantity} ` +
            `${product.name} item(s) are available.`
        );
        return;
    }

    const total = Math.round(
        product.price * quantity * 100
    ) / 100;

    if (!Number.isFinite(total) || total <= 0) {
        alert("Please check the product price and sale quantity.");
        return;
    }

    const sale = {
        id: createId(),
        receiptNumber:
            "REC-" + Date.now().toString().slice(-10),
        customerId: customer.id,
        customerName: customer.name,
        productId: product.id,
        productName: product.name,
        quantity,
        unitPrice: product.price,
        total,
        paymentMethod,
        date: new Date().toISOString()
    };

    const previousStock = stock;
    const previousSales = sales;

    stock = stock.map(item =>
        item.id === product.id
            ? { ...item, quantity: item.quantity - quantity }
            : item
    );

    sales.push(sale);

    if (!saveData(STORAGE_KEYS.stock, stock)) {
        stock = previousStock;
        sales = previousSales;
        return;
    }

    if (!saveData(STORAGE_KEYS.sales, sales)) {
        stock = previousStock;
        sales = previousSales;

        saveData(STORAGE_KEYS.stock, stock);

        return;
    }

    event.target.reset();

    renderStock();
    renderSales();
    renderBanking();
    updateDashboard();
    showReceipt(sale.id);

    alert("Sale recorded successfully.");
});

function renderSales() {
    const tbody = getElement("salesTableBody");

    if (sales.length === 0) {
        tbody.innerHTML = emptyRow(7, "No sales recorded yet.");
    } else {
        tbody.innerHTML = [...sales].reverse().map(sale => `
            <tr>
                <td>${escapeHTML(sale.receiptNumber)}</td>

                <td>${escapeHTML(formatDate(sale.date))}</td>

                <td>${escapeHTML(sale.customerName)}</td>

                <td>${escapeHTML(sale.productName)}</td>

                <td>${sale.quantity}</td>

                <td>${formatMoney(sale.total)}</td>

                <td>
                    <button
                        type="button"
                        class="table-btn"
                        data-receipt-id="${escapeHTML(sale.id)}">
                        View Receipt
                    </button>
                </td>
            </tr>
        `).join("");
    }

    const receiptSelect = getElement("bankReceipt");
    const previousValue = receiptSelect.value;

    receiptSelect.innerHTML = `
        <option value="">Select a sale</option>
        ${sales.map(sale => `
            <option value="${escapeHTML(sale.id)}">
                ${escapeHTML(sale.receiptNumber)}
                - ${escapeHTML(sale.customerName)}
            </option>
        `).join("")}
    `;

    if (sales.some(sale => sale.id === previousValue)) {
        receiptSelect.value = previousValue;
    }
}

getElement("salesTableBody").addEventListener("click", event => {
    const button = event.target.closest("button[data-receipt-id]");

    if (!button) return;

    showReceipt(button.dataset.receiptId);
});

/* ---------- Receipts ---------- */

function showReceipt(saleId) {
    const sale = sales.find(item => item.id === saleId);

    if (!sale) return;

    const output = getElement("receiptOutput");

    output.innerHTML = `
        <h3>Lindiwe's Bakery</h3>

        <p><strong>Developer:</strong> Lindiwe Kapi</p>

        <p><strong>Receipt Number:</strong>
            ${escapeHTML(sale.receiptNumber)}
        </p>

        <p><strong>Date:</strong>
            ${escapeHTML(formatDate(sale.date))}
        </p>

        <hr>

        <p><strong>Customer:</strong>
            ${escapeHTML(sale.customerName)}
        </p>

        <p><strong>Product:</strong>
            ${escapeHTML(sale.productName)}
        </p>

        <p><strong>Quantity:</strong> ${sale.quantity}</p>

        <p><strong>Unit Price:</strong>
            ${formatMoney(sale.unitPrice)}
        </p>

        <hr>

        <p><strong>Payment Method:</strong>
            ${escapeHTML(sale.paymentMethod)}
        </p>

        <h3>Total: ${formatMoney(sale.total)}</h3>

        <p>Thank you for supporting our bakery!</p>

        <button type="button" class="btn btn-primary" id="printReceipt">
            Print Receipt
        </button>
    `;

    getElement("printReceipt").addEventListener("click", () => {
        window.print();
    });
}

/* ---------- Banking and Payments ---------- */

getElement("bankingForm").addEventListener("submit", event => {
    event.preventDefault();

    const saleId = getElement("bankReceipt").value;
    const reference = getElement("bankReference").value.trim();
    const status = getElement("bankStatus").value;

    const sale = sales.find(item => item.id === saleId);

    if (!sale) {
        alert("Please select a valid sale.");
        return;
    }

    const previousPayments = payments;

    const existingPayment = payments.find(
        payment => payment.saleId === saleId
    );

    if (existingPayment) {
        payments = payments.map(payment =>
            payment.saleId === saleId
                ? {
                    ...payment,
                    reference,
                    status,
                    paymentMethod: sale.paymentMethod,
                    date: new Date().toISOString()
                }
                : payment
        );
    } else {
        payments.push({
            id: createId(),
            saleId,
            receiptNumber: sale.receiptNumber,
            reference,
            paymentMethod: sale.paymentMethod,
            status,
            date: new Date().toISOString()
        });
    }

    if (!saveData(STORAGE_KEYS.payments, payments)) {
        payments = previousPayments;
        return;
    }

    event.target.reset();

    renderBanking();

    alert("Payment record saved successfully.");
});

function renderBanking() {
    const tbody = getElement("bankingTableBody");

    if (payments.length === 0) {
        tbody.innerHTML = emptyRow(
            5,
            "No payment records yet."
        );
        return;
    }

    tbody.innerHTML = [...payments].reverse().map(payment => `
        <tr>
            <td>${escapeHTML(payment.receiptNumber)}</td>

            <td>${escapeHTML(payment.reference || "Not provided")}</td>

            <td>${escapeHTML(payment.paymentMethod)}</td>

            <td>${escapeHTML(formatDate(payment.date))}</td>

            <td>
                <span class="status ${
                    payment.status === "Paid"
                        ? "status-good"
                        : "status-pending"
                }">
                    ${escapeHTML(payment.status)}
                </span>
            </td>
        </tr>
    `).join("");
}

/* ---------- Dashboard ---------- */

function updateDashboard() {
    getElement("totalProducts").textContent = stock.length;

    getElement("totalCustomers").textContent = customers.length;

    const totalSales = sales.reduce(
        (sum, sale) => sum + sale.total,
        0
    );

    getElement("totalSales").textContent =
        formatMoney(totalSales);

    const lowStockCount = stock.filter(
        product => product.quantity <= product.minimumStock
    ).length;

    getElement("lowStockCount").textContent = lowStockCount;
}

/* ---------- Initial Setup ---------- */

function initialiseSystem() {
    getElement("currentYear").textContent =
        new Date().getFullYear();

    renderCustomers();
    renderStock();
    renderSales();
    renderBanking();
    updateDashboard();
}

initialiseSystem();