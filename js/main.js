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

    // 存储消息的数组
    let messages = JSON.parse(localStorage.getItem('driftBottles')) || [];

    // 扔漂流瓶
    throwBottle.addEventListener('click', () => {
        writeMessage.classList.remove('hidden');
    });

    // 发送消息
    sendMessage.addEventListener('click', () => {
        if (message.value.trim()) {
            messages.push({
                content: message.value,
                time: new Date().toISOString()
            });
            localStorage.setItem('driftBottles', JSON.stringify(messages));
            message.value = '';
            writeMessage.classList.add('hidden');
            alert('漂流瓶已经扔出去啦！');
        } else {
            alert('请写点什么吧！');
        }
    });

    // 捡漂流瓶
    pickBottle.addEventListener('click', () => {
        if (messages.length > 0) {
            const randomIndex = Math.floor(Math.random() * messages.length);
            const pickedMessage = messages[randomIndex];
            foundMessage.textContent = pickedMessage.content;
            readMessage.classList.remove('hidden');
            
            // 捡到后删除这个漂流瓶
            messages.splice(randomIndex, 1);
            localStorage.setItem('driftBottles', JSON.stringify(messages));
        } else {
            alert('海里暂时没有漂流瓶哦！');
        }
    });

    // 关闭按钮
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            writeMessage.classList.add('hidden');
            readMessage.classList.add('hidden');
        });
    });
}); 