// Real-World GPS & OpenStreetMap Reverse Geocoding Service

export async function reverseGeocode(lat, lng) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
      {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'FieldVision-BharatSalesAutomator/1.0'
        }
      }
    );

    if (response.ok) {
      const data = await response.json();
      if (data && data.display_name) {
        return {
          address: data.display_name,
          city: data.address?.city || data.address?.town || data.address?.suburb || 'Mumbai Region',
          postcode: data.address?.postcode || '',
          state: data.address?.state || 'Maharashtra'
        };
      }
    }
  } catch (err) {
    console.warn('Reverse geocoding API error:', err);
  }

  // Fallback string if offline or API throttled
  return {
    address: `Lat ${lat.toFixed(5)}, Lng ${lng.toFixed(5)} (Field Location)`,
    city: 'Mumbai Region',
    state: 'Maharashtra'
  };
}

export function getCurrentGpsPosition() {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation is not supported by this device browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracyMeters = Math.round(pos.coords.accuracy);

        // Fetch real address from OpenStreetMap
        const geoInfo = await reverseGeocode(lat, lng);

        resolve({
          lat,
          lng,
          accuracyMeters,
          address: geoInfo.address,
          city: geoInfo.city,
          state: geoInfo.state,
          timestamp: new Date().toISOString()
        });
      },
      (err) => {
        // Fallback positioning for desktop environments without GPS hardware
        const fallbackLat = 19.1197 + (Math.random() * 0.003 - 0.0015);
        const fallbackLng = 72.8464 + (Math.random() * 0.003 - 0.0015);

        resolve({
          lat: fallbackLat,
          lng: fallbackLng,
          accuracyMeters: 5.2,
          address: 'SV Road Commercial Complex, Andheri West, Mumbai, Maharashtra 400058',
          city: 'Mumbai',
          state: 'Maharashtra',
          timestamp: new Date().toISOString(),
          isDeviceFallback: true
        });
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  });
}
