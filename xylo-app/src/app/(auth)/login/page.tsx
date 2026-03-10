import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-white">جارٍ التحميل...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
