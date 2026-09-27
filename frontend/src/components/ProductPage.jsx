import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useAuth } from "../hooks/auth.hook";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../services/product.service";

const CATEGORIES = [
  "All",
  "Electronics",
  "Clothing",
  "Books",
  "Home & Kitchen",
  "Beauty",
  "Other",
];

const ProductPage = () => {
  const { user, isSeller } = useAuth();
  const currentUserId = user?.id || user?._id;
  const pageContainerRef = useRef(null);

  // State
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successToast, setSuccessToast] = useState("");

  // Filters
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [sellerViewFilter, setSellerViewFilter] = useState("all"); // "all" | "mine"

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // null = Add, object = Edit
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Delete modal state
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Detail modal state
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    stock: "",
    category: "Electronics",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const fileInputRef = useRef(null);

  const isProductOwner = (product) => {
    if (!isSeller || !currentUserId) return false;
    const ownerId =
      product.createdBy?._id || product.createdBy?.id || product.createdBy;
    return ownerId?.toString() === currentUserId?.toString();
  };

  const myProductsCount = products.filter(isProductOwner).length;

  const displayedProducts = products.filter((p) => {
    if (sellerViewFilter === "mine") {
      return isProductOwner(p);
    }
    return true;
  });

  // GSAP: Animate header & controls on mount
  useGSAP(
    () => {
      gsap.from(".page-header", {
        y: -20,
        opacity: 0,
        duration: 0.6,
        ease: "power2.out",
      });
      gsap.from(".search-bar-container", {
        y: 20,
        opacity: 0,
        duration: 0.5,
        delay: 0.15,
        ease: "power2.out",
      });
      gsap.from(".category-pill", {
        scale: 0.85,
        opacity: 0,
        duration: 0.35,
        stagger: 0.04,
        delay: 0.25,
        ease: "back.out(1.5)",
      });
    },
    { scope: pageContainerRef }
  );

  // GSAP: Animate product cards when list updates
  useGSAP(
    () => {
      if (!loading && displayedProducts.length > 0) {
        gsap.fromTo(
          ".product-card",
          { opacity: 0, y: 25, scale: 0.96 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.45,
            stagger: 0.05,
            ease: "power2.out",
            clearProps: "transform,opacity",
          }
        );
      }
    },
    { scope: pageContainerRef, dependencies: [displayedProducts, loading] }
  );

  // GSAP: Animate modals when opened
  useGSAP(
    () => {
      if (isFormModalOpen || deletingProduct || selectedProduct) {
        gsap.fromTo(
          ".modal-box",
          { scale: 0.92, opacity: 0, y: 15 },
          {
            scale: 1,
            opacity: 1,
            y: 0,
            duration: 0.3,
            ease: "back.out(1.4)",
          }
        );
      }
    },
    {
      scope: pageContainerRef,
      dependencies: [isFormModalOpen, deletingProduct, selectedProduct],
    }
  );

  // Toast auto-hide
  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => setSuccessToast(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  // Load products
  const fetchProductsList = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getProducts({
        category: selectedCategory,
        search: activeSearch,
      });
      setProducts(res.data || []);
    } catch (err) {
      console.error("Error loading products:", err);
      setError(
        err.response?.data?.message || "Failed to load products. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductsList();
  }, [selectedCategory, activeSearch]);

  // Handle Search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setActiveSearch(searchQuery);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setActiveSearch("");
  };

  // Open Modal for Add
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormData({
      title: "",
      description: "",
      price: "",
      stock: "",
      category: "Electronics",
    });
    setImageFile(null);
    setImagePreview("");
    setFormError("");
    setIsFormModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEditModal = (product, e) => {
    e?.stopPropagation();
    setEditingProduct(product);
    setFormData({
      title: product.title || "",
      description: product.description || "",
      price: product.price?.toString() || "",
      stock: product.stock?.toString() || "",
      category: product.category || "Electronics",
    });
    setImageFile(null);
    setImagePreview(product.image?.url || "");
    setFormError("");
    setIsFormModalOpen(true);
  };

  // Handle Image File Selection
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setFormError("Please select a valid image file (PNG, JPG, WEBP).");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setFormError("Image size must be less than 5MB.");
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setFormError("");
    }
  };

  // Submit Product (Create or Update)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.title.trim()) {
      setFormError("Product title is required.");
      return;
    }
    if (!formData.description.trim()) {
      setFormError("Product description is required.");
      return;
    }
    if (formData.price === "" || Number(formData.price) < 0) {
      setFormError("Please enter a valid price.");
      return;
    }
    if (formData.stock === "" || Number(formData.stock) < 0) {
      setFormError("Please enter a valid stock amount.");
      return;
    }
    if (!editingProduct && !imageFile) {
      setFormError("Product image is required for new products.");
      return;
    }

    try {
      setIsSubmitting(true);
      const data = new FormData();
      data.append("title", formData.title.trim());
      data.append("description", formData.description.trim());
      data.append("price", formData.price);
      data.append("stock", formData.stock);
      data.append("category", formData.category);

      if (imageFile) {
        data.append("image", imageFile);
      }

      if (editingProduct) {
        await updateProduct(editingProduct._id, data);
        setSuccessToast("Product updated successfully!");
      } else {
        await createProduct(data);
        setSuccessToast("Product created and published successfully!");
      }

      setIsFormModalOpen(false);
      fetchProductsList();
    } catch (err) {
      console.error("Form submit error:", err);
      const serverMsg =
        err.response?.data?.errors?.[0]?.msg ||
        err.response?.data?.message ||
        "Failed to save product. Please try again.";
      setFormError(serverMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Action
  const handleDeleteConfirm = async () => {
    if (!deletingProduct) return;
    try {
      setIsDeleting(true);
      await deleteProduct(deletingProduct._id);
      setSuccessToast("Product removed successfully.");
      setDeletingProduct(null);
      fetchProductsList();
    } catch (err) {
      console.error("Delete error:", err);
      alert(
        err.response?.data?.message || "Failed to delete product. Please try again."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div ref={pageContainerRef} className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl bg-emerald-600 px-5 py-3.5 text-white shadow-xl animate-fade-in">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-medium text-sm">{successToast}</span>
          <button
            onClick={() => setSuccessToast("")}
            className="ml-2 rounded p-1 hover:bg-emerald-700 transition"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="page-header mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Explore Products
          </h1>
          <p className="mt-1.5 text-sm text-gray-500">
            {isSeller
              ? `Manage your catalog (${myProductsCount} items listed) or browse community offerings.`
              : "Discover quality products at the best prices."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isSeller && (
            <div className="flex items-center rounded-xl bg-gray-100 p-1 border border-gray-200">
              <button
                type="button"
                onClick={() => setSellerViewFilter("all")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  sellerViewFilter === "all"
                    ? "bg-white text-gray-900 shadow-2xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                All ({products.length})
              </button>
              <button
                type="button"
                onClick={() => setSellerViewFilter("mine")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  sellerViewFilter === "mine"
                    ? "bg-lime-600 text-white shadow-2xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                My Items ({myProductsCount})
              </button>
            </div>
          )}

          {isSeller && (
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-lime-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-lime-700 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-2 active:scale-95"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Add New Product
            </button>
          )}
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="search-bar-container mb-8 space-y-4">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative max-w-xl">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products by title..."
            className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-24 text-sm text-gray-900 placeholder-gray-400 shadow-xs focus:border-lime-500 focus:outline-none focus:ring-2 focus:ring-lime-500/20"
          />
          <div className="absolute inset-y-0 right-1.5 flex items-center gap-1">
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="rounded-lg p-1.5 text-xs text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
            <button
              type="submit"
              className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800 transition"
            >
              Search
            </button>
          </div>
        </form>

        {/* Category Pills */}
        <div className="flex items-center gap-2 pt-1 overflow-x-auto pb-1.5 sm:flex-wrap">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 mr-1 shrink-0">
            Category:
          </span>
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`category-pill shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                  isSelected
                    ? "bg-lime-600 text-white shadow-xs"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={fetchProductsList}
              className="font-medium underline hover:text-red-900 ml-4"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="animate-pulse overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-xs"
            >
              <div className="aspect-4/3 w-full rounded-xl bg-gray-200 mb-4" />
              <div className="h-4 w-3/4 rounded bg-gray-200 mb-2" />
              <div className="h-3 w-1/2 rounded bg-gray-200 mb-4" />
              <div className="flex items-center justify-between">
                <div className="h-6 w-1/3 rounded bg-gray-200" />
                <div className="h-8 w-1/3 rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && displayedProducts.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-white p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h3 className="mt-4 text-base font-semibold text-gray-900">
            {sellerViewFilter === "mine"
              ? "No items in your catalog match this filter"
              : "No products found"}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {sellerViewFilter === "mine"
              ? "Try selecting another category or adding a new product to your seller catalog."
              : activeSearch || selectedCategory !== "All"
              ? "Try adjusting your search or category filters to find what you are looking for."
              : "No products are currently available in the marketplace."}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            {(activeSearch || selectedCategory !== "All" || sellerViewFilter === "mine") && (
              <button
                onClick={() => {
                  setSelectedCategory("All");
                  setSellerViewFilter("all");
                  handleClearSearch();
                }}
                className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Reset Filters
              </button>
            )}
            {isSeller && (
              <button
                onClick={handleOpenAddModal}
                className="rounded-xl bg-lime-600 px-4 py-2 text-sm font-semibold text-white hover:bg-lime-700 active:scale-95"
              >
                Add New Product
              </button>
            )}
          </div>
        </div>
      )}

      {/* Products Grid */}
      {!loading && displayedProducts.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {displayedProducts.map((product) => {
            const isOwner = isProductOwner(product);
            const inStock = Number(product.stock) > 0;

            return (
              <div
                key={product._id}
                onClick={() => setSelectedProduct(product)}
                className="product-card group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs transition hover:border-gray-300 hover:shadow-lg cursor-pointer"
              >
                <div>
                  {/* Product Image */}
                  <div className="relative aspect-4/3 w-full overflow-hidden bg-gray-100">
                    <img
                      src={product.image?.url || "https://placehold.co/600x400?text=No+Image"}
                      alt={product.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Category Badge */}
                    <span className="absolute top-3 left-3 rounded-full bg-white/90 backdrop-blur-xs px-2.5 py-1 text-xs font-semibold text-gray-800 shadow-xs">
                      {product.category}
                    </span>

                    {/* Stock Badge */}
                    <span
                      className={`absolute top-3 right-3 rounded-full px-2.5 py-1 text-xs font-semibold shadow-xs ${
                        inStock
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : "bg-red-100 text-red-800 border border-red-200"
                      }`}
                    >
                      {inStock ? `In Stock (${product.stock})` : "Out of Stock"}
                    </span>
                  </div>

                  {/* Product Details */}
                  <div className="p-4">
                    <h3 className="line-clamp-1 text-base font-bold text-gray-900 group-hover:text-lime-600 transition">
                      {product.title}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-xs text-gray-500 leading-relaxed">
                      {product.description}
                    </p>

                    <div className="mt-3 flex items-baseline justify-between">
                      <span className="text-xl font-extrabold text-gray-900">
                        ₹{Number(product.price).toLocaleString("en-IN")}
                      </span>

                      <span className="text-xs text-gray-400 truncate max-w-[120px]">
                        By {product.createdBy?.name || "Seller"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="border-t border-gray-100 p-4 pt-3" onClick={(e) => e.stopPropagation()}>
                  {isOwner ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleOpenEditModal(product, e)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-300 bg-white py-2 text-xs font-semibold text-gray-700 shadow-2xs hover:bg-gray-50 hover:text-gray-900 transition active:scale-95"
                      >
                        <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                      <button
                        onClick={() => setDeletingProduct(product)}
                        className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50 p-2 text-xs font-semibold text-red-600 shadow-2xs hover:bg-red-100 transition active:scale-95"
                        title="Delete product"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <button
                      disabled={!inStock}
                      onClick={() =>
                        setSuccessToast(`Added "${product.title}" to cart!`)
                      }
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 py-2.5 text-xs font-semibold text-white shadow-2xs transition hover:bg-lime-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed active:scale-95"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {inStock ? "Add to Cart" : "Out of Stock"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT PRODUCT MODAL */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 overflow-hidden">
          <div className="modal-box relative w-full max-w-xl max-h-[90vh] sm:max-h-[85vh] rounded-2xl bg-white shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex-shrink-0 flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {editingProduct
                    ? "Update your product details and image below."
                    : "Fill in the details to publish a new product to the marketplace."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => !isSubmitting && setIsFormModalOpen(false)}
                disabled={isSubmitting}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={handleFormSubmit}
              className="flex-1 flex flex-col min-h-0 overflow-hidden"
            >
              {/* Scrollable Fields Body */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {/* Error Message */}
                {formError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                    {formError}
                  </div>
                )}

                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="e.g. Wireless Noise-Cancelling Headphones"
                    className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 shadow-2xs focus:border-lime-500 focus:outline-none focus:ring-2 focus:ring-lime-500/20"
                  />
                </div>

                {/* Category, Price, Stock in a Row */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {/* Category */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-2xs focus:border-lime-500 focus:outline-none focus:ring-2 focus:ring-lime-500/20"
                    >
                      {CATEGORIES.filter((c) => c !== "All").map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Price */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                      Price (₹) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      placeholder="2999"
                      className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900 shadow-2xs focus:border-lime-500 focus:outline-none focus:ring-2 focus:ring-lime-500/20"
                    />
                  </div>

                  {/* Stock */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                      Stock Units *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      required
                      value={formData.stock}
                      onChange={(e) =>
                        setFormData({ ...formData, stock: e.target.value })
                      }
                      placeholder="10"
                      className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900 shadow-2xs focus:border-lime-500 focus:outline-none focus:ring-2 focus:ring-lime-500/20"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Provide features, specifications, and warranty details..."
                    className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 shadow-2xs focus:border-lime-500 focus:outline-none focus:ring-2 focus:ring-lime-500/20"
                  />
                </div>

                {/* Image Upload Area */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                    Product Image {!editingProduct && "*"}
                  </label>

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="relative cursor-pointer transition hover:opacity-95"
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      accept="image/*"
                      className="hidden"
                    />

                    {imagePreview ? (
                      <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 p-3 hover:bg-gray-100/70 transition">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="h-20 w-20 rounded-lg object-cover border border-gray-200 shadow-2xs shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-800 truncate">
                            {imageFile ? imageFile.name : "Current Product Image"}
                          </p>
                          <p className="text-2xs text-lime-600 font-medium mt-0.5">
                            Click to choose a different image
                          </p>
                          <p className="text-3xs text-gray-400 mt-0.5">
                            PNG, JPG, WEBP up to 5MB
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setImageFile(null);
                            setImagePreview("");
                          }}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition"
                          title="Remove image"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 p-5 text-center hover:border-lime-500 hover:bg-lime-50/20 transition">
                        <svg
                          className="mx-auto h-8 w-8 text-gray-400"
                          stroke="currentColor"
                          fill="none"
                          viewBox="0 0 48 48"
                        >
                          <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <p className="mt-2 text-xs font-medium text-gray-700">
                          Click to upload product image
                        </p>
                        <p className="mt-0.5 text-2xs text-gray-400">
                          PNG, JPG, WEBP up to 5MB (Uploaded to ImageKit)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Fixed Modal Footer */}
              <div className="flex-shrink-0 flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50/80 px-6 py-3.5">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsFormModalOpen(false)}
                  className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-lime-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-lime-700 transition disabled:opacity-60 disabled:cursor-not-allowed active:scale-95"
                >
                  {isSubmitting && (
                    <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  )}
                  {isSubmitting
                    ? editingProduct
                      ? "Updating..."
                      : "Uploading..."
                    : editingProduct
                    ? "Update Product"
                    : "Publish Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="modal-box relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="mt-4 text-center">
              <h3 className="text-lg font-bold text-gray-900">Delete Product</h3>
              <p className="mt-2 text-xs text-gray-500">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-gray-800">
                  "{deletingProduct.title}"
                </span>
                ? This will also remove the image from ImageKit and cannot be undone.
              </p>
            </div>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingProduct(null)}
                className="w-full rounded-xl border border-gray-300 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="w-full rounded-xl bg-red-600 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-red-700 transition disabled:opacity-60 active:scale-95"
              >
                {isDeleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRODUCT QUICK VIEW MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 overflow-hidden">
          <div className="modal-box relative w-full max-w-2xl max-h-[90vh] rounded-2xl bg-white p-6 sm:p-8 shadow-2xl overflow-y-auto">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
            >
              ✕
            </button>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Product Large Image */}
              <div className="overflow-hidden rounded-xl bg-gray-100 aspect-square">
                <img
                  src={selectedProduct.image?.url || "https://placehold.co/600x400?text=No+Image"}
                  alt={selectedProduct.title}
                  className="h-full w-full object-cover"
                />
              </div>

              {/* Product Info */}
              <div className="flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="rounded-full bg-lime-100 px-2.5 py-0.5 text-xs font-semibold text-lime-800">
                      {selectedProduct.category}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        Number(selectedProduct.stock) > 0
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {Number(selectedProduct.stock) > 0
                        ? `${selectedProduct.stock} in stock`
                        : "Out of Stock"}
                    </span>
                  </div>

                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedProduct.title}
                  </h2>

                  <div className="mt-3 text-2xl font-extrabold text-gray-900">
                    ₹{Number(selectedProduct.price).toLocaleString("en-IN")}
                  </div>

                  <p className="mt-4 text-xs text-gray-600 leading-relaxed whitespace-pre-line">
                    {selectedProduct.description}
                  </p>

                  <div className="mt-4 border-t border-gray-100 pt-3 text-xs text-gray-500">
                    <div>
                      <span className="font-medium text-gray-700">Seller: </span>
                      {selectedProduct.createdBy?.name || "Verified Seller"}
                    </div>
                    {selectedProduct.createdBy?.email && (
                      <div className="mt-0.5">
                        <span className="font-medium text-gray-700">Contact: </span>
                        {selectedProduct.createdBy?.email}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100">
                  {isProductOwner(selectedProduct) ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const p = selectedProduct;
                          setSelectedProduct(null);
                          handleOpenEditModal(p);
                        }}
                        className="flex-1 rounded-xl bg-lime-600 py-2.5 text-xs font-semibold text-white hover:bg-lime-700 transition active:scale-95"
                      >
                        Edit This Product
                      </button>
                    </div>
                  ) : (
                    <button
                      disabled={Number(selectedProduct.stock) <= 0}
                      onClick={() => {
                        setSuccessToast(`Added "${selectedProduct.title}" to cart!`);
                        setSelectedProduct(null);
                      }}
                      className="w-full rounded-xl bg-gray-900 py-3 text-xs font-semibold text-white hover:bg-lime-600 transition disabled:bg-gray-200 disabled:text-gray-400 active:scale-95"
                    >
                      {Number(selectedProduct.stock) > 0
                        ? "Add to Shopping Cart"
                        : "Currently Unavailable"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductPage;
