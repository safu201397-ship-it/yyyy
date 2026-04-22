document.addEventListener('DOMContentLoaded', () => {
    // 綁定基礎事件
    document.getElementById('classroom-type').addEventListener('change', updateRoomMaxLimit);
    document.getElementById('discount-type').addEventListener('change', toggleDiscountDetail);
    document.getElementById('discount-rate').addEventListener('input', calculateTotal);
    document.getElementById('software-install').addEventListener('change', calculateTotal);

// 初始計算（更新預設字面）
    updateRoomMaxLimit();
});

// 當教室種類改變時，更新最大可借間數
function updateRoomMaxLimit() {
    const select = document.getElementById('classroom-type');
    const selectedOption = select.options[select.selectedIndex];
    const maxLimit = parseInt(selectedOption.getAttribute('data-max')) || 1;
    
    const quantityInput = document.getElementById('room-quantity');
    document.getElementById('room-limit').innerText = maxLimit;
    quantityInput.max = maxLimit;
    
    validateRoomLimit(); // 檢查且計算
}

// 驗證是否超出間數上限
function validateRoomLimit() {
    const quantityInput = document.getElementById('room-quantity');
    let val = parseInt(quantityInput.value) || 1;
    let max = parseInt(quantityInput.max) || 1;
    let min = parseInt(quantityInput.min) || 1;

    if (val > max) val = max;
    if (val < min) val = min;
    
    quantityInput.value = val;
    calculateTotal();
}

