import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const OSRM_BASE_URL = process.env.OSRM_BASE_URL || 'https://router.project-osrm.org';
const MAPS_USER_AGENT = process.env.MAPS_USER_AGENT || 'TripMate/1.0 (Educational Capstone Project)';

/**
 * Tính khoảng cách đường chim bay giữa 2 tọa độ (Haversine Formula - km)
 */
export const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Bán kính Trái Đất theo km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100; // km làm tròn 2 chữ số
};

/**
 * Thuật toán TSP (Traveling Salesperson Problem) Nearest Neighbor:
 * Tối ưu hóa thứ tự tham quan các địa điểm để quãng đường ngắn nhất (PB06 - tối đa 10 địa điểm)
 */
export const optimizeRouteOrder = (startPoint, places, returnToStart = false) => {
  if (!places || places.length === 0) return [];
  if (places.length === 1) return places;

  // Giới hạn tối đa 10 địa điểm theo quy định PB06
  const limitedPlaces = places.slice(0, 10);
  const unvisited = [...limitedPlaces];
  const route = [];

  let current = startPoint;

  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let shortestDist = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const p = unvisited[i];
      const dist = calculateHaversineDistance(
        Number(current.vi_do),
        Number(current.kinh_do),
        Number(p.vi_do),
        Number(p.kinh_do)
      );
      if (dist < shortestDist) {
        shortestDist = dist;
        nearestIndex = i;
      }
    }

    const [nearestPlace] = unvisited.splice(nearestIndex, 1);
    route.push(nearestPlace);
    current = nearestPlace;
  }

  return route;
};

/**
 * Gọi OSRM Routing API để lấy lộ trình polyline thực tế, khoảng cách và thời gian di chuyển
 */
export const fetchOsrmRoute = async (coordinates) => {
  try {
    if (!coordinates || coordinates.length < 2) {
      return { totalDistanceKm: 0, totalDurationMin: 0, geometry: null };
    }

    // Format OSRM: {lon1},{lat1};{lon2},{lat2};...
    const coordsString = coordinates
      .map(c => `${Number(c.kinh_do)},${Number(c.vi_do)}`)
      .join(';');

    const url = `${OSRM_BASE_URL}/route/v1/driving/${coordsString}?overview=full&geometries=geojson`;

    const response = await axios.get(url, {
      headers: { 'User-Agent': MAPS_USER_AGENT },
      timeout: 10000,
    });

    if (response.data && response.data.routes && response.data.routes.length > 0) {
      const primaryRoute = response.data.routes[0];
      return {
        totalDistanceKm: Math.round((primaryRoute.distance / 1000) * 10) / 10,
        totalDurationMin: Math.round(primaryRoute.duration / 60),
        geometry: primaryRoute.geometry, // GeoJSON Coordinates [ [lon, lat], ... ]
      };
    }

    // Fallback: tính xấp xỉ bằng Haversine nếu OSRM không có route
    return calculateFallbackRoute(coordinates);
  } catch (error) {
    console.warn('OSRM routing request warning (fallback to Haversine):', error.message);
    return calculateFallbackRoute(coordinates);
  }
};

const calculateFallbackRoute = (coordinates) => {
  let totalKm = 0;
  for (let i = 0; i < coordinates.length - 1; i++) {
    totalKm += calculateHaversineDistance(
      Number(coordinates[i].vi_do),
      Number(coordinates[i].kinh_do),
      Number(coordinates[i + 1].vi_do),
      Number(coordinates[i + 1].kinh_do)
    );
  }
  return {
    totalDistanceKm: Math.round(totalKm * 10) / 10,
    totalDurationMin: Math.round(totalKm * 2), // Ước tính 30km/h
    geometry: null,
  };
};
