import Layout from '../components/Layout';
import UploadForm from '../components/UploadForm';

export default function UploadPage() {
  return (
    <Layout title="文件上传">
      <section className="panel">
        <h2>上传你的作品</h2>
        <UploadForm />
      </section>
    </Layout>
  );
}
