export default function FileCard({ file }) {
  return (
    <article className="file-card">
      <div>
        <h3>{file.title}</h3>
        <p className="muted">{file.description || '无描述'}</p>
      </div>
      <div className="file-meta">
        <p>上传者：{file.uploader || 'hp studio'}</p>
        <p>{new Date(file.created_at).toLocaleString()}</p>
        <a className="ghost" href={file.downloadUrl}>下载 {file.original_name}</a>
      </div>
    </article>
  );
}
