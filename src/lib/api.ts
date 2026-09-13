import { Car } from '../types';
import { getToken } from './authApi';

function applyCarFilters(cars: Car[], params: URLSearchParams): Car[] {
  let result = [...cars];
  const make = params.get('make');
  const model = params.get('model');
  const city = params.get('city');
  const transmission = params.get('transmission');
  const fuel = params.get('fuel');
  const body_type = params.get('body_type');
  const condition = params.get('condition');
  const minPrice = params.get('minPrice');
  const maxPrice = params.get('maxPrice');
  const minYear = params.get('minYear');
  const maxYear = params.get('maxYear');
  const minMileage = params.get('minMileage');
  const maxMileage = params.get('maxMileage');
  const search = params.get('search');

  if (make) result = result.filter(c => c.make.toLowerCase() === make.toLowerCase());
  if (model) result = result.filter(c => c.model.toLowerCase().includes(model.toLowerCase()));
  if (city) result = result.filter(c => c.city.toLowerCase() === city.toLowerCase());
  if (transmission) result = result.filter(c => c.transmission === transmission);
  if (fuel) result = result.filter(c => c.fuel === fuel);
  if (body_type) result = result.filter(c => c.body_type.toLowerCase() === body_type.toLowerCase());
  if (condition) result = result.filter(c => c.condition === condition);
  if (minPrice) result = result.filter(c => c.price >= parseInt(minPrice, 10));
  if (maxPrice) result = result.filter(c => c.price <= parseInt(maxPrice, 10));
  if (minYear) result = result.filter(c => c.year >= parseInt(minYear, 10));
  if (maxYear) result = result.filter(c => c.year <= parseInt(maxYear, 10));
  if (minMileage) result = result.filter(c => c.mileage >= parseInt(minMileage, 10));
  if (maxMileage) result = result.filter(c => c.mileage <= parseInt(maxMileage, 10));
  if (search) {
    const q = search.toLowerCase();
    result = result.filter(c =>
      c.make.toLowerCase().includes(q) ||
      c.model.toLowerCase().includes(q) ||
      c.variant.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q)
    );
  }
  return result;
}

async function loadStaticCars(): Promise<Car[]> {
  const res = await fetch('/cars-data.json');
  if (!res.ok) throw new Error('Static car data unavailable');
  return res.json();
}

/** Fetch cars from API, with static JSON fallback for hosts without Express. */
export async function fetchCars(queryString = ''): Promise<Car[]> {
  const qs = queryString.replace(/^\?/, '');
  try {
    const token = getToken();
    const res = await fetch(`/api/cars${qs ? `?${qs}` : ''}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (res.ok) return res.json();
  } catch {
    // fall through
  }
  const cars = await loadStaticCars();
  return applyCarFilters(cars, new URLSearchParams(qs));
}

export async function fetchCarById(id: number | string): Promise<Car> {
  try {
    const token = getToken();
    const res = await fetch(`/api/cars/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (res.ok) return res.json();
  } catch {
    // fall through
  }
  const cars = await loadStaticCars();
  const car = cars.find(c => c.id === Number(id));
  if (!car) throw new Error('Car not found');
  return car;
}
