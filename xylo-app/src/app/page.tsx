import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 bg-white/10 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="text-3xl font-bold text-white">زايلو</span>
          <span className="text-purple-300 text-sm">Xylo</span>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link href="/articles" className="text-white/80 hover:text-white transition">
                المقالات
              </Link>
              <Link href="/wallet" className="text-white/80 hover:text-white transition">
                المحفظة
              </Link>
              <Link
                href="/profile"
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-full transition"
              >
                {user.display_name || user.username}
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="text-white/80 hover:text-white transition">
                تسجيل الدخول
              </Link>
              <Link
                href="/register"
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-full transition"
              >
                انضم الآن
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex flex-col items-center justify-center px-6 py-24 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            منصة المقالات{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              العربية
            </span>
          </h1>
          <p className="text-xl text-white/70 mb-12 max-w-2xl mx-auto leading-relaxed">
            اقرأ، اكتب، وادعم كُتّابك المفضلين مباشرة. منصة تجمع القراء والكُتّاب مع نظام
            دعم مالي لحظي.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              href="/articles"
              className="bg-white text-purple-900 hover:bg-purple-50 px-8 py-4 rounded-full text-lg font-semibold transition"
            >
              استكشف المقالات
            </Link>
            {!user && (
              <Link
                href="/register"
                className="bg-purple-500 hover:bg-purple-600 text-white px-8 py-4 rounded-full text-lg font-semibold transition border border-purple-400"
              >
                ابدأ الكتابة
              </Link>
            )}
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-white">
              <div className="text-4xl mb-4">📝</div>
              <h3 className="text-xl font-bold mb-2">محرر متقدم</h3>
              <p className="text-white/60 text-sm">
                اكتب مقالاتك باستخدام محرر نصوص غني بالميزات
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-white">
              <div className="text-4xl mb-4">🎁</div>
              <h3 className="text-xl font-bold mb-2">نظام الهدايا</h3>
              <p className="text-white/60 text-sm">
                ادعم كُتّابك المفضلين بإرسال هدايا افتراضية فورية
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-white">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-bold mb-2">اربح من كتابتك</h3>
              <p className="text-white/60 text-sm">
                حول إبداعك إلى دخل حقيقي مع نظام MALCOIN و QUSCOIN
              </p>
            </div>
          </div>

          {/* Currency Info */}
          <div className="mt-16 bg-white/5 backdrop-blur-sm rounded-3xl p-8 text-white">
            <h2 className="text-2xl font-bold mb-6">نظام العملات المزدوج</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-2xl p-6 border border-yellow-500/30">
                <div className="text-3xl mb-3">🪙</div>
                <h3 className="text-xl font-bold text-yellow-400 mb-2">MALCOIN</h3>
                <p className="text-white/70 text-sm">
                  عملة الشحن - اشترها لدعم كُتّابك وإرسال الهدايا
                </p>
                <div className="mt-3 text-yellow-400 font-semibold">
                  1$ = 500 MALCOIN
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl p-6 border border-green-500/30">
                <div className="text-3xl mb-3">��</div>
                <h3 className="text-xl font-bold text-green-400 mb-2">QUSCOIN</h3>
                <p className="text-white/70 text-sm">
                  عملة السحب - اكسبها من الهدايا وحولها لأموال حقيقية
                </p>
                <div className="mt-3 text-green-400 font-semibold">
                  80% من كل هدية تذهب للكاتب
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
