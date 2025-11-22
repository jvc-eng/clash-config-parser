class ClashConfigParser {
    constructor() {
        this.configs = new Map(); // 存储文件名和配置的映射
        this.allNodes = []; // 所有提取的节点
        this.subscriptionId = this.generateSubscriptionId();
        
        this.initializeEventListeners();
    }

    // 生成唯一的订阅ID
    generateSubscriptionId() {
        return 'clash-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    initializeEventListeners() {
        const fileInput = document.getElementById('fileInput');
        const uploadArea = document.getElementById('uploadArea');

        // 文件选择事件
        fileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });

        // 拖放事件
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            this.handleFiles(e.dataTransfer.files);
        });

        // 点击上传区域触发文件选择
        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });
    }

    async handleFiles(files) {
        const validFiles = Array.from(files).filter(file => 
            file.name.toLowerCase().endsWith('.yaml') || 
            file.name.toLowerCase().endsWith('.yml')
        );

        if (validFiles.length === 0) {
            this.showError('请选择有效的 YAML 配置文件');
            return;
        }

        for (const file of validFiles) {
            await this.processFile(file);
        }

        this.updateUI();
    }

    async processFile(file) {
        try {
            const content = await this.readFileContent(file);
            const config = jsyaml.load(content);
            
            if (!config) {
                throw new Error('无效的 YAML 文件');
            }

            this.configs.set(file.name, config);
            this.extractNodesFromConfig(config, file.name);
            
        } catch (error) {
            this.showError(`处理文件 ${file.name} 时出错: ${error.message}`);
        }
    }

    readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('文件读取失败'));
            reader.readAsText(file);
        });
    }

    extractNodesFromConfig(config, fileName) {
        const nodes = [];
        
        // 从 proxies 字段提取节点
        if (config.proxies && Array.isArray(config.proxies)) {
            nodes.push(...config.proxies.map(node => ({
                ...node,
                sourceFile: fileName
            })));
        }

        // 从 proxy-groups 的 proxies 字段提取节点（如果存在）
        if (config['proxy-groups'] && Array.isArray(config['proxy-groups'])) {
            config['proxy-groups'].forEach(group => {
                if (group.proxies && Array.isArray(group.proxies)) {
                    group.proxies.forEach(proxyName => {
                        // 检查这个代理名是否已经在节点列表中
                        if (!nodes.find(node => node.name === proxyName)) {
                            nodes.push({
                                name: proxyName,
                                type: 'unknown',
                                server: 'unknown',
                                sourceFile: fileName
                            });
                        }
                    });
                }
            });
        }

        this.allNodes.push(...nodes);
        return nodes;
    }

    updateUI() {
        this.updateFileList();
        this.updateStats();
        this.updateNodesList();
        this.generateSubscriptionUrl();
    }

    updateFileList() {
        const fileList = document.getElementById('fileList');
        fileList.innerHTML = '';

        this.configs.forEach((config, fileName) => {
            const nodes = this.allNodes.filter(node => node.sourceFile === fileName);
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <span class="file-name">${fileName}</span>
                <span class="file-nodes">${nodes.length} 节点</span>
            `;
            fileList.appendChild(fileItem);
        });
    }

    updateStats() {
        document.getElementById('totalFiles').textContent = this.configs.size;
        document.getElementById('totalNodes').textContent = this.allNodes.length;
        
        const nodeTypes = new Set(this.allNodes.map(node => node.type));
        document.getElementById('nodeTypes').textContent = nodeTypes.size;
    }

    updateNodesList() {
        const nodesList = document.getElementById('nodesList');
        nodesList.innerHTML = '';

        if (this.allNodes.length === 0) {
            nodesList.innerHTML = '<div class="error">未找到任何节点</div>';
            return;
        }

        this.allNodes.forEach(node => {
            const nodeItem = document.createElement('div');
            nodeItem.className = 'node-item';
            nodeItem.innerHTML = `
                <div>
                    <span class="node-name">${this.escapeHtml(node.name)}</span>
                    <span class="node-type">${this.escapeHtml(node.type)}</span>
                </div>
                <div class="node-server">${this.escapeHtml(node.server)}:${node.port}</div>
                <div style="font-size: 0.8rem; color: #94a3b8; margin-top: 5px;">
                    来自: ${this.escapeHtml(node.sourceFile)}
                </div>
            `;
            nodesList.appendChild(nodeItem);
        });
    }

    generateSubscriptionUrl() {
        if (this.allNodes.length === 0) {
            document.getElementById('subscriptionUrl').value = '';
            return;
        }

        // 创建新的配置，只包含提取的节点
        const subscriptionConfig = {
            port: 7890,
            'socks-port': 7891,
            'redir-port': 7892,
            'allow-lan': true,
            mode: 'rule',
            'log-level': 'info',
            proxies: this.allNodes.map(node => {
                const { sourceFile, ...nodeConfig } = node;
                return nodeConfig;
            })
        };

        // 将配置转换为 YAML 并编码为 base64
        const yamlConfig = jsyaml.dump(subscriptionConfig);
        const base64Config = btoa(unescape(encodeURIComponent(yamlConfig)));
        
        // 生成订阅链接（在实际部署中，这应该指向您的 Worker 端点）
        const baseUrl = window.location.origin;
        const subscriptionUrl = `${baseUrl}/api/subscribe/${this.subscriptionId}?config=${base64Config}`;
        
        document.getElementById('subscriptionUrl').value = subscriptionUrl;
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    showError(message) {
        const nodesList = document.getElementById('nodesList');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error';
        errorDiv.textContent = message;
        nodesList.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    showSuccess(message) {
        const nodesList = document.getElementById('nodesList');
        const successDiv = document.createElement('div');
        successDiv.className = 'success';
        successDiv.textContent = message;
        nodesList.appendChild(successDiv);
        
        setTimeout(() => {
            successDiv.remove();
        }, 3000);
    }
}

// 复制订阅链接功能
function copySubscriptionUrl() {
    const subscriptionUrl = document.getElementById('subscriptionUrl');
    if (!subscriptionUrl.value) {
        alert('请先上传配置文件生成订阅链接');
        return;
    }

    subscriptionUrl.select();
    subscriptionUrl.setSelectionRange(0, 99999);
    
    try {
        navigator.clipboard.writeText(subscriptionUrl.value).then(() => {
            alert('订阅链接已复制到剪贴板');
        }).catch(() => {
            // 如果 Clipboard API 失败，使用传统方法
            document.execCommand('copy');
            alert('订阅链接已复制到剪贴板');
        });
    } catch (error) {
        // 降级方案
        document.execCommand('copy');
        alert('订阅链接已复制到剪贴板');
    }
}

// 初始化应用
let parser;
document.addEventListener('DOMContentLoaded', () => {
    parser = new ClashConfigParser();
});
