// components/ImageModal.jsx
import React from "react";

export default function ImageModal({ image, onClose }) {
  if (!image) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75">
      <div className="relative max-w-4xl max-h-full">
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
        >
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="bg-white rounded-xl overflow-hidden shadow-2xl">
          <img
            src={image.url}
            alt={image.title || "Image preview"}
            className="max-w-full max-h-[70vh] object-contain"
          />

          <div className="p-6 bg-gray-50">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {image.title || "Image Preview"}
                </h3>
                {image.recipient && (
                  <p className="text-gray-600 mt-1">
                    Sent to:{" "}
                    <span className="font-medium">{image.recipient}</span>
                  </p>
                )}
                {image.date && (
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(image.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                )}
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    window.open(image.url, "_blank");
                  }}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                  Open Full Size
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
