document.addEventListener('DOMContentLoaded', () => {
    // 綁定所有輸入欄位的事件監聽器，當值改變時重新計算
    const inputs = document.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('input', calculateTotal);
        input.addEventListener('change', calculateTotal);
    });

    // 初始計算一次
    calculateTotal();
});

// 處理加減按鈕
function updateCount(elementId, change) {
    const input = document.getElementById(elementId);
    let newVal = parseInt(input.value) + change;
    
    // 設定最小值
    const min = parseInt(input.getAttribute('min')) || 0;
    if (newVal >= min) {
        input.value = newVal;
        calculateTotal();
    }
}

// 處理開關顯示區域
function toggleDisplay(elementId, isShow) {
    const el = document.getElementById(elementId);
    if (isShow) {
        el.style.display = 'block';
    } else {
        el.style.display = 'none';
        // 如果隱藏，重設相關數值，避免錯誤計算
        if(elementId === 'personnel-details') {
            document.getElementById('weekday-days').value = 1;
            document.getElementById('weekend-days').value = 0;
            document.getElementById('personnel-count').value = 1;
        }
    }
    calculateTotal();
}

// 處理優惠選項
function toggleDiscountDetail() {
    const discountType = document.getElementById('discount-type').value;
    const detailEl = document.getElementById('discount-detail');
    
    if (discountType === 'custom') {
        detailEl.style.display = 'block';
    } else {
        detailEl.style.display = 'none';
        document.getElementById('discount-rate').value = 100; // 重置為 100%
    }
    calculateTotal();
}

// 格式化金錢
function formatMoney(num) {
    return '$' + num.toLocaleString('en-US');
}

// 主計算邏輯
function calculateTotal() {
    // 1. 場地費
    const basePrice = parseInt(document.getElementById('classroom-type').value) || 0;
    const segments = parseInt(document.getElementById('segment-count').value) || 1;
    let venueTotal = basePrice * segments;

    // 2. 人員協助費
    let personnelTotal = 0;
    const needPersonnel = document.getElementById('need-personnel').checked;
    if (needPersonnel) {
        const weekdays = parseInt(document.getElementById('weekday-days').value) || 0;
        const weekends = parseInt(document.getElementById('weekend-days').value) || 0;
        const count = parseInt(document.getElementById('personnel-count').value) || 1;
        
        personnelTotal = ((weekdays * 2000) + (weekends * 4000)) * count;
    }

    // 3. 環境與軟硬體雜費
    let softwareTotal = 2000; // 微軟商用授權費必定收取 2,000
    if (document.getElementById('software-install').checked) softwareTotal += 2000;

    const acHours = parseInt(document.getElementById('ac-hours').value) || 0;
    const acTotal = acHours * 300;

    // 4. 折扣計算
    let discountRate = 100; /* 預設 100% = 無折扣 */
    const discountTypeValue = document.getElementById('discount-type').value;
    if (discountTypeValue === 'custom') {
        discountRate = parseInt(document.getElementById('discount-rate').value) || 100;
        if (discountRate < 0) discountRate = 0;
        if (discountRate > 100) discountRate = 100;
    }

    // 可折扣項目總額 (場地 + 軟體佈署 + 空調)
    const discountableAmount = venueTotal + softwareTotal + acTotal;
    
    // 計算折扣後的紅利 (要扣掉的錢)
    const discountMinus = discountableAmount * (1 - (discountRate / 100));

    // 5. 小計與保證金
    const subtotal = discountableAmount + personnelTotal - discountMinus;
    
    // 保證金為總金額的 30% (依規章設定) => 通常是以小計金額算
    const deposit = Math.round(subtotal * 0.3);

    // 總計
    const grandTotal = subtotal + deposit;

    // 渲染畫面
    document.getElementById('res-venue').innerText = formatMoney(venueTotal);
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
