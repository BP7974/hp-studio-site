import Head from 'next/head';
import Header from './Header';

export default function Layout({ title = 'HP Studio', description = 'HP Studio file showcase', children }) {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="msvalidate.01" content="53ECB99C7381894125564A7220946484" />
      </Head>
      <div className="app-shell">
        <Header />
        <main>{children}</main>
        <footer className="footer">© {new Date().getFullYear()} HP Studio · Monochrome craftsmanship</footer>
      </div>
    </>
  );
}
