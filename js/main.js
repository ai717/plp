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

    // 数据持久化管理
    const Storage = {
        KEY: 'driftBottles',
        MAX_BOTTLES: 100, // 最大漂流瓶数量
        EXPIRE_DAYS: 7,   // 漂流瓶过期时间（天）

        // 获取所有有效的漂流瓶
        getBottles() {
            try {
                const bottles = JSON.parse(localStorage.getItem(this.KEY)) || [];
                const now = new Date().getTime();
                // 过滤掉过期的漂流瓶
                const validBottles = bottles.filter(bottle => {
                    const bottleTime = new Date(bottle.time).getTime();
                    return (now - bottleTime) < (this.EXPIRE_DAYS * 24 * 60 * 60 * 1000);
                });
                // 如果有过期瓶子被过滤，更新存储
                if (validBottles.length !== bottles.length) {
                    this.saveBottles(validBottles);
                }
                return validBottles;
            } catch (error) {
                console.error('读取漂流瓶失败:', error);
                return [];
            }
        },

        // 保存漂流瓶
        saveBottles(bottles) {
            try {
                localStorage.setItem(this.KEY, JSON.stringify(bottles));
                return true;
            } catch (error) {
                console.error('保存漂流瓶失败:', error);
                return false;
            }
        },

        // 添加新漂流瓶
        addBottle(content) {
            const bottles = this.getBottles();
            // 检查数量限制
            if (bottles.length >= this.MAX_BOTTLES) {
                // 移除最旧的漂流瓶
                bottles.shift();
            }
            
            const newBottle = {
                id: Date.now().toString(36) + Math.random().toString(36).substr(2),
                content,
                time: new Date().toISOString(),
                likes: 0
            };
            
            bottles.push(newBottle);
            return this.saveBottles(bottles);
        },

        // 随机获取一个漂流瓶
        pickBottle() {
            const bottles = this.getBottles();
            if (bottles.length === 0) return null;
            
            const index = Math.floor(Math.random() * bottles.length);
            const bottle = bottles[index];
            // 捡到后删除
            bottles.splice(index, 1);
            this.saveBottles(bottles);
            return bottle;
        },

        // 扔漂流瓶
        async addBottle(content) {
            try {
                const response = await fetch('/php/throw.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ content })
                });
                const result = await response.json();
                return result.success;
            } catch (error) {
                console.error('扔漂流瓶失败:', error);
                return false;
            }
        },

        // 捡漂流瓶
        async pickBottle() {
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
        }
    };

    // 更新UI显示漂流瓶数量
    function updateBottleCount() {
        const count = Storage.getBottles().length;
        const countText = `海里还有 ${count} 个漂流瓶`;
        document.querySelector('.bottle-count').textContent = countText;
    }

    // 扔漂流瓶
    throwBottle.addEventListener('click', () => {
        if (Storage.getBottles().length >= Storage.MAX_BOTTLES) {
            alert(`海里已经有${Storage.MAX_BOTTLES}个漂流瓶了，等一些瓶子被捡走后再来吧！`);
            return;
        }
        writeMessage.classList.remove('hidden');
    });

    // 发送消息
    sendMessage.addEventListener('click', async () => {
        const content = message.value.trim();
        if (content) {
            try {
                // 添加调试日志
                console.log('Sending content:', content);
                
                const response = await fetch('/php/throw.php', {
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