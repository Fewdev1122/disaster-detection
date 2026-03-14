let loaderPromise = null;

export function loadGoogleMaps() {
  if (window.google?.maps?.importLibrary) {
    return Promise.resolve(window.google);
  }

  if (loaderPromise) {
    return loaderPromise;
  }

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return Promise.reject(
      new Error("Missing VITE_GOOGLE_MAPS_API_KEY in .env")
    );
  }

  loaderPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(
      'script[data-google-maps-loader="1"]'
    );

    if (existing) {
      if (window.google?.maps?.importLibrary) {
        resolve(window.google);
        return;
      }

      existing.addEventListener("load", () => resolve(window.google), {
        once: true,
      });
      existing.addEventListener(
        "error",
        () => reject(new Error("Google Maps failed to load")),
        { once: true }
      );
      return;
    }

    const callbackName = `__googleMapsInit_${Date.now()}`;

    window[callbackName] = () => {
      if (window.google?.maps) {
        resolve(window.google);
      } else {
        reject(new Error("Google Maps loaded but maps object missing"));
      }
      delete window[callbackName];
    };

    const script = document.createElement("script");
    script.dataset.googleMapsLoader = "1";
    script.async = true;
    script.defer = true;
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${apiKey}` +
      `&loading=async` +
      `&callback=${callbackName}` +
      `&v=weekly`;

    script.onerror = () => {
      reject(new Error("Failed to load Google Maps script"));
      delete window[callbackName];
    };

    document.head.appendChild(script);
  });

  return loaderPromise;
}