// 日期解析與產生
function generateDays() {
    const startStr = document.getElementById('start-date').value;
    const endStr = document.getElementById('end-date').value;
    const container = document.getElementById('cart-container');

    if (!startStr || !endStr) {
        alert("請先選擇開始與結束日期！");
        return;
    }

    const startDate = new Date(startStr);
    const endDate = new Date(endStr);
    
    if (startDate > endDate) {
        alert("開始日期不能晚於結束日期！");
        return;
    }

    // 計算天數差
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // 包含頭尾

    if (diffDays > 30) {
        if(!confirm("您選擇的區間超過 30 天，產生大量表單可能會影響效能。確定要繼續嗎？")) {
            return;
        }
    }

    // 清空容器
    container.innerHTML = '';

    const dayNames = ["日", "一", "二", "三", "四", "五", "六"];

    // 迴圈產生 DOM
    for (let i = 0; i < diffDays; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        
        const dateStr = `${currentDate.getFullYear()}/${(currentDate.getMonth()+1).toString().padStart(2, '0')}/${currentDate.getDate().toString().padStart(2, '0')}`;
        const dayOfWeek = currentDate.getDay(); // 0(日) ~ 6(六)
        const isDefaultHoliday = (dayOfWeek === 0 || dayOfWeek === 6);
        
        const cardId = `day-card-${i}`;

        const cardHTML = `
            <div class="daily-card" id="${cardId}">
                <div class="daily-card-header">
                    <span>📅 ${dateStr} (星期${dayNames[dayOfWeek]})</span>
                    <label class="holiday-toggle">
                        <input type="checkbox" class="is-holiday-cb" ${isDefaultHoliday ? 'checked' : ''} onchange="calculateTotal()">
                        假日費率 (國定假日可勾定)
                    </label>
                </div>
                <div class="daily-card-body">
                    <!-- 時段選擇 -->
                    <label class="section-label" style="font-size:0.95rem;">預定時段：</label>
                    <div class="segments-wrapper">
                        <label class="segment-checkbox">
                            <input type="checkbox" class="segment-cb" onchange="calculateTotal()"> 上午 (08:00-12:00)
                        </label>
                        <label class="segment-checkbox">
                            <input type="checkbox" class="segment-cb" onchange="calculateTotal()"> 下午 (13:00-17:00)
                        </label>
                        <label class="segment-checkbox">
                            <input type="checkbox" class="segment-cb" onchange="calculateTotal()"> 晚上 (18:00-22:00)
                        </label>
                    </div>

                    <!-- 人員協助 -->
                    <div class="personnel-config mt-2">
                        <label class="mb-0 text-muted">需要人員協助 (人數)：</label>
                        <div class="number-control" style="background:#f8fafc;">
                            <button type="button" onclick="updateCardCount('${cardId}-personnel', -1)">-</button>
                            <input type="number" id="${cardId}-personnel" class="personnel-count-input" value="0" min="0" onchange="calculateTotal()">
                            <button type="button" onclick="updateCardCount('${cardId}-personnel', 1)">+</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        container.insertAdjacentHTML('beforeend', cardHTML);
    }

    calculateTotal();
}

function updateCardCount(elementId, change) {
    const input = document.getElementById(elementId);
    let newVal = parseInt(input.value) + change;
    if (newVal >= 0) {
        input.value = newVal;
        calculateTotal();
    }
}

function updateCount(elementId, change) {
    const input = document.getElementById(elementId);
    let newVal = parseInt(input.value) + change;
    const min = parseInt(input.getAttribute('min')) || 0;
    const max = parseInt(input.getAttribute('max')) || 999;
    
    if (newVal >= min && newVal <= max) {
        input.value = newVal;
        if(elementId === 'room-quantity') {
            validateRoomLimit();
        } else {
            calculateTotal();
        }
    }
}

function toggleDiscountDetail() {
    const discountType = document.getElementById('discount-type').value;
    const detailEl = document.getElementById('discount-detail');
    if (discountType === 'custom') {
        detailEl.style.display = 'block';
    } else {
        detailEl.style.display = 'none';
        document.getElementById('discount-rate').value = 100;
    }
    calculateTotal();
}

function formatMoney(num) {
    return '$' + num.toLocaleString('en-US');
}

function calculateTotal() {
    // 獲取場地費數量加乘
    const roomQuantity = parseInt(document.getElementById('room-quantity').value) || 1;

    // 1. 場地費 - 統計所有購物車內的勾選時段
    const basePrice = parseInt(document.getElementById('classroom-type').value) || 0;
    const segmentCheckboxes = document.querySelectorAll('.segment-cb:checked');
    const totalSegments = segmentCheckboxes.length;
    let venueTotal = basePrice * totalSegments * roomQuantity; // 乘以間數

    // 2. 人員協助費 - 掃描每張卡片
    let personnelTotal = 0;
    const dailyCards = document.querySelectorAll('.daily-card');
    
    dailyCards.forEach(card => {
        const isHoliday = card.querySelector('.is-holiday-cb').checked;
        const personnelCount = parseInt(card.querySelector('.personnel-count-input').value) || 0;
        
        if (personnelCount > 0) {
            const dailyRate = isHoliday ? 4000 : 2000;
            personnelTotal += (dailyRate * personnelCount);
        }
    });

    // 3. 環境與軟硬體雜費
    let softwareTotal = 2000; // 微軟授權必定收取
    if (document.getElementById('software-install').checked) softwareTotal += 2000;

    // 空調自動計算：每一時段 4 小時，每小時 300 元，需乘上間數
    const acHours = totalSegments * 4;
    const acTotal = acHours * 300 * roomQuantity;

    // 4. 折扣計算
    let discountRate = 100;
    if (document.getElementById('discount-type').value === 'custom') {
        discountRate = parseInt(document.getElementById('discount-rate').value) || 100;
        if (discountRate < 0) discountRate = 0;
        if (discountRate > 100) discountRate = 100;
    }

    const discountableAmount = venueTotal + softwareTotal + acTotal;
    const discountMinus = discountableAmount * (1 - (discountRate / 100));

    // 5. 小計與保證金
    const subtotal = discountableAmount + personnelTotal - discountMinus;
    const deposit = Math.round(subtotal * 0.3);
    const grandTotal = subtotal + deposit;

    // UI Render
    document.getElementById('res-venue').innerText = totalSegments > 0 ? `${formatMoney(venueTotal)} (共 ${totalSegments} 時段)` : '$0';
    document.getElementById('res-personnel').innerText = formatMoney(personnelTotal);
    document.getElementById('res-software').innerText = formatMoney(softwareTotal);
    document.getElementById('res-ac').innerText = formatMoney(acTotal);
    
    const discountRow = document.getElementById('discount-row');
    if (discountMinus > 0) {
        discountRow.classList.remove('hidden');
        document.getElementById('res-discount').innerText = '- ' + formatMoney(Math.round(discountMinus));
    } else {
        discountRow.classList.add('hidden');
    }

    document.getElementById('res-subtotal').innerText = formatMoney(Math.round(subtotal));
    document.getElementById('res-deposit').innerText = formatMoney(deposit);
    document.getElementById('res-total').innerText = formatMoney(Math.round(grandTotal));
}
