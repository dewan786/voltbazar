 'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <main className="unavailable"><h1>Something went wrong</h1><p>Please try again.</p><button onClick={reset}>Try again</button><a href="/">Back to store</a></main>}
