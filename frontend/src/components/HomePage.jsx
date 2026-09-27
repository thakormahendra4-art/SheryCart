import { useRef } from "react";
import { Link } from "react-router";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useAuth } from "../hooks/auth.hook";

const HomePage = () => {
  const { user, isSeller } = useAuth();
  const containerRef = useRef(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      // Ambient background blob animation
      gsap.to(".ambient-blob-1", {
        x: 30,
        y: 20,
        duration: 5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
      gsap.to(".ambient-blob-2", {
        x: -25,
        y: -15,
        duration: 6,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      // Hero sequence
      tl.from(".hero-badge", {
        y: -25,
        opacity: 0,
        duration: 0.7,
        ease: "back.out(1.8)",
      })
        .from(
          ".hero-title",
          {
            y: 35,
            opacity: 0,
            duration: 0.8,
          },
          "-=0.4"
        )
        .from(
          ".hero-desc",
          {
            y: 25,
            opacity: 0,
            duration: 0.7,
          },
          "-=0.5"
        )
        .from(
          ".hero-btn",
          {
            scale: 0.85,
            opacity: 0,
            duration: 0.6,
            stagger: 0.15,
            ease: "back.out(1.7)",
          },
          "-=0.4"
        )
        .from(
          ".feature-header",
          {
            y: 30,
            opacity: 0,
            duration: 0.7,
          },
          "-=0.2"
        )
        .from(
          ".feature-card",
          {
            y: 40,
            opacity: 0,
            duration: 0.6,
            stagger: 0.12,
            ease: "power2.out",
          },
          "-=0.4"
        );
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className="w-full overflow-hidden">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-lime-50/50 via-white to-gray-50 py-16 sm:py-24">
        {/* Ambient Decorative Blurs */}
        <div className="ambient-blob-1 pointer-events-none absolute -top-16 -left-16 h-72 w-72 rounded-full bg-lime-300/20 blur-3xl" />
        <div className="ambient-blob-2 pointer-events-none absolute top-1/2 -right-16 h-80 w-80 rounded-full bg-emerald-300/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* User Greeting Pill */}
            {user && (
              <div className="hero-badge inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-xs font-medium text-gray-700 shadow-xs border border-gray-200 mb-6">
                <span>
                  Welcome back, <strong className="text-gray-900">{user.name}</strong>
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    isSeller
                      ? "bg-lime-100 text-lime-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {isSeller ? "Seller Account" : "Customer Account"}
                </span>
              </div>
            )}

            <h1 className="hero-title text-4xl font-extrabold tracking-tight text-gray-900 sm:text-6xl">
              Everything You Need,{" "}
              <span className="text-lime-600">All in One Place.</span>
            </h1>

            <p className="hero-desc mx-auto mt-6 max-w-2xl text-base text-gray-600 sm:text-lg">
              Explore thousands of curated items across Electronics, Clothing,
              Books, Home essentials, and more — or list your own products to sell to
              buyers nationwide.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                to="/main/product"
                className="hero-btn rounded-xl bg-lime-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-lime-700 transition active:scale-95"
              >
                Browse Marketplace
              </Link>

              {isSeller ? (
                <Link
                  to="/main/product"
                  className="hero-btn rounded-xl border border-gray-300 bg-white px-6 py-3.5 text-sm font-semibold text-gray-800 shadow-2xs hover:bg-gray-50 transition active:scale-95"
                >
                  Manage Your Catalog
                </Link>
              ) : (
                <Link
                  to="/main/about"
                  className="hero-btn rounded-xl border border-gray-300 bg-white px-6 py-3.5 text-sm font-semibold text-gray-800 shadow-2xs hover:bg-gray-50 transition active:scale-95"
                >
                  Learn More
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="feature-header text-center mb-12">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Why Choose SheryCart?
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            A reliable marketplace built with speed, security, and developer clarity.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="feature-card rounded-2xl border border-gray-200 bg-white p-6 shadow-xs transition duration-200 hover:-translate-y-1 hover:shadow-lg">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-lime-100 text-lime-700 mb-4">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-gray-900">Curated Categories</h3>
            <p className="mt-2 text-xs text-gray-500 leading-relaxed">
              Quickly filter between Electronics, Clothing, Books, Home, and Beauty items.
            </p>
          </div>

          <div className="feature-card rounded-2xl border border-gray-200 bg-white p-6 shadow-xs transition duration-200 hover:-translate-y-1 hover:shadow-lg">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700 mb-4">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-gray-900">ImageKit Media</h3>
            <p className="mt-2 text-xs text-gray-500 leading-relaxed">
              Product images are uploaded directly to ImageKit CDN for lightning-fast loads.
            </p>
          </div>

          <div className="feature-card rounded-2xl border border-gray-200 bg-white p-6 shadow-xs transition duration-200 hover:-translate-y-1 hover:shadow-lg">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700 mb-4">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-gray-900">Role-Based Security</h3>
            <p className="mt-2 text-xs text-gray-500 leading-relaxed">
              Customers can explore safely, while verified sellers have full product ownership.
            </p>
          </div>

          <div className="feature-card rounded-2xl border border-gray-200 bg-white p-6 shadow-xs transition duration-200 hover:-translate-y-1 hover:shadow-lg">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-700 mb-4">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-gray-900">Realtime Updates</h3>
            <p className="mt-2 text-xs text-gray-500 leading-relaxed">
              Live updates to inventory, instant category searching, and responsive controls.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
