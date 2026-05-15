#!/bin/bash
# Hermes Agent 容器启动命令（优化版）
# 镜像: hermes-agent-root:0.11.0

docker run -d \
  --name hermes \
  -p 49080:8080 \
  -e TZ=Asia/Shanghai \
  -v /home/data/docker/hermes/data:/opt/data \
  -v /home/sys/docker/openclaw:/home/sys/docker/openclaw \
  -v /home/data/docker/workspace:/home/data/docker/workspace \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v /home/sys/docker/overlay2:/var/lib/docker/overlay2 \
  --restart unless-stopped \
  hermes-agent-root:0.11.0 gateway run
