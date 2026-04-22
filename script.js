let cartItems = [];
let cartIdCounter = 0;

document.addEventListener('DOMContentLoaded', () => {
    // 綁定基礎事件
    document.getElementById('item-type').addEventListener('change', updateItemRoomLimit);

    // 初始限制與計算
    updateItemRoomLimit();
    calculateTotal();
});

// 當教室種類改變時，更新最大可借間數
function updateItemRoomLimit() {
    const select = document.getElementById('item-type');
    const selectedOption = select.options[select.selectedIndex];
    const maxLimit = parseInt(selectedOption.getAttribute('data-max')) || 1;
    
    const quantityInput = document.getElementById('item-rooms');
    document.getElementById('item-room-limit').innerText = maxLimit;
    quantityInput.max = maxLimit;
    
    validateItemLimit();
}

// 驗證是否超出間數上限
function validateItemLimit() {
    const quantityInput = document.getElementById('item-rooms');
    let val = parseInt(quantityInput.value) || 1;
    let max = parseInt(quantityInput.max) || 1;
    let min = parseInt(quantityInput.min) || 1;

    if (val > max) val = max;
    if (val < min) val = min;
    
    quantityInput.value = val;
}

// 共用更新數量按鈕
function updateItemCount(elementId, change) {
    const input = document.getElementById(elementId);
    let newVal = parseInt(input.value) + change;
    const min = parseInt(input.getAttribute('min')) || 0;
    const max = parseInt(input.getAttribute('max')) || 999;
    
    if (newVal >= min && newVal <= max) {
        input.value = newVal;
        if(elementId === 'item-rooms') {
            validateItemLimit();
        }
    }
}

// 加入清單
function addToCart() {
    const typeSelect = document.getElementById('item-type');
    const selectedOption = typeSelect.options[typeSelect.selectedIndex];
    
    const basePrice = parseInt(selectedOption.value);
    const typeName = selectedOption.getAttribute('data-name');
    const rooms = parseInt(document.getElementById('item-rooms').value) || 1;
    const segments = parseInt(document.getElementById('item-segments').value) || 1;
    const weekdayPersonnel = parseInt(document.getElementById('item-weekday-personnel').value) || 0;
    const weekendPersonnel = parseInt(document.getElementById('item-weekend-personnel').value) || 0;

    const item = {
        id: cartIdCounter++,
        typeName: typeName,
        basePrice: basePrice,
        rooms: rooms,
        segments: segments,
        weekdayPersonnel: weekdayPersonnel,
        weekendPersonnel: weekendPersonnel
    };

    cartItems.push(item);
    renderCart();
}

function removeItem(id) {
    cartItems = cartItems.filter(item => item.id !== id);
    renderCart();
}

function renderCart() {
    const container = document.getElementById('cart-container');
    const emptyMsg = document.getElementById('empty-cart-message');

    // 清空現有項目
    const existingItems = container.querySelectorAll('.cart-item-card');
    existingItems.forEach(el => el.remove());

    if (cartItems.length === 0) {
        if(emptyMsg) emptyMsg.style.display = 'block';
    } else {
        if(emptyMsg) emptyMsg.style.display = 'none';
        
        cartItems.forEach(item => {
            const cardHTML = `
                <div class="cart-item-card p-3 mb-2 slide-in" style="background: white; border: 1px solid #E2E8F0; border-radius: var(--border-radius-sm); border-left: 4px solid var(--primary); box-shadow: var(--shadow-sm);">
                    <div class="flex-between align-items-center">
                        <div>
                            <h4 class="mb-1" style="color: var(--primary-dark); font-size: 1.1rem; margin-top:0;">${item.typeName} <span style="font-size: 0.9rem; color: var(--text-muted); font-weight:normal;">x ${item.rooms} 間</span></h4>
                            <div class="text-muted" style="font-size: 0.95rem;">
                                <span>⏱ 總計 <b>${item.segments}</b> 個時段</span>
                                <span style="margin-left: 10px;">👤 平日協助 <b>${item.weekdayPersonnel}</b> 人/天</span>
                                <span style="margin-left: 10px;">👤 假日協助 <b>${item.weekendPersonnel}</b> 人/天</span>
                            </div>
                        </div>
                        <button class="btn-danger" style="background:#ef4444; color:white; border:none; padding:0.5rem 1rem; border-radius:4px; font-weight:600; cursor:pointer;" onmouseover="this.style.background='#dc2626'" onmouseout="this.style.background='#ef4444'" onclick="removeItem(${item.id})">刪除</button>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', cardHTML);
        });
    }

    calculateTotal();
}

function formatMoney(num) {
    return '$' + num.toLocaleString('en-US');
}

function calculateTotal() {
    let venueTotal = 0;
    let personnelTotal = 0;
    let acTotal = 0;

    cartItems.forEach(item => {
        // 場地費 = 單價 * 時段數 * 間數
        venueTotal += item.basePrice * item.segments * item.rooms;

        // 空調 = 時段數 * 4小時 * 300元 * 間數
        acTotal += (item.segments * 4 * 300) * item.rooms;

        // 人員費 = 平日(2000) + 假日(4000)
        personnelTotal += (item.weekdayPersonnel * 2000);
        personnelTotal += (item.weekendPersonnel * 4000);
    });

    // 軟體費 (全域)
    let softwareTotal = 2000; // 微軟必定收取
    if (document.getElementById('software-install').checked) softwareTotal += 2000;

    // 小計與保證金
    const subtotal = venueTotal + softwareTotal + acTotal + personnelTotal;
    const deposit = Math.round(subtotal * 0.3);
    const grandTotal = subtotal + deposit;

    // UI Render
    document.getElementById('res-venue').innerText = venueTotal > 0 ? formatMoney(venueTotal) : '$0';
    document.getElementById('res-personnel').innerText = formatMoney(personnelTotal);
    document.getElementById('res-software').innerText = formatMoney(softwareTotal);
    document.getElementById('res-ac').innerText = formatMoney(acTotal);
    
    document.getElementById('res-subtotal').innerText = formatMoney(Math.round(subtotal));
    document.getElementById('res-deposit').innerText = formatMoney(deposit);
    document.getElementById('res-total').innerText = formatMoney(Math.round(grandTotal));
}
