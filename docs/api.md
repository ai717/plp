# 漂流瓶API文档

## 扔漂流瓶
POST /php/throw.php
请求体：
{
    "content": "漂流瓶内容"
}

## 捡漂流瓶
GET /php/pick.php

## 举报漂流瓶
POST /php/report.php
请求体：
{
    "bottle_id": 123,
    "reason": "举报原因"
} 