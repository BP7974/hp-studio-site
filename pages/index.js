import Link from 'next/link';
import Layout from '../components/Layout';

export default function Home() {
  return (
    <Layout title="HP Studio · 黑白作品档案">
      <section className="hero">
        <p className="eyebrow">HP STUDIO</p>
        <h1>黑白之间，记录每一份灵感</h1>
        <p className="muted large">
          上传、收藏、分享。HP Studio 让每一位创作者以极简黑白风展示自己的文件作品。
        </p>
        <div className="actions">
          <Link href="/auth" className="primary">立即加入</Link>
          <Link href="/explore" className="ghost">浏览作品</Link>
        </div>
      </section>

      <section className="grid two">
        <div className="panel">
          <h2>公共作品墙</h2>
          <p>所有上传内容默认公开，任何访客都能浏览与下载，保持创作透明度。</p>
        </div>
        <div className="panel">
          <h2>电话 & 邮箱登录</h2>
          <p>兼顾国内外沟通习惯，既可以手机号注册，也可以邮箱登录。</p>
        </div>
      </section>

      <section className="panel">
        <h2>HP Studio 宗旨</h2>
        <ul className="bullets">
          <li>黑白极简的视觉体验，凸显作品本身。</li>
          <li>极速上传，自动生成可分享链接。</li>
          <li>团队协作友好，统一的工作室品牌形象。</li>
        </ul>
      </section>
    </Layout>
  );
}
