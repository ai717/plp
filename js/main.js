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

    // 用户相关元素
    const loginSection = document.getElementById('loginSection');
    const userSection = document.getElementById('userSection');
    const showLogin = document.getElementById('showLogin');
    const showRegister = document.getElementById('showRegister');
    const loginModal = document.getElementById('loginModal');
    const registerModal = document.getElementById('registerModal');
    const loginSubmit = document.getElementById('loginSubmit');
    const registerSubmit = document.getElementById('registerSubmit');
    const logout = document.getElementById('logout');
    const myCoast = document.getElementById('myCoast');

    // 更新UI显示漂流瓶数量
    async function updateBottleCount() {
        try {
            const response = await fetch(`/php/stats.php?t=${Date.now()}`);
            const data = await response.json();
            if (data.success) {
                const countText = `海里还有 ${data.stats.waiting} 个漂流瓶`;
                document.querySelector('.bottle-count').textContent = countText;
                return data.stats.waiting;
            }
        } catch (error) {
            console.error('获取漂流瓶数量失败:', error);
        }
        return null;
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
                console.group('扔漂流瓶');
                console.log('Content:', content);
                console.log('Content length:', content.length);
                
                const response = await fetchWithRetry('/php/throw.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: JSON.stringify({ content })
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                console.log('Response status:', response.status);
                console.log('Response headers:', Object.fromEntries(response.headers));
                const responseText = await response.text();
                console.log('Response text:', responseText);
                
                let data;
                try {
                    data = JSON.parse(responseText);
                    console.log('Parsed data:', data);
                } catch (e) {
                    console.error('JSON parse error:', e);
                    throw new Error('Invalid JSON response');
                }
                console.groupEnd();
                
                if (data.success) {
                    message.value = '';
                    writeMessage.classList.add('hidden');
                    showToast('漂流瓶已经扔出去啦！');
                    await updateBottleCount();
                } else {
                    console.error('Server error:', data.message);
                    showToast(data.message || '扔漂流瓶失败，请重试！', 'error');
                }
            } catch (error) {
                console.error('Error sending bottle:', error);
                console.error('Error details:', error.stack);
                showToast('网络错误，请重试！', 'error');
            } finally {
                loading.remove();
                console.groupEnd();
            }
        } else {
            showToast('请写点什么吧！', 'warning');
        }
    });

    // 捡漂流瓶
    pickBottle.addEventListener('click', async () => {
        // 检查是否登录
        const response = await fetch('/php/check_login.php');
        const loginStatus = await response.json();
        if (!loginStatus.success) {
            showToast('请先登录后再捡漂流瓶', 'warning');
            loginModal.classList.remove('hidden');
            return;
        }

        const loading = showLoading('正在捡漂流瓶...');
        try {
            console.group('捡漂流瓶');
            const response = await fetchWithRetry('/php/pick.php', {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            console.log('Pick response status:', response.status);
            const responseText = await response.text();
            console.log('Pick response text:', responseText);
            
            let data;
            try {
                data = JSON.parse(responseText);
                console.log('Parsed data:', data);
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
                await updateBottleCount();
            } else {
                console.error('Server error:', data.message);
                showToast(data.message || '海里暂时没有漂流瓶哦！', 'info');
            }
            console.groupEnd();
        } catch (error) {
            console.error('Error picking bottle:', error);
            console.error('Error details:', error.stack);
            showToast('网络错误，请重试！', 'error');
        } finally {
            loading.remove();
            console.groupEnd();
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
            loginModal.classList.add('hidden');  // 关闭登录模态框
            registerModal.classList.add('hidden');  // 关闭注册模态框
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

    // 检查登录状态
    async function checkLoginStatus() {
        try {
            const response = await fetch('/php/check_login.php');
            const data = await response.json();
            if (data.success) {
                loginSection.classList.add('hidden');
                userSection.classList.remove('hidden');
                userSection.querySelector('.username').textContent = data.user.username;
            } else {
                loginSection.classList.remove('hidden');
                userSection.classList.add('hidden');
            }
        } catch (error) {
            console.error('检查登录状态失败:', error);
        }
    }

    // 登录功能
    loginSubmit.addEventListener('click', async () => {
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const response = await fetch('/php/login.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            if (data.success) {
                showToast('登录成功');
                loginModal.classList.add('hidden');
                checkLoginStatus();
            } else {
                showToast(data.message, 'error');
            }
        } catch (error) {
            console.error('登录失败:', error);
            showToast('登录失败，请重试', 'error');
        }
    });

    // 注册功能
    registerSubmit.addEventListener('click', async () => {
        const username = document.getElementById('registerUsername').value;
        const password = document.getElementById('registerPassword').value;

        try {
            const response = await fetch('/php/register.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            if (data.success) {
                showToast('注册成功，请登录');
                registerModal.classList.add('hidden');
                loginModal.classList.remove('hidden');
            } else {
                showToast(data.message, 'error');
            }
        } catch (error) {
            console.error('注册失败:', error);
            showToast('注册失败，请重试', 'error');
        }
    });

    // 显示登录框
    showLogin.addEventListener('click', () => {
        loginModal.classList.remove('hidden');
    });

    // 显示注册框
    showRegister.addEventListener('click', () => {
        registerModal.classList.remove('hidden');
    });

    // 退出登录
    logout.addEventListener('click', async () => {
        try {
            await fetch('/php/logout.php');
            checkLoginStatus();
            showToast('已退出登录');
        } catch (error) {
            console.error('退出失败:', error);
            showToast('退出失败，请重试', 'error');
        }
    });

    // 跳转到个人页面
    myCoast.addEventListener('click', () => {
        window.location.href = '/coast.html';
    });

    // 初始化检查登录状态
    checkLoginStatus();
}); 