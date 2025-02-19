document.addEventListener('DOMContentLoaded', () => {
    // 获取DOM元素
    const throwBottle = document.getElementById('throwBottle');
    const pickBottle = document.getElementById('pickBottle');
    const writeMessage = document.getElementById('writeMessage');
    const readMessage = document.getElementById('readMessage');
    const sendMessage = document.getElementById('sendMessage');
    const message = document.getElementById('message');
    const foundMessage = document.getElementById('foundMessage');
    const closeButtons = document.querySelectorAll('.close');

    // 更新UI显示漂流瓶数量
    async function updateBottleCount() {
        try {
            const response = await fetch('/php/stats.php');
            const data = await response.json();
            if (data.success) {
                const countText = `海里还有 ${data.stats.waiting} 个漂流瓶`;
                document.querySelector('.bottle-count').textContent = countText;
            }
        } catch (error) {
            console.error('获取漂流瓶数量失败:', error);
        }
    }

    // 扔漂流瓶
    throwBottle.addEventListener('click', () => {
        writeMessage.classList.remove('hidden');
    });

    // 发送消息
    sendMessage.addEventListener('click', async () => {
        const content = message.value.trim();
        if (content) {
            const loading = showLoading('正在扔出漂流瓶...');
            try {
                // 添加调试日志
                console.log('Sending content:', content);
                
                const response = await fetchWithRetry('/php/throw.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: JSON.stringify({ content })
                });
                
                // 添加响应调试
                console.log('Response status:', response.status);
                const responseText = await response.text();
                console.log('Response text:', responseText);
                
                // 尝试解析JSON
                let data;
                try {
                    data = JSON.parse(responseText);
                } catch (e) {
                    console.error('JSON parse error:', e);
                    throw new Error('Invalid JSON response');
                }
                
                if (data.success) {
                    message.value = '';
                    writeMessage.classList.add('hidden');
                    showToast('漂流瓶已经扔出去啦！');
                    updateBottleCount();
                } else {
                    showToast(data.message || '扔漂流瓶失败，请重试！', 'error');
                }
            } catch (error) {
                console.error('Error sending bottle:', error);
                showToast('网络错误，请重试！', 'error');
            } finally {
                loading.remove();
            }
        } else {
            showToast('请写点什么吧！', 'warning');
        }
    });

    // 捡漂流瓶
    pickBottle.addEventListener('click', async () => {
        try {
            const response = await fetch('/php/pick.php', {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            
            console.log('Pick response status:', response.status);
            const responseText = await response.text();
            console.log('Pick response text:', responseText);
            
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                console.error('JSON parse error:', e);
                throw new Error('Invalid JSON response');
            }
            
            if (data.success) {
                foundMessage.innerHTML = `
                    <div class="bottle-content">${data.bottle.content}</div>
                    <div class="bottle-time">扔出时间：${new Date(data.bottle.time).toLocaleString()}</div>
                    <div class="bottle-picks">已被捡${data.bottle.pick_count}/5次</div>
                `;
                readMessage.classList.remove('hidden');
                updateBottleCount();
            } else {
                showToast(data.message || '海里暂时没有漂流瓶哦！', 'info');
            }
        } catch (error) {
            console.error('Error picking bottle:', error);
            showToast('网络错误，请重试！', 'error');
        }
    });

    // 添加提示框功能
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, 2000);
        }, 100);
    }

    // 初始化显示漂流瓶数量
    updateBottleCount();

    // 关闭按钮
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            writeMessage.classList.add('hidden');
            readMessage.classList.add('hidden');
        });
    });

    // 添加加载状态
    function showLoading(message = '加载中...') {
        const loading = document.createElement('div');
        loading.className = 'loading';
        loading.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-text">${message}</div>
        `;
        document.body.appendChild(loading);
        return loading;
    }

    // 添加确认对话框
    function showConfirm(message) {
        return new Promise((resolve) => {
            const dialog = document.createElement('div');
            dialog.className = 'confirm-dialog';
            dialog.innerHTML = `
                <div class="confirm-content">
                    <p>${message}</p>
                    <div class="confirm-buttons">
                        <button class="confirm-yes">确定</button>
                        <button class="confirm-no">取消</button>
                    </div>
                </div>
            `;
            document.body.appendChild(dialog);
            
            dialog.querySelector('.confirm-yes').onclick = () => {
                dialog.remove();
                resolve(true);
            };
            dialog.querySelector('.confirm-no').onclick = () => {
                dialog.remove();
                resolve(false);
            };
        });
    }

    // 添加加载动画
    function showLoading() {
        const loading = document.createElement('div');
        loading.className = 'loading-spinner';
        document.body.appendChild(loading);
        return loading;
    }

    // 添加错误重试机制
    async function fetchWithRetry(url, options, maxRetries = 3) {
        for (let i = 0; i < maxRetries; i++) {
            try {
                const response = await fetch(url, options);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response;
            } catch (error) {
                if (i === maxRetries - 1) throw error;
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
            }
        }
    }

    // 添加离线支持
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js');
    }
}); 