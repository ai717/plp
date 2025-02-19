document.addEventListener('DOMContentLoaded', () => {
    // 检查登录状态
    checkLoginStatus();

    // 获取DOM元素
    const tabs = document.querySelectorAll('.tab');
    const thrownBottles = document.getElementById('thrownBottles');
    const pickedBottles = document.getElementById('pickedBottles');
    const backHome = document.getElementById('backHome');
    const changeUsername = document.getElementById('changeUsername');
    const changePassword = document.getElementById('changePassword');
    const usernameModal = document.getElementById('usernameModal');
    const passwordModal = document.getElementById('passwordModal');
    const saveUsername = document.getElementById('saveUsername');
    const savePassword = document.getElementById('savePassword');
    const closeButtons = document.querySelectorAll('.close');

    // 检查登录状态
    async function checkLoginStatus() {
        try {
            const response = await fetch('/php/check_login.php');
            const data = await response.json();
            if (!data.success) {
                window.location.href = '/';
                return;
            }
            document.getElementById('username').textContent = data.user.username;
            loadBottles('thrown');
        } catch (error) {
            console.error('检查登录状态失败:', error);
            window.location.href = '/';
        }
    }

    // 加载漂流瓶列表
    async function loadBottles(type) {
        const loading = showLoading();
        try {
            const response = await fetch(`/php/my_bottles.php?type=${type}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('JSON parse error:', e);
                console.error('Response text:', text);
                throw new Error('Invalid JSON response');
            }
            if (data.success) {
                const container = type === 'thrown' ? thrownBottles : pickedBottles;
                container.innerHTML = data.bottles.map(bottle => `
                    <div class="bottle-item">
                        <div class="bottle-content">${bottle.content}</div>
                        <div class="bottle-meta">
                            <span>${new Date(bottle.created_at).toLocaleString()}</span>
                            <span>被捡${bottle.pick_count}/5次</span>
                        </div>
                    </div>
                `).join('') || '<div class="empty">暂无漂流瓶</div>';
            } else {
                throw new Error(data.message || '加载失败');
            }
        } catch (error) {
            console.error('加载漂流瓶失败:', error);
            console.error('Error details:', error.stack);
            showToast('加载失败，请重试', 'error');
        } finally {
            loading.remove();
        }
    }

    // 切换标签
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const type = tab.dataset.tab;
            thrownBottles.classList.toggle('hidden', type !== 'thrown');
            pickedBottles.classList.toggle('hidden', type !== 'picked');
            loadBottles(type);
        });
    });

    // 返回首页
    backHome.addEventListener('click', () => {
        window.location.href = '/';
    });

    // 修改用户名
    changeUsername.addEventListener('click', () => {
        usernameModal.classList.remove('hidden');
    });

    // 修改密码
    changePassword.addEventListener('click', () => {
        passwordModal.classList.remove('hidden');
    });

    // 保存用户名
    saveUsername.addEventListener('click', async () => {
        const newUsername = document.getElementById('newUsername').value;
        if (!newUsername) {
            showToast('请输入新用户名', 'warning');
            return;
        }

        try {
            const response = await fetch('/php/update_profile.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'username', value: newUsername })
            });

            const data = await response.json();
            if (data.success) {
                showToast('用户名修改成功');
                document.getElementById('username').textContent = newUsername;
                usernameModal.classList.add('hidden');
            } else {
                showToast(data.message, 'error');
            }
        } catch (error) {
            console.error('修改用户名失败:', error);
            showToast('修改失败，请重试', 'error');
        }
    });

    // 保存密码
    savePassword.addEventListener('click', async () => {
        const oldPassword = document.getElementById('oldPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (!oldPassword || !newPassword || !confirmPassword) {
            showToast('请填写所有密码字段', 'warning');
            return;
        }

        if (newPassword !== confirmPassword) {
            showToast('两次输入的新密码不一致', 'error');
            return;
        }

        try {
            const response = await fetch('/php/update_profile.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'password',
                    oldPassword,
                    newPassword
                })
            });

            const data = await response.json();
            if (data.success) {
                showToast('密码修改成功');
                passwordModal.classList.add('hidden');
                document.getElementById('oldPassword').value = '';
                document.getElementById('newPassword').value = '';
                document.getElementById('confirmPassword').value = '';
            } else {
                showToast(data.message, 'error');
            }
        } catch (error) {
            console.error('修改密码失败:', error);
            showToast('修改失败，请重试', 'error');
        }
    });

    // 关闭按钮
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            usernameModal.classList.add('hidden');
            passwordModal.classList.add('hidden');
        });
    });

    // 显示提示框
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

    // 显示加载状态
    function showLoading() {
        const loading = document.createElement('div');
        loading.className = 'loading';
        loading.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-text">加载中...</div>
        `;
        document.body.appendChild(loading);
        return loading;
    }
}); 