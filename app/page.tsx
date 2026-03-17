// import { redirect } from "next/navigation";

// The middleware handles locale detection and redirects.
// This fallback ensures any un-intercepted request still resolves.
export default function RootPage() {
  // redirect("/ko");
  return (
    <main>
      <h1>KickVista</h1>
    </main>
  )
}