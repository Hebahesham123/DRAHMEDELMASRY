import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="card card-pad empty">
      <h2>Not found</h2>
      <p>This page or item does not exist (it may have been deleted).</p>
      <Link className="btn" href="/admin">
        Back to overview
      </Link>
    </div>
  );
}
