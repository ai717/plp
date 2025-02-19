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
    sendMessage.addEventListener('click', () => {
        const content = message.value.trim();
        if (content) {
            if (Storage.addBottle(content)) {
                message.value = '';
                writeMessage.classList.add('hidden');
                showToast('漂流瓶已经扔出去啦！');
                updateBottleCount();
            } else {
                showToast('扔漂流瓶失败，请重试！', 'error');
            }
        } else {
            showToast('请写点什么吧！', 'warning');
        }
    });

    // 捡漂流瓶
    pickBottle.addEventListener('click', () => {
        const bottle = Storage.pickBottle();
        if (bottle) {
            foundMessage.innerHTML = `
                <div class="bottle-content">${bottle.content}</div>
                <div class="bottle-time">扔出时间：${new Date(bottle.time).toLocaleString()}</div>
            `;
            readMessage.classList.remove('hidden');
            updateBottleCount();
        } else {
            showToast('海里暂时没有漂流瓶哦！', 'info');
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
}); 