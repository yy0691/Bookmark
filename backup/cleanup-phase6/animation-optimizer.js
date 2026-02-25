/**
 * 动画性能优化器 - 简化版本
 * 专门优化悬停和点击动画，移除离开动画
 */

class AnimationOptimizer {
    constructor() {
        this.optimizationLevel = 'full';
        this.init();
    }

    init() {
        console.log('🎬 动画性能优化器初始化...');
        this.optimizeHoverAnimations();
        this.optimizeClickAnimations();
        this.setupPerformanceMonitoring();
    }

    /**
     * 优化悬停动画 - 只保留进入动画
     */
    optimizeHoverAnimations() {
        const hoverElements = document.querySelectorAll('.bookmark-item, .folder-item, .btn, .action-btn');
        
        hoverElements.forEach(element => {
            // 移除默认过渡效果
            element.style.transition = 'none';
            
            // 添加悬停事件
            element.addEventListener('mouseenter', (e) => {
                this.addHoverEffect(e.target);
            });
            
            // 鼠标离开时立即恢复，不使用动画
            element.addEventListener('mouseleave', (e) => {
                this.removeHoverEffect(e.target);
            });
        });
    }

    /**
     * 添加悬停效果
     */
    addHoverEffect(element) {
        if (this.optimizationLevel === 'none') return;
        
        const elementType = this.getElementType(element);
        
        switch (elementType) {
            case 'bookmark-item':
                element.style.transition = 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)';
                element.style.transform = 'translateZ(0) translateY(-2px) scale(1.02)';
                element.style.background = 'rgba(255, 255, 255, 0.2)';
                break;
            case 'folder-item':
                element.style.transition = 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)';
                element.style.transform = 'translateZ(0) translateX(3px) scale(1.01)';
                break;
            case 'btn':
            case 'action-btn':
                element.style.transition = 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)';
                element.style.transform = 'translateZ(0) translateY(-1px)';
                break;
        }
    }

    /**
     * 移除悬停效果 - 立即恢复，不使用动画
     */
    removeHoverEffect(element) {
        const elementType = this.getElementType(element);
        
        // 立即移除过渡效果
        element.style.transition = 'none';
        
        switch (elementType) {
            case 'bookmark-item':
                element.style.transform = 'translateZ(0)';
                element.style.background = '';
                break;
            case 'folder-item':
                element.style.transform = 'translateZ(0)';
                break;
            case 'btn':
            case 'action-btn':
                element.style.transform = 'translateZ(0)';
                break;
        }
        
        // 强制重绘
        element.offsetHeight;
    }

    /**
     * 优化点击动画
     */
    optimizeClickAnimations() {
        const clickElements = document.querySelectorAll('.btn, .action-btn, .bookmark-item, .folder-item');
        
        clickElements.forEach(element => {
            element.addEventListener('mousedown', (e) => {
                this.addClickEffect(e.target);
            });
            
            element.addEventListener('mouseup', (e) => {
                this.removeClickEffect(e.target);
            });
            
            // 防止拖拽时触发点击效果
            element.addEventListener('dragstart', (e) => {
                e.preventDefault();
            });
        });
    }

    /**
     * 添加点击效果
     */
    addClickEffect(element) {
        if (this.optimizationLevel === 'none') return;
        
        element.style.transition = 'transform 0.08s cubic-bezier(0.4, 0, 0.2, 1)';
        element.style.transform = 'translateZ(0) scale(0.98)';
    }

    /**
     * 移除点击效果
     */
    removeClickEffect(element) {
        element.style.transition = 'none';
        element.style.transform = 'translateZ(0)';
        element.offsetHeight; // 强制重绘
    }

    /**
     * 获取元素类型
     */
    getElementType(element) {
        if (element.classList.contains('bookmark-item')) return 'bookmark-item';
        if (element.classList.contains('folder-item')) return 'folder-item';
        if (element.classList.contains('btn')) return 'btn';
        if (element.classList.contains('action-btn')) return 'action-btn';
        return 'default';
    }

    /**
     * 设置性能监控
     */
    setupPerformanceMonitoring() {
        // 监控帧率
        let frameCount = 0;
        let lastTime = performance.now();
        
        const checkFrameRate = () => {
            frameCount++;
            const currentTime = performance.now();
            
            if (currentTime - lastTime >= 1000) {
                const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
                
                // 如果帧率过低，自动降低动画级别
                if (fps < 30 && this.optimizationLevel === 'full') {
                    this.setOptimizationLevel('reduced');
                    console.warn(`⚠️ 帧率过低 (${fps}fps)，自动降低动画级别`);
                }
                
                frameCount = 0;
                lastTime = currentTime;
            }
            
            requestAnimationFrame(checkFrameRate);
        };
        
        requestAnimationFrame(checkFrameRate);
    }

    /**
     * 设置优化级别
     */
    setOptimizationLevel(level) {
        this.optimizationLevel = level;
        console.log(`🎬 动画级别已设置为: ${level}`);
    }

    /**
     * 优化现有动画
     */
    optimizeExistingAnimations() {
        // 为所有动画元素添加硬件加速
        const animatedElements = document.querySelectorAll('.bookmark-item, .folder-item, .btn, .action-btn');
        
        animatedElements.forEach(element => {
            element.style.willChange = 'transform, opacity';
            element.style.transform = 'translateZ(0)';
            element.style.backfaceVisibility = 'hidden';
        });
    }
}

// 初始化动画优化器
let animationOptimizer;

document.addEventListener('DOMContentLoaded', () => {
    animationOptimizer = new AnimationOptimizer();
    animationOptimizer.optimizeExistingAnimations();
});

// 导出优化器实例
window.AnimationOptimizer = AnimationOptimizer;
window.animationOptimizer = animationOptimizer; 