export const metadata={title:'Sign out',robots:{index:false,follow:false}};
export default function Logout(){return <main className="wrap page-main"><h1>Sign out</h1><form method="post" action="/api/auth/logout"><button className="dark-button">Confirm sign out</button></form></main>}
