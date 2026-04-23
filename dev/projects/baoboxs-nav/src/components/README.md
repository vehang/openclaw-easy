# 组件使用说明

## SuccessModal - 成功提示弹窗

一个可复用的成功提示弹窗组件，具有优雅的动画效果和自动关闭功能。

### 基本用法

```tsx
import SuccessModal from '@/components/SuccessModal';

function MyComponent() {
  const [showSuccess, setShowSuccess] = useState(false);

  return (
    <SuccessModal
      isOpen={showSuccess}
      title="操作成功！"
      message="您的操作已经完成"
      onClose={() => setShowSuccess(false)}
    />
  );
}
```

### Props 说明

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `isOpen` | `boolean` | - | 控制弹窗是否显示 |
| `title` | `string` | - | 弹窗标题 |
| `message` | `string` | - | 弹窗消息内容 |
| `icon` | `'check' \| 'paper-plane' \| 'heart' \| 'thumbs-up'` | `'check'` | 显示的图标类型 |
| `autoClose` | `boolean` | `true` | 是否自动关闭 |
| `autoCloseDelay` | `number` | `2000` | 自动关闭延迟时间（毫秒） |
| `onClose` | `() => void` | - | 关闭回调函数 |

### 图标类型

- `check` - 默认的对勾图标，适用于一般成功操作
- `paper-plane` - 纸飞机图标，适用于发送、提交类操作
- `heart` - 心形图标，适用于点赞、收藏类操作
- `thumbs-up` - 点赞图标，适用于评价、认可类操作

### 使用示例

#### 基本成功提示
```tsx
<SuccessModal
  isOpen={showSuccess}
  title="保存成功"
  message="数据已成功保存到服务器"
  onClose={() => setShowSuccess(false)}
/>
```

#### 发送成功（使用纸飞机图标）
```tsx
<SuccessModal
  isOpen={showSuccess}
  title="发送成功"
  message="您的消息已成功发送"
  icon="paper-plane"
  onClose={() => setShowSuccess(false)}
/>
```

#### 收藏成功（使用心形图标）
```tsx
<SuccessModal
  isOpen={showSuccess}
  title="收藏成功"
  message="已添加到您的收藏夹"
  icon="heart"
  onClose={() => setShowSuccess(false)}
/>
```

#### 自定义自动关闭时间
```tsx
<SuccessModal
  isOpen={showSuccess}
  title="操作完成"
  message="页面将在5秒后自动跳转"
  autoCloseDelay={5000}
  onClose={() => setShowSuccess(false)}
/>
```

#### 禁用自动关闭
```tsx
<SuccessModal
  isOpen={showSuccess}
  title="重要提示"
  message="请确认您已阅读此信息"
  autoClose={false}
  onClose={() => setShowSuccess(false)}
/>
```

### 设计特点

- **一致的视觉风格**：与项目整体设计保持一致
- **动画效果**：带有进度条动画显示自动关闭倒计时
- **可访问性**：支持键盘导航和屏幕阅读器
- **响应式设计**：在不同屏幕尺寸下都有良好表现
- **轻量级**：只依赖必要的图标组件

### 最佳实践

1. **合理使用自动关闭**：对于重要信息，建议禁用自动关闭
2. **选择合适的图标**：根据操作类型选择对应的图标
3. **保持消息简洁**：标题和消息内容应该简洁明了
4. **及时清理状态**：在组件卸载时记得清理相关状态 