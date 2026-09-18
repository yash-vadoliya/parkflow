import { apiRequest, asRows } from './apiClient';

const idOf = (row, ...keys) => keys.map((key) => row?.[key]).find((value) => value !== undefined && value !== null);

export const normalizeCity = (row) => ({
  ...row,
  id: idOf(row, 'city_id', 'id'),
  name: row?.name || row?.city_name || 'Unnamed city',
  state: row?.state || '',
});

export const normalizeArea = (row) => ({
  ...row,
  id: idOf(row, 'area_id', 'id'),
  city_id: row?.city_id,
  name: row?.area_name || row?.name || 'Unnamed area',
});

export const normalizePlot = (row) => ({
  ...row,
  id: idOf(row, 'plot_id', 'id'),
  name: row?.plot_name || row?.name || 'Unnamed parking plot',
  city_id: row?.city_id,
  area_id: row?.area_id,
  latitude: row?.latitude,
  longitude: row?.longitude,
  city_name: row?.city_name || '',
  area_name: row?.area_name || '',
  address: row?.address || '',
  description: row?.description || '',
  total_car_slots: row?.total_car_slots ?? row?.car_slots ?? null,
  total_bike_slots: row?.total_bike_slots ?? row?.bike_slots ?? null,
  images: Array.isArray(row?.images) ? row.images : [],
  rates: Array.isArray(row?.rates) ? row.rates : [],
  approved: Boolean(row?.approved),
});

export async function loadParkingReferenceData() {
  const [cityPayload, areaPayload, plotPayload] = await Promise.all([
    apiRequest('/city'),
    apiRequest('/area'),
    apiRequest('/parkingplot'),
  ]);

  return {
    cities: asRows(cityPayload).map(normalizeCity),
    areas: asRows(areaPayload).map(normalizeArea),
    plots: asRows(plotPayload).map(normalizePlot),
  };
}